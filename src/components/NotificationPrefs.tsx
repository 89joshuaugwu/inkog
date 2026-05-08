"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationPreferences {
  emailNewMessage: boolean;
  emailLoginAlert: boolean;
  pushNewMessage: boolean;
}

const DEFAULTS: NotificationPreferences = {
  emailNewMessage: true,
  emailLoginAlert: true,
  pushNewMessage: true,
};

/**
 * Notification preferences section for the settings page.
 * Toggle switches for email and push notification types.
 * Saves immediately on toggle — no "Save" button needed.
 */
export default function NotificationPrefs() {
  const { user, userProfile } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [saving, setSaving] = useState<string | null>(null);

  // Load prefs from profile
  useEffect(() => {
    if (userProfile) {
      const stored = (userProfile as unknown as Record<string, unknown>).notificationPrefs as Partial<NotificationPreferences> | undefined;
      setPrefs({ ...DEFAULTS, ...stored });
    }
  }, [userProfile]);

  async function togglePref(key: keyof NotificationPreferences) {
    if (!user || saving) return;

    const newValue = !prefs[key];
    const updated = { ...prefs, [key]: newValue };
    setPrefs(updated);
    setSaving(key);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationPrefs: updated,
      });
    } catch (err) {
      console.error("Failed to save notification pref:", err);
      // Revert on failure
      setPrefs(prefs);
    }
    setSaving(null);
  }

  const items: { key: keyof NotificationPreferences; emoji: string; label: string; desc: string; category: "email" | "push" }[] = [
    {
      key: "emailNewMessage",
      emoji: "💬",
      label: "New message email",
      desc: "Get an email when someone sends you a message",
      category: "email",
    },
    {
      key: "emailLoginAlert",
      emoji: "🔐",
      label: "Login alert email",
      desc: "Get an email when your account is signed into",
      category: "email",
    },
    {
      key: "pushNewMessage",
      emoji: "🔔",
      label: "Push notifications",
      desc: "Get a push notification on all your devices",
      category: "push",
    },
  ];

  return (
    <div
      className="mt-8"
      style={{
        backgroundColor: "#141414",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      <h4
        className="font-body text-xs font-extrabold mb-1"
        style={{ color: "#6B7280", letterSpacing: "0.2px" }}
      >
        NOTIFICATIONS
      </h4>
      <p className="font-body text-xs mb-5" style={{ color: "#6B7280" }}>
        Choose how you want to be notified
      </p>

      {/* Email section header */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 14 }}>📧</span>
        <span className="font-body text-xs font-extrabold" style={{ color: "#A78BFA", letterSpacing: "0.3px" }}>
          EMAIL
        </span>
      </div>

      {items
        .filter((i) => i.category === "email")
        .map((item) => (
          <ToggleRow
            key={item.key}
            emoji={item.emoji}
            label={item.label}
            desc={item.desc}
            enabled={prefs[item.key]}
            saving={saving === item.key}
            onToggle={() => togglePref(item.key)}
          />
        ))}

      {/* Divider */}
      <div className="my-4" style={{ height: 1, backgroundColor: "rgba(139,92,246,0.1)" }} />

      {/* Push section header */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 14 }}>📱</span>
        <span className="font-body text-xs font-extrabold" style={{ color: "#A78BFA", letterSpacing: "0.3px" }}>
          IN-APP / PUSH
        </span>
      </div>

      {items
        .filter((i) => i.category === "push")
        .map((item) => (
          <ToggleRow
            key={item.key}
            emoji={item.emoji}
            label={item.label}
            desc={item.desc}
            enabled={prefs[item.key]}
            saving={saving === item.key}
            onToggle={() => togglePref(item.key)}
          />
        ))}
    </div>
  );
}

function ToggleRow({
  emoji,
  label,
  desc,
  enabled,
  saving,
  onToggle,
}: {
  emoji: string;
  label: string;
  desc: string;
  enabled: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-3 rounded-xl mb-1 transition-all duration-150"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
      }}
    >
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-white font-bold">{label}</p>
        <p className="font-body text-xs" style={{ color: "#6B7280" }}>
          {desc}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className="relative cursor-pointer flex-shrink-0 transition-all duration-250"
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: enabled ? "#8B5CF6" : "rgba(255,255,255,0.1)",
          border: "none",
          opacity: saving ? 0.5 : 1,
        }}
        aria-label={`${label}: ${enabled ? "enabled" : "disabled"}`}
      >
        <span
          className="absolute top-[3px] rounded-full bg-white transition-all duration-200"
          style={{
            width: 18,
            height: 18,
            left: enabled ? 23 : 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}
