"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ToastProvider";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, set, get, increment } from "firebase/database";
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

  const config = getMessageType(type);

  // Redirect if unknown type
  useEffect(() => {
    if (type && !MESSAGE_TYPES[type]) {
      router.replace(`/u/${username}`);
    }
  }, [type, username, router]);

  // Pre-fill for deal breaker
  useEffect(() => {
    if (config.preText) setMessage(config.preText);
  }, [config.preText]);

  // Load sender name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("inkognito_sender_name");
    if (saved) setSenderName(saved);
  }, []);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const snap = await getDocs(q);
        if (snap.empty) { setLoading(false); return; }
        setProfile({ uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetchProfile();
  }, [username]);

  // Validation
  function validate(): string | null {
    const text = message.trim();
    const effectiveText = config.preText ? text.replace(config.preText, "").trim() : text;

    if (!text || text.length < 1) return "Message cannot be empty";
    if (config.minChars && effectiveText.length < config.minChars) return `Message must be at least ${config.minChars} characters`;
    if (config.validation === "exactWords3") {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length !== 3) return `Exactly 3 words required (you have ${words.length})`;
    }
    if (config.validation === "hasRating") {
      if (!/\b([1-9]|10)\b/.test(text)) return "Include a rating from 1-10";
    }
    if (text.length > 500) return "Message too long (max 500 characters)";
    return null;
  }

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

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

      // Update unread count
      const countRef = ref(rtdb, `unreadCounts/${profile.uid}`);
      const snap = await get(countRef);
      await set(countRef, (snap.val() || 0) + 1);

      // Send email notification
      if (profile.email) {
        sendEmail("new_message", profile.email, {
          displayName: profile.displayName,
          username: profile.username,
          messagePreview: message.trim(),
          recipientUsername: profile.username,
        });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6" style={{ backgroundColor: "#0A0A0A" }}>
        <p style={{ fontSize: "64px", marginBottom: "16px" }}>👻</p>
        <h1 className="font-display font-bold text-white mb-2" style={{ fontSize: "28px" }}>User not found</h1>
        <p className="font-body text-sm" style={{ color: "#6B7280" }}>This Inkognito profile doesn&apos;t exist.</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6" style={{ backgroundColor: "#0A0A0A" }}>
        <p style={{ fontSize: "64px", marginBottom: "16px" }}>✅</p>
        <h1 className="font-display font-bold text-white mb-2" style={{ fontSize: "28px" }}>Message sent!</h1>
        <p className="font-body text-sm mb-8" style={{ color: "#6B7280" }}>Your {config.badgeLabel.toLowerCase()} message was delivered anonymously.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => { setSent(false); setMessage(config.preText || ""); }} className="font-body text-sm font-bold cursor-pointer w-full" style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "14px", borderRadius: "28px", border: "none" }}>Send another</button>
          <button onClick={() => router.push(`/u/${username}`)} className="font-body text-sm font-bold cursor-pointer w-full" style={{ backgroundColor: "transparent", color: "#A78BFA", padding: "14px", borderRadius: "28px", border: "1px solid rgba(139,92,246,0.3)" }}>Back to profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="w-full max-w-lg">
        {/* Profile Card */}
        <div className="text-center mb-8">
          {profile.photoURL ? (
            <Image src={profile.photoURL} alt={profile.displayName} width={80} height={80} className="rounded-full mx-auto mb-4 object-cover w-20 h-20" />
          ) : (
            <div className="mx-auto mb-4 flex items-center justify-center font-display font-bold text-white text-2xl" style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
              {profile.displayName?.charAt(0) || "?"}
            </div>
          )}
          <h1 className="font-display font-bold text-white mb-1" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>{profile.displayName}</h1>
          <p className="font-body text-sm" style={{ color: "#A78BFA" }}>@{profile.username}</p>
        </div>

        {/* Type badge */}
        <div className="flex justify-center mb-6">
          <span className="font-body text-xs font-extrabold" style={{ background: config.badgeColor, color: config.badgeBorder.replace("0.4", "1"), padding: "4px 12px", borderRadius: "20px", border: `1px solid ${config.badgeBorder}` }}>
            {config.emoji} {config.badgeLabel}
          </span>
        </div>

        {/* Message form */}
        <form onSubmit={handleSend}>
          <div className="mb-6" style={{ backgroundColor: "#141414", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "20px", padding: "24px" }}>
            <p className="font-display font-bold text-white mb-4 text-center" style={{ fontSize: "18px" }}>{config.prompt}</p>

            {config.inputType === "text" ? (
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={config.placeholder}
                maxLength={100}
                className="w-full font-body text-sm outline-none"
                style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF", padding: "14px 18px", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.2)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#8B5CF6"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}
              />
            ) : (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={config.placeholder}
                rows={4}
                maxLength={500}
                className="w-full font-body text-sm outline-none resize-none"
                style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF", padding: "14px 18px", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.2)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#8B5CF6"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}
              />
            )}

            {/* Word/char counter */}
            <div className="flex justify-between mt-2">
              {config.validation === "exactWords3" ? (
                <span className="font-body text-xs" style={{ color: wordCount === 3 ? "#84CC16" : "#6B7280" }}>{wordCount}/3 words</span>
              ) : (
                <span className="font-body text-xs" style={{ color: "#6B7280" }}>{message.length}/500</span>
              )}
            </div>
          </div>

          {/* Sender name toggle */}
          <div className="mb-4 flex items-center gap-3" style={{ padding: "12px 16px", backgroundColor: "#141414", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.1)" }}>
            <button type="button" onClick={() => setShowName(!showName)} className="relative cursor-pointer" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: showName ? "#8B5CF6" : "#333", border: "none", transition: "background 0.2s" }}>
              <span className="absolute top-0.5 rounded-full bg-white transition-all duration-200" style={{ width: 20, height: 20, left: showName ? 22 : 2 }} />
            </button>
            <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {showName ? "✍️ Sending as" : "👻 Sending anonymously"}
            </span>
            {showName && (
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="flex-1 font-body text-sm outline-none"
                style={{ backgroundColor: "transparent", color: "#FFFFFF", border: "none", borderBottom: "1px solid rgba(139,92,246,0.3)", padding: "4px 0" }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={sending || cooldown || !message.trim()}
            className="w-full font-body text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "16px", borderRadius: "28px", border: "none", boxShadow: "0px 0px 24px rgba(139,92,246,0.4)", minHeight: "52px" }}
          >
            {sending ? "Sending..." : cooldown ? "Wait 10s..." : `Send ${config.badgeLabel} ${config.emoji}`}
          </button>
        </form>
      </div>
    </div>
  );
}
