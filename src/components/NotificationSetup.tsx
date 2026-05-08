"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

/**
 * Notification permission banner + FCM setup.
 * Shows a custom UI banner first, then triggers browser permission
 * on user click (required by modern browsers — programmatic calls are blocked).
 * Supports multi-device: adds token to fcmTokens[] array.
 */
export default function NotificationSetup() {
  const { user, userProfile } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [setting, setSetting] = useState(false);

  useEffect(() => {
    if (!user || !userProfile?.onboardingComplete) return;

    // Don't show if browser doesn't support notifications
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    // Don't show if already granted (just register token silently)
    if (Notification.permission === "granted") {
      registerToken();
      return;
    }

    // Don't show if already denied
    if (Notification.permission === "denied") return;

    // Don't show if user dismissed our banner before
    if (sessionStorage.getItem("inkognito_notif_dismissed")) return;

    // Show our custom banner after a short delay
    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  const registerToken = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;

      const { getMessaging, getToken } = await import("firebase/messaging");
      const { default: app } = await import("@/lib/firebase");

      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.warn("[FCM] VAPID key not configured");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token && user) {
        await updateDoc(doc(db, "users", user.uid), {
          fcmTokens: arrayUnion(token),
        });
        sessionStorage.setItem("inkognito_fcm_token", token);
      }
    } catch (err) {
      console.warn("[FCM] Token registration failed:", err);
    }
  }, [user]);

  async function handleEnable() {
    setSetting(true);
    try {
      // This works because it's triggered by a user click
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await registerToken();
      }
    } catch (err) {
      console.warn("[FCM] Permission request failed:", err);
    }
    setSetting(false);
    setShowBanner(false);
  }

  function handleDismiss() {
    setShowBanner(false);
    sessionStorage.setItem("inkognito_notif_dismissed", "true");
  }

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[91] mx-auto max-w-md"
      style={{ animation: "fade-in-up 0.3s ease-out" }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: "rgba(20,20,20,0.97)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.1)",
        }}
      >
        <Image src="/logo.png" alt="Inkognito" width={32} height={32} className="rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-white font-bold">Enable notifications</p>
          <p className="font-body text-xs" style={{ color: "#6B7280" }}>
            Get notified when someone messages you
          </p>
        </div>
        <button
          onClick={handleEnable}
          disabled={setting}
          className="font-body text-xs font-bold cursor-pointer transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "#8B5CF6",
            color: "#FFFFFF",
            padding: "8px 14px",
            borderRadius: 20,
            border: "none",
            whiteSpace: "nowrap",
          }}
        >
          {setting ? "..." : "Enable"}
        </button>
        <button
          onClick={handleDismiss}
          className="cursor-pointer transition-all duration-200 flex-shrink-0"
          style={{
            background: "none",
            border: "none",
            color: "#6B7280",
            fontSize: 18,
            padding: "4px",
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
