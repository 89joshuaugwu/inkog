"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Requests browser notification permission on login,
 * gets FCM token using VAPID key, saves token to Firestore.
 * Supports multi-device: adds token to fcmTokens[] array
 * and stores in sessionStorage for cleanup on logout.
 * Renders nothing — pure side-effect component.
 */
export default function NotificationSetup() {
  const { user, userProfile } = useAuth();
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!user || !userProfile?.onboardingComplete || hasRequested.current) return;
    hasRequested.current = true;

    async function setupFCM() {
      try {
        // Check browser support
        if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

        // If permission not yet granted, request it
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;
        }

        if (Notification.permission !== "granted") return;

        // Register service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await navigator.serviceWorker.ready;

        // Dynamic import of firebase/messaging (client-side only)
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
          // Add token to fcmTokens array (arrayUnion prevents duplicates)
          await updateDoc(doc(db, "users", user.uid), {
            fcmTokens: arrayUnion(token),
          });

          // Store this device's token in sessionStorage for logout cleanup
          sessionStorage.setItem("inkognito_fcm_token", token);
        }
      } catch (err) {
        // FCM setup is non-critical — log and continue
        console.warn("[FCM] Setup failed:", err);
      }
    }

    // Delay slightly so it doesn't block initial render
    const timer = setTimeout(setupFCM, 2000);
    return () => clearTimeout(timer);
  }, [user, userProfile]);

  return null;
}
