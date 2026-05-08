"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ToastProvider";
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { ref, set, get } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { MESSAGE_TYPES, getMessageType } from "@/lib/messageTypes";
import { sendEmail } from "@/lib/sendEmail";

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  username: string;
  bio: string;
  prompt: string;
  email?: string;
  notificationPrefs?: {
    emailNewMessage?: boolean;
    pushNewMessage?: boolean;
  };
}

export default function TypedMessagePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const username = params.username as string;
  const type = params.type as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [showName, setShowName] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [focused, setFocused] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");

  const config = getMessageType(type);

  // Redirect unknown types
  useEffect(() => {
    if (type && !MESSAGE_TYPES[type]) {
      router.replace(`/u/${username}`);
    }
  }, [type, username, router]);

  // Pre-fill
  useEffect(() => {
    if (config.preText) setMessage(config.preText);
  }, [config.preText]);

  // Load sender name
  useEffect(() => {
    const saved = localStorage.getItem("inkognito_sender_name");
    if (saved) setSenderName(saved);
  }, []);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setProfile({ uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetchProfile();
  }, [username]);

  function validate(): string | null {
    const text = message.trim();
    const effectiveText = config.preText ? text.replace(config.preText.trim(), "").trim() : text;
    if (!text || text.length < 1) return "Message cannot be empty";
    if (config.minChars && effectiveText.length < config.minChars)
      return `At least ${config.minChars} characters needed`;
    if (config.validation === "exactWords3") {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length !== 3) return `Exactly 3 words (you have ${words.length})`;
    }
    if (config.validation === "hasRating") {
      if (!/\b([1-9]|10)\b/.test(text)) return "Include a rating from 1–10";
    }
    if (text.length > 500) return "Max 500 characters";
    return null;
  }

  // Live inline validation
  useEffect(() => {
    if (!message.trim()) { setValidationMsg(""); return; }
    const err = validate();
    setValidationMsg(err || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || sending || cooldown) return;
    const err = validate();
    if (err) { toast(err, "error"); return; }

    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        content: message.trim(),
        recipientId: profile.uid,
        recipientUsername: profile.username,
        messageType: config.key,
        senderName: showName && senderName.trim() ? senderName.trim() : "",
        createdAt: serverTimestamp(),
      });

      // Unread count
      try {
        const countRef = ref(rtdb, `unreadCounts/${profile.uid}`);
        const snap = await get(countRef);
        await set(countRef, (snap.val() || 0) + 1);
      } catch { /* non-critical */ }

      // Email (respect user preference — defaults to enabled)
      if (profile.email && profile.notificationPrefs?.emailNewMessage !== false) {
        sendEmail("new_message", profile.email, {
          displayName: profile.displayName,
          username: profile.username,
          messagePreview: message.trim(),
          recipientUsername: profile.username,
        });
      }

      // Push notification (respect user preference — defaults to enabled)
      if (profile.notificationPrefs?.pushNewMessage !== false) {
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientUid: profile.uid,
            messagePreview: message.trim(),
          }),
        }).catch(() => {});
      }

      if (showName && senderName.trim()) {
        localStorage.setItem("inkognito_sender_name", senderName.trim());
      }

      setSent(true);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
    } catch (error) {
      console.error(error);
      toast("Failed to send. Try again.", "error");
    }
    setSending(false);
  }

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  const charPct = (message.length / 500) * 100;
  const charLeft = 500 - message.length;

  // Extract RGB from badgeColor for ambient glow
  const accentColor = config.badgeBorder.replace("0.4", "1");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6"
        style={{ backgroundColor: "#0A0A0A" }}>
        <p style={{ fontSize: 64, marginBottom: 16 }}>👻</p>
        <h1 className="font-display font-bold text-white mb-2" style={{ fontSize: 28 }}>User not found</h1>
        <p className="font-body text-sm" style={{ color: "#6B7280" }}>This Inkognito profile doesn&apos;t exist.</p>
      </div>
    );
  }

  if (sent) {
    return (
      <>
        <style>{`
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.7); }
            70% { transform: scale(1.08); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6"
          style={{ backgroundColor: "#0A0A0A" }}>
          <div style={{ animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)", fontSize: 80, marginBottom: 16 }}>
            {config.emoji}
          </div>
          <h1 className="font-display font-bold text-white mb-2"
            style={{ fontSize: "clamp(22px,5vw,30px)", letterSpacing: "-0.5px" }}>
            {config.badgeLabel} sent!
          </h1>
          <p className="font-body text-sm mb-8" style={{ color: "#6B7280", maxWidth: 280 }}>
            Your {config.badgeLabel.toLowerCase()} was delivered anonymously to {profile.displayName?.split(" ")[0]}.
          </p>
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 320 }}>
            <button
              onClick={() => { setSent(false); setMessage(config.preText || ""); }}
              className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
              style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "16px", borderRadius: 28, border: "none", boxShadow: "0 0 24px rgba(139,92,246,0.4)", minHeight: 52 }}>
              Send another {config.emoji}
            </button>
            <button
              onClick={() => router.push(`/u/${username}`)}
              className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
              style={{ backgroundColor: "transparent", color: "#A78BFA", padding: "14px", borderRadius: 28, border: "1px solid rgba(139,92,246,0.3)" }}>
              Back to profile
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePop {
          0% { opacity: 0; transform: scale(0.7) translateY(-8px); }
          80% { transform: scale(1.06) translateY(0); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes validationShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .page-fade { animation: fadeUp 0.35s ease-out; }
        .badge-pop { animation: badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .send-btn:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
        {/* Type-specific ambient glow */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: "absolute",
            top: "-30%", left: "50%", transform: "translateX(-50%)",
            width: "80vw", height: "60vh",
            background: `radial-gradient(ellipse, ${config.badgeColor.replace("0.15", "0.12")} 0%, transparent 70%)`,
            transition: "background 0.5s ease",
          }} />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 page-fade">
          <div className="w-full" style={{ maxWidth: 460 }}>

            {/* Profile header */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt={profile.displayName}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    style={{
                      width: 80, height: 80,
                      border: `3px solid ${config.badgeBorder}`,
                      boxShadow: `0 0 20px ${config.badgeColor.replace("0.15", "0.4")}`,
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center font-display font-bold text-white"
                    style={{
                      width: 80, height: 80, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                      fontSize: 28,
                      border: `3px solid ${config.badgeBorder}`,
                      boxShadow: `0 0 20px ${config.badgeColor.replace("0.15", "0.3")}`,
                    }}>
                    {profile.displayName?.charAt(0) || "?"}
                  </div>
                )}
              </div>

              <h1 className="font-display font-bold text-white mb-1"
                style={{ fontSize: "clamp(20px,5vw,26px)", letterSpacing: "-0.5px" }}>
                {profile.displayName}
              </h1>
              <p className="font-body text-sm" style={{ color: "#6B7280" }}>
                @{profile.username}
              </p>
            </div>

            {/* Type badge — large, prominent */}
            <div className="flex justify-center mb-6 badge-pop">
              <div style={{
                background: config.badgeColor,
                border: `1px solid ${config.badgeBorder}`,
                borderRadius: 16,
                padding: "10px 24px",
                textAlign: "center",
                boxShadow: `0 0 20px ${config.badgeColor.replace("0.15", "0.3")}`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>{config.emoji}</div>
                <p className="font-display font-bold" style={{ color: accentColor, fontSize: 14, letterSpacing: "0.5px" }}>
                  {config.badgeLabel.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSend}>
              <div style={{
                backgroundColor: "#111111",
                border: `1px solid ${focused ? config.badgeBorder : "rgba(255,255,255,0.08)"}`,
                borderRadius: 24,
                padding: "24px",
                boxShadow: focused ? `0 0 32px ${config.badgeColor.replace("0.15", "0.15")}` : "none",
                transition: "all 0.3s ease",
                marginBottom: 12,
              }}>
                {/* Prompt */}
                <p className="font-display font-bold text-white text-center mb-5"
                  style={{ fontSize: "clamp(16px,4vw,20px)", lineHeight: 1.4 }}>
                  {config.prompt}
                </p>

                {/* Input */}
                {config.inputType === "text" ? (
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={config.placeholder}
                    maxLength={100}
                    className="w-full font-body outline-none"
                    style={{
                      backgroundColor: "#0A0A0A",
                      color: "#FFFFFF",
                      fontSize: 15,
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: `1px solid ${validationMsg && message.trim() ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.06)"}`,
                      transition: "border-color 0.2s",
                      letterSpacing: "0.5px",
                    }}
                  />
                ) : (
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => e.target.value.length <= 500 && setMessage(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder={config.placeholder || "Type here..."}
                      rows={4}
                      className="w-full font-body text-sm outline-none resize-none"
                      style={{
                        backgroundColor: "#0A0A0A",
                        color: "#FFFFFF",
                        fontSize: 15,
                        lineHeight: "24px",
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `1px solid ${validationMsg && message.trim() ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.06)"}`,
                        minHeight: 120,
                        transition: "border-color 0.2s",
                      }}
                    />
                    {/* Char ring */}
                    <div className="absolute bottom-3 right-3">
                      <svg width="20" height="20" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                        <circle cx="10" cy="10" r="8" fill="none"
                          stroke={charLeft < 50 ? "#EF4444" : accentColor}
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 8}`}
                          strokeDashoffset={`${2 * Math.PI * 8 * (1 - charPct / 100)}`}
                          style={{ transition: "stroke-dashoffset 0.2s ease" }}
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Counters row */}
                <div className="flex items-center justify-between mt-2 px-1">
                  {config.validation === "exactWords3" ? (
                    <span className="font-body text-xs transition-colors duration-200"
                      style={{ color: wordCount === 3 ? "#84CC16" : wordCount > 3 ? "#EF4444" : "#6B7280" }}>
                      {wordCount}/3 words {wordCount === 3 ? "✓" : ""}
                    </span>
                  ) : (
                    <span className="font-body text-xs" style={{ color: "#6B7280" }}>
                      {message.length}/500
                    </span>
                  )}
                  {validationMsg && message.trim() && (
                    <span className="font-body text-xs" style={{ color: "#F59E0B" }}>
                      ⚠️ {validationMsg}
                    </span>
                  )}
                </div>

                {/* Sender toggle */}
                <div className="flex items-center gap-3 mt-4 px-3 py-3 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <button
                    type="button"
                    onClick={() => setShowName(!showName)}
                    className="relative cursor-pointer flex-shrink-0"
                    style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: showName ? accentColor : "rgba(255,255,255,0.1)", border: "none", transition: "background 0.25s" }}>
                    <span className="absolute top-1 rounded-full bg-white transition-all duration-200"
                      style={{ width: 18, height: 18, left: showName ? 20 : 2 }} />
                  </button>
                  <span className="font-body text-xs" style={{ color: showName ? "rgba(255,255,255,0.7)" : "#6B7280" }}>
                    {showName ? "✍️ Sending as" : "👻 Sending anonymously"}
                  </span>
                  {showName && (
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      maxLength={30}
                      className="flex-1 font-body text-xs outline-none"
                      style={{ backgroundColor: "transparent", color: "#FFFFFF", border: "none", borderBottom: `1px solid ${config.badgeBorder}`, padding: "2px 0" }}
                    />
                  )}
                </div>
              </div>

              {/* Send button — type-colored on hover via inline style */}
              <button
                type="submit"
                disabled={sending || cooldown || !message.trim() || Boolean(validationMsg)}
                className="send-btn w-full font-body font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "#FFFFFF",
                  padding: "16px",
                  borderRadius: 28,
                  border: "none",
                  boxShadow: "0 0 24px rgba(139,92,246,0.4)",
                  minHeight: 52,
                  fontSize: 15,
                }}>
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "#FFFFFF", borderTopColor: "transparent" }} />
                    Sending...
                  </span>
                ) : cooldown ? "Wait a moment..." : `Send ${config.badgeLabel} ${config.emoji}`}
              </button>

              <p className="font-body text-xs text-center mt-4" style={{ color: "rgba(255,255,255,0.18)" }}>
                🔒 Completely anonymous. No sender info stored.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
