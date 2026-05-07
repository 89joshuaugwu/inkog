"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, push, set, get } from "firebase/database";
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
  const [charCount, setCharCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [showName, setShowName] = useState(false);
  const [senderName, setSenderName] = useState("");

  const MAX_CHARS = 500;

  useEffect(() => {
    const saved = localStorage.getItem("inkognito_sender_name");
    if (saved) setSenderName(saved);
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setNotFound(true);
        } else {
          setProfile({ uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setNotFound(true);
      }
      setProfileLoading(false);
    }

    if (username) fetchProfile();
  }, [username]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !profile || sending || cooldown) return;

    setSending(true);
    try {
      const docRef = await addDoc(collection(db, "messages"), {
        content: message.trim(),
        recipientId: profile.uid,
        recipientUsername: profile.username,
        messageType: "general",
        senderName: showName && senderName.trim() ? senderName.trim() : "",
        createdAt: serverTimestamp(),
      });

      try {
        const notifRef = ref(rtdb, `notifications/${profile.uid}`);
        await push(notifRef, { messageId: docRef.id, createdAt: Date.now() });
        const countRef = ref(rtdb, `unreadCounts/${profile.uid}`);
        const snapshot = await get(countRef);
        await set(countRef, (snapshot.val() || 0) + 1);
      } catch {
        // RTDB notification is non-critical
      }

      // Email notification
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
      setMessage("");
      setCharCount(0);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast("Failed to send message. Please try again.", "error");
    }
    setSending(false);
  }

  function handleMessageChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setMessage(val);
      setCharCount(val.length);
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ backgroundColor: "#0A0A0A" }}>
        <div style={{ fontSize: "80px", opacity: 0.5, marginBottom: "24px" }}>👻</div>
        <h1 className="font-display font-bold text-white mb-3" style={{ fontSize: "32px", letterSpacing: "-1px" }}>User not found</h1>
        <p className="font-body text-sm mb-8" style={{ color: "#6B7280" }}>This Inkognito profile doesn&apos;t exist</p>
        <Link href="/" className="font-body text-sm font-bold no-underline" style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "14px 28px", borderRadius: "28px", boxShadow: "0px 0px 24px rgba(139,92,246,0.4)" }}>Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Profile Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Profile Header */}
          <div className="text-center mb-8">
            {profile?.photoURL ? (
              <Image src={profile.photoURL} alt={profile.displayName} width={80} height={80} className="rounded-full mx-auto mb-4 w-20 h-20 object-cover" style={{ border: "3px solid rgba(139,92,246,0.4)" }} />
            ) : (
              <div className="mx-auto mb-4 flex items-center justify-center font-display font-bold text-white text-2xl" style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                {profile?.displayName?.charAt(0) || "?"}
              </div>
            )}
            <h1 className="font-display font-bold text-white mb-1" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>{profile?.displayName}</h1>
            <p className="font-body text-sm" style={{ color: "#6B7280" }}>@{profile?.username}</p>
            {profile?.bio && (
              <p className="font-body text-sm mt-3 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.7)", lineHeight: "22px" }}>{profile.bio}</p>
            )}
          </div>

          {/* Message Form */}
          {sent ? (
            <div className="text-center" style={{ backgroundColor: "#141414", border: "1px solid rgba(132,204,22,0.3)", borderRadius: "20px", padding: "48px 32px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
              <h2 className="font-display font-bold text-white mb-2" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Message sent!</h2>
              <p className="font-body text-sm mb-8" style={{ color: "#6B7280" }}>Your anonymous message has been delivered</p>
              <div className="flex flex-col gap-3 items-center">
                <button onClick={() => setSent(false)} disabled={cooldown} className="font-body text-sm font-bold cursor-pointer disabled:opacity-50" style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "14px 28px", borderRadius: "28px", border: "none", boxShadow: "0px 0px 24px rgba(139,92,246,0.4)" }}>
                  {cooldown ? "Wait a moment..." : "Send another"}
                </button>
                <Link href="/login" className="font-body text-xs no-underline" style={{ color: "#8B5CF6" }}>Create your own Inkognito →</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage}>
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0px 8px 32px rgba(0,0,0,0.24)" }}>
                <label className="font-body text-sm font-bold block mb-3" style={{ color: "#0A0A0A" }}>
                  {profile?.prompt || `Send an anonymous message to ${profile?.displayName?.split(" ")[0]}`}
                </label>
                <div className="relative">
                  <textarea
                    id="message-textarea"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Type your anonymous message here... 👀"
                    className="w-full font-body resize-y outline-none transition-all duration-200"
                    style={{ backgroundColor: "#F9F9F9", color: "#0A0A0A", fontSize: "16px", fontWeight: 500, lineHeight: "24px", padding: "20px", borderRadius: "16px", border: "2px solid transparent", minHeight: "120px", boxShadow: "0px 4px 16px rgba(0,0,0,0.1)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.boxShadow = "0px 0px 0px 4px rgba(139,92,246,0.15)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "0px 4px 16px rgba(0,0,0,0.1)"; }}
                  />
                  <span className="absolute bottom-3 right-4 font-body text-xs" style={{ color: "#6B7280" }}>{charCount}/{MAX_CHARS}</span>
                </div>

                {/* Sender name toggle */}
                <div className="flex items-center gap-3 mt-4 py-3 px-4 rounded-xl" style={{ backgroundColor: "#F3F4F6" }}>
                  <button type="button" onClick={() => setShowName(!showName)} className="relative cursor-pointer" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: showName ? "#8B5CF6" : "#D1D5DB", border: "none", transition: "background 0.2s" }}>
                    <span className="absolute top-0.5 rounded-full bg-white transition-all duration-200" style={{ width: 20, height: 20, left: showName ? 22 : 2 }} />
                  </button>
                  <span className="font-body text-sm" style={{ color: "#374151" }}>
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
                      style={{ backgroundColor: "transparent", color: "#0A0A0A", border: "none", borderBottom: "2px solid #8B5CF6", padding: "4px 0" }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!message.trim() || sending || cooldown}
                  id="send-message-btn"
                  className="w-full mt-4 font-body text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "16px 28px", borderRadius: "28px", border: "none", boxShadow: "0px 0px 24px rgba(139,92,246,0.4)", minHeight: "52px" }}
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FFFFFF", borderTopColor: "transparent" }} />
                      Sending...
                    </span>
                  ) : (
                    "Send anonymously 👻"
                  )}
                </button>
              </div>

              <p className="font-body text-xs text-center mt-4" style={{ color: "#6B7280" }}>
                🔒 Your identity is completely hidden. We don&apos;t track or store any sender info.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
