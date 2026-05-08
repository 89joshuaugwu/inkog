"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA "Add to Home Screen" banner.
 * Only appears when the browser fires beforeinstallprompt (Chromium-based).
 * Dismissable — stores preference in localStorage.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem("inkognito_pwa_dismissed") === "true") return;
    setDismissed(false);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setDismissed(true), 2000);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setTimeout(() => setDismissed(true), 2000);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("inkognito_pwa_dismissed", "true");
  }

  // Don't render if dismissed, not available, or already installed
  if (dismissed || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md"
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
        <Image src="/logo.png" alt="Inkognito" width={32} height={32} className="rounded-lg" />
        <div className="flex-1 min-w-0">
          {installed ? (
            <p className="font-body text-sm text-white font-bold">Installed! ✅</p>
          ) : (
            <>
              <p className="font-body text-sm text-white font-bold">Add Inkognito</p>
              <p className="font-body text-xs" style={{ color: "#6B7280" }}>
                Install for quick access
              </p>
            </>
          )}
        </div>
        {!installed && (
          <>
            <button
              onClick={handleInstall}
              className="font-body text-xs font-bold cursor-pointer transition-all duration-200"
              style={{
                backgroundColor: "#8B5CF6",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                whiteSpace: "nowrap",
              }}
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="cursor-pointer transition-all duration-200"
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
      </div>
    </div>
  );
}
