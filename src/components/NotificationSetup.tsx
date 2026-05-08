"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

/**
 * Notification permission banner + FCM setup.
 * Shows a custom UI banner, triggers browser permission on click.
 * Supports multi-device: adds token to fcmTokens[] array.
 * Shows visible success/error feedback.
 */
export default function NotificationSetup() {
  const { user, userProfile } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user || !userProfile?.onboardingComplete) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    // Already granted — register token silently
    if (Notification.permission === "granted") {
      registerToken();
      return;
    }

    // Already denied — nothing we can do
    if (Notification.permission === "denied") return;

    // User dismissed our banner this session
    if (sessionStorage.getItem("inkognito_notif_dismissed")) return;

    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  const registerToken = useCallback(async () => {
    if (!user) throw new Error("No user");

    // Register the service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    // Dynamic import firebase/messaging
    const { getMessaging, getToken } = await import("firebase/messaging");
    const { default: app } = await import("@/lib/firebase");

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      throw new Error("VAPID key not configured. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to environment.");
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      throw new Error("Failed to get FCM token. Browser may not support push notifications.");
    }

    // Save to Firestore
    await updateDoc(doc(db, "users", user.uid), {
      fcmTokens: arrayUnion(token),
    });

    // Store for logout cleanup
    sessionStorage.setItem("inkognito_fcm_token", token);

    return token;
  }, [user]);

  async function handleEnable() {
    setStatus("requesting");
    setErrorMsg("");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("error");
        setErrorMsg("Permission denied. Enable in browser settings.");
        setTimeout(() => setShowBanner(false), 3000);
        return;
      }

      await registerToken();
      setStatus("success");
      setTimeout(() => setShowBanner(false), 2000);
    } catch (err) {
      console.error("[FCM] Setup failed:", err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Setup failed. Check console.");
      setTimeout(() => setShowBanner(false), 5000);
    }
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
        className="flex flex-col gap-2 px-4 py-3"
        style={{
          backgroundColor: "rgba(20,20,20,0.97)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${status === "error" ? "rgba(239,68,68,0.4)" : status === "success" ? "rgba(132,204,22,0.4)" : "rgba(139,92,246,0.3)"}`,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.1)",
          transition: "border-color 0.3s",
        }}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Inkognito" width={32} height={32} className="rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {status === "success" ? (
              <p className="font-body text-sm font-bold" style={{ color: "#84CC16" }}>
                Notifications enabled ✅
              </p>
            ) : status === "error" ? (
              <p className="font-body text-sm font-bold" style={{ color: "#EF4444" }}>
                Setup failed ❌
              </p>
            ) : (
              <>
                <p className="font-body text-sm text-white font-bold">Enable notifications</p>
                <p className="font-body text-xs" style={{ color: "#6B7280" }}>
                  Know when someone messages you
                </p>
              </>
            )}
          </div>
          {status === "idle" && (
            <>
              <button
                onClick={handleEnable}
                className="font-body text-xs font-bold cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: 20,
                  border: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="cursor-pointer flex-shrink-0"
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
            </>
          )}
          {status === "requesting" && (
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin flex-shrink-0"
              style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }}
            />
          )}
        </div>

        {/* Error detail */}
        {status === "error" && errorMsg && (
          <p className="font-body text-xs px-1" style={{ color: "rgba(239,68,68,0.8)" }}>
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
