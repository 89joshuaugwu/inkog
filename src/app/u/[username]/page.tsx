"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { ref, set, get } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
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

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [showName, setShowName] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [focused, setFocused] = useState(false);

  const MAX_CHARS = 500;

  useEffect(() => {
    const saved = localStorage.getItem("inkognito_sender_name");
    if (saved) setSenderName(saved);
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setNotFound(true);
        } else {
          setProfile({ uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile);
        }
      } catch (error) {
        console.error(error);
        setNotFound(true);
      }
      setProfileLoading(false);
    }
    if (username) fetchProfile();
  }, [username]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !profile || sending || cooldown) return;

    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        content: message.trim(),
        recipientId: profile.uid,
        recipientUsername: profile.username,
        messageType: "general",
        senderName: showName && senderName.trim() ? senderName.trim() : "",
        createdAt: serverTimestamp(),
      });

      // Unread count
      try {
        const countRef = ref(rtdb, `unreadCounts/${profile.uid}`);
        const snap = await get(countRef);
        await set(countRef, (snap.val() || 0) + 1);
      } catch { /* non-critical */ }

      // Email
      if (profile.email) {
        sendEmail("new_message", profile.email, {
          displayName: profile.displayName,
          username: profile.username,
          messagePreview: message.trim(),
          recipientUsername: profile.username,
        });
      }

      // Push notification (fire-and-forget)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUid: profile.uid,
          messagePreview: message.trim(),
        }),
      }).catch(() => {});

      if (showName && senderName.trim()) {
        localStorage.setItem("inkognito_sender_name", senderName.trim());
      }

      setSent(true);
      setMessage("");
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
    } catch (error) {
      console.error(error);
      toast("Failed to send. Try again.", "error");
    }
    setSending(false);
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
        style={{ backgroundColor: "#0A0A0A" }}>
        <div style={{ fontSize: 80, opacity: 0.4, marginBottom: 24 }}>👻</div>
        <h1 className="font-display font-bold text-white mb-3"
          style={{ fontSize: "clamp(24px,5vw,36px)", letterSpacing: "-1px" }}>
          Profile not found
        </h1>
        <p className="font-body text-sm mb-8" style={{ color: "#6B7280" }}>
          This Inkognito profile doesn&apos;t exist
        </p>
        <Link href="/"
          className="font-body text-sm font-bold no-underline"
          style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "14px 32px", borderRadius: 28, boxShadow: "0 0 24px rgba(139,92,246,0.4)" }}>
          Go home
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <>
        <style>{`
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.8) translateY(20px); }
            70% { transform: scale(1.05) translateY(-4px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
          style={{ backgroundColor: "#0A0A0A" }}>
          <div style={{ animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)", fontSize: 80, marginBottom: 24 }}>
            🎉
          </div>
          <h1 className="font-display font-bold text-white mb-2"
            style={{ fontSize: "clamp(22px,5vw,32px)", letterSpacing: "-1px" }}>
            Sent anonymously!
          </h1>
          <p className="font-body text-sm mb-8" style={{ color: "#6B7280", maxWidth: 280 }}>
            {profile?.displayName?.split(" ")[0]} will never know it was you 👻
          </p>
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 320 }}>
            <button
              onClick={() => setSent(false)}
              disabled={cooldown}
              className="font-body text-sm font-bold cursor-pointer disabled:opacity-40 transition-all duration-200"
              style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "16px", borderRadius: 28, border: "none", boxShadow: "0 0 24px rgba(139,92,246,0.4)", minHeight: 52 }}>
              {cooldown ? "Wait a moment..." : "Send another 👻"}
            </button>
            <Link href="/login"
              className="font-body text-sm no-underline text-center transition-all duration-200"
              style={{ color: "#A78BFA", padding: "14px", borderRadius: 28, border: "1px solid rgba(139,92,246,0.25)" }}>
              Create your own Inkognito →
            </Link>
          </div>
        </div>
      </>
    );
  }

  const charLeft = MAX_CHARS - message.length;
  const charPct = (message.length / MAX_CHARS) * 100;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ghostFloat {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .page-fade { animation: fadeUp 0.4s ease-out; }
        .ghost-float { animation: ghostFloat 4s ease-in-out infinite; }
        .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 32px rgba(139,92,246,0.6) !important; }
        .send-btn:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
            width: "70vw", height: "50vh",
            background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 page-fade">
          <div className="w-full" style={{ maxWidth: 460 }}>

            {/* Profile header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                {profile?.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt={profile.displayName}
                    width={88}
                    height={88}
                    className="rounded-full object-cover"
                    style={{ width: 88, height: 88, border: "3px solid rgba(139,92,246,0.5)", boxShadow: "0 0 24px rgba(139,92,246,0.3)" }}
                  />
                ) : (
                  <div className="flex items-center justify-center font-display font-bold text-white"
                    style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #06B6D4)", fontSize: 32, boxShadow: "0 0 24px rgba(139,92,246,0.4)", border: "3px solid rgba(139,92,246,0.4)" }}>
                    {profile?.displayName?.charAt(0) || "?"}
                  </div>
                )}
                {/* Ghost badge */}
                <div className="ghost-float absolute -bottom-2 -right-2 flex items-center justify-center"
                  style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#0A0A0A", border: "2px solid rgba(139,92,246,0.4)", fontSize: 14 }}>
                  👻
                </div>
              </div>

              <h1 className="font-display font-bold text-white mb-1"
                style={{ fontSize: "clamp(22px,5vw,30px)", letterSpacing: "-0.5px" }}>
                {profile?.displayName}
              </h1>
              <p className="font-body text-sm mb-1" style={{ color: "#8B5CF6" }}>
                @{profile?.username}
              </p>
              {profile?.bio && (
                <p className="font-body text-sm mt-3 mx-auto"
                  style={{ color: "rgba(255,255,255,0.55)", lineHeight: "22px", maxWidth: 300 }}>
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Anonymous badge */}
            <div className="flex justify-center mb-6">
              <span className="font-body font-extrabold"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", borderRadius: 20, padding: "5px 16px", color: "#A78BFA", fontSize: 12, letterSpacing: "0.5px" }}>
                👻 Anonymous Message
              </span>
            </div>

            {/* Form card */}
            <form onSubmit={handleSend}>
              <div style={{
                backgroundColor: "#111111",
                border: `1px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(139,92,246,0.15)"}`,
                borderRadius: 24,
                padding: "24px",
                boxShadow: focused ? "0 0 32px rgba(139,92,246,0.12)" : "none",
                transition: "all 0.3s ease",
              }}>
                <p className="font-body text-sm font-bold mb-4 text-center"
                  style={{ color: "rgba(255,255,255,0.8)" }}>
                  {profile?.prompt || `Say something to ${profile?.displayName?.split(" ")[0]} 👀`}
                </p>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => e.target.value.length <= MAX_CHARS && setMessage(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Say anything... they'll never know it was you 👀"
                    rows={4}
                    className="w-full font-body text-sm outline-none resize-none"
                    style={{
                      backgroundColor: "#0A0A0A",
                      color: "#FFFFFF",
                      fontSize: 15,
                      fontWeight: 400,
                      lineHeight: "24px",
                      padding: "16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.06)",
                      minHeight: 120,
                    }}
                  />

                  {/* Char counter ring */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <svg width="20" height="20" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                      <circle
                        cx="10" cy="10" r="8" fill="none"
                        stroke={charLeft < 50 ? "#EF4444" : "#8B5CF6"}
                        strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 8}`}
                        strokeDashoffset={`${2 * Math.PI * 8 * (1 - charPct / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.2s ease" }}
                      />
                    </svg>
                    {charLeft < 50 && (
                      <span className="font-body text-xs" style={{ color: charLeft < 20 ? "#EF4444" : "#F59E0B" }}>
                        {charLeft}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sender name toggle */}
                <div className="flex items-center gap-3 mt-3 px-3 py-3 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    type="button"
                    onClick={() => setShowName(!showName)}
                    className="relative cursor-pointer flex-shrink-0"
                    style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: showName ? "#8B5CF6" : "rgba(255,255,255,0.1)", border: "none", transition: "background 0.25s" }}>
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
                      style={{ backgroundColor: "transparent", color: "#FFFFFF", border: "none", borderBottom: "1px solid rgba(139,92,246,0.4)", padding: "2px 0" }}
                    />
                  )}
                </div>
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={!message.trim() || sending || cooldown}
                className="send-btn w-full font-body text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-4 transition-all duration-200"
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
                ) : cooldown ? "Wait a moment..." : "Send anonymously 👻"}
              </button>

              <p className="font-body text-xs text-center mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
                🔒 Completely anonymous. No sender info stored.
              </p>
            </form>

            {/* Create own link */}
            <div className="text-center mt-8">
              <Link href="/login"
                className="font-body text-xs no-underline"
                style={{ color: "rgba(139,92,246,0.6)" }}>
                Get your own Inkognito link →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
