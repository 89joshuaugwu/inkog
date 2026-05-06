"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, onValue, set } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { shareMessageImage, downloadMessageImage } from "@/lib/shareImage";

interface Message {
  id: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  recipientId: string;
  reaction?: string;
}

const REACTIONS = ["❤️", "😂", "🔥", "😢", "😮", "🙏"];
const PAGE_SIZE = 20;

export default function DashboardPage() {
  const { user, userProfile, loading, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reactingId, setReactingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Auth & onboarding guard
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && userProfile && !userProfile.onboardingComplete)
      router.push("/onboarding");
  }, [user, userProfile, loading, router]);

  // Real-time message listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "messages"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]
      );
      setMessagesLoading(false);
    });
    return () => unsub();
  }, [user]);

  // RTDB unread count
  useEffect(() => {
    if (!user) return;
    const unsub = onValue(ref(rtdb, `unreadCounts/${user.uid}`), (s) =>
      setUnreadCount(s.val() || 0)
    );
    return () => unsub();
  }, [user]);

  // Reset unread on view
  useEffect(() => {
    if (!user || unreadCount === 0) return;
    const t = setTimeout(() => set(ref(rtdb, `unreadCounts/${user.uid}`), 0), 2000);
    return () => clearTimeout(t);
  }, [user, unreadCount]);

  const handleCopyLink = useCallback(async () => {
    if (!userProfile) return;
    const link = `${window.location.origin}/u/${userProfile.username}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast("Link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  }, [userProfile, toast]);

  function handleShareTo(platform: string) {
    if (!userProfile) return;
    const link = `${window.location.origin}/u/${userProfile.username}`;
    const text = "Send me anonymous messages on Inkognito! 👻";
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + "\n" + link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank");
    setShareOpen(false);
  }

  async function handleDeleteMessage(id: string) {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "messages", id));
      toast("Message deleted", "info");
    } catch {
      toast("Failed to delete", "error");
    }
    setDeletingId(null);
  }

  async function handleReaction(msgId: string, emoji: string) {
    try {
      const msg = messages.find((m) => m.id === msgId);
      await updateDoc(doc(db, "messages", msgId), {
        reaction: msg?.reaction === emoji ? "" : emoji,
      });
    } catch {
      toast("Failed to react", "error");
    }
    setReactingId(null);
  }

  async function handleShareAsImage(msg: Message) {
    if (!userProfile) return;
    setSharingId(msg.id);
    try {
      await shareMessageImage(msg.content, userProfile.username);
      toast("Image ready!", "success");
    } catch {
      try {
        await downloadMessageImage(msg.content, userProfile.username);
        toast("Image downloaded!", "success");
      } catch {
        toast("Failed to generate image", "error");
      }
    }
    setSharingId(null);
  }

  function formatTime(ts: { seconds: number } | null) {
    if (!ts) return "Just now";
    const diff = Date.now() - ts.seconds * 1000;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(diff / 86400000);
    if (d < 7) return `${d}d ago`;
    return new Date(ts.seconds * 1000).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user || !userProfile) return null;

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/u/${userProfile.username}`;

  // Filter messages
  const filtered = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottomColor: "rgba(139, 92, 246, 0.15)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image src="/logo.png" alt="Inkognito icon" width={36} height={36} priority />
          <span className="font-display text-white font-bold text-[22px]" style={{ letterSpacing: "-0.5px" }}>Inkognito</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="font-body text-sm font-bold no-underline transition-colors duration-200" style={{ color: "rgba(255,255,255,0.6)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>Settings</Link>
          <button onClick={signOut} className="font-body text-sm font-bold cursor-pointer transition-all duration-200" style={{ color: "#FFFFFF", backgroundColor: "transparent", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "28px", padding: "10px 20px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FFFFFF"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.backgroundColor = "transparent"; }}>Sign out</button>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-white mb-2" style={{ fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "-1px" }}>
            Hey, {userProfile.displayName?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="font-body text-sm" style={{ color: "#6B7280" }}>Here are your anonymous messages</p>
        </div>

        {/* Share Link Card */}
        <div className="mb-10" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))", border: "1px solid rgba(139,92,246,0.35)", borderRadius: "20px", padding: "24px" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-white mb-1" style={{ fontSize: "18px", letterSpacing: "-0.5px" }}>Your Inkognito link</h3>
              <p className="font-body text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{shareLink}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyLink} className="font-body text-sm font-bold cursor-pointer transition-all duration-200 whitespace-nowrap" style={{ backgroundColor: copied ? "#84CC16" : "#8B5CF6", color: copied ? "#0A0A0A" : "#FFFFFF", padding: "12px 24px", borderRadius: "28px", border: "none", boxShadow: copied ? "0px 0px 20px rgba(132,204,22,0.35)" : "0px 0px 24px rgba(139,92,246,0.4)", minHeight: "48px" }}>{copied ? "✓ Copied!" : "Copy link"}</button>
              <div className="relative">
                <button onClick={() => setShareOpen(!shareOpen)} className="cursor-pointer transition-all duration-200" style={{ backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#FFFFFF" }} aria-label="Share options">📤</button>
                {shareOpen && (
                  <div className="absolute right-0 top-14 z-10 flex flex-col gap-1" style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "12px", padding: "8px", minWidth: "180px", boxShadow: "0px 8px 32px rgba(0,0,0,0.4)" }}>
                    {[{ key: "whatsapp", label: "WhatsApp", emoji: "💬" }, { key: "twitter", label: "Twitter / X", emoji: "🐦" }, { key: "telegram", label: "Telegram", emoji: "✈️" }].map((p) => (
                      <button key={p.key} onClick={() => handleShareTo(p.key)} className="flex items-center gap-3 w-full font-body text-sm cursor-pointer transition-all duration-150 text-left" style={{ color: "#FFFFFF", background: "transparent", border: "none", padding: "10px 12px", borderRadius: "8px" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.15)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><span>{p.emoji}</span>{p.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Header + Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display font-bold text-white" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Messages</h2>
              {unreadCount > 0 && (
                <span className="font-body text-xs font-extrabold animate-pulse" style={{ background: "rgba(132,204,22,0.15)", color: "#84CC16", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(132,204,22,0.4)" }}>{unreadCount} new</span>
              )}
            </div>
            <span className="font-body text-xs font-extrabold" style={{ background: "rgba(139,92,246,0.12)", color: "#A78BFA", padding: "6px 12px", borderRadius: "20px", border: "1px solid rgba(139,92,246,0.4)" }}>{messages.length} {messages.length === 1 ? "message" : "messages"}</span>
          </div>
          {/* Search bar */}
          {messages.length > 0 && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7280", fontSize: "16px" }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                placeholder="Search messages..."
                className="w-full font-body text-sm outline-none transition-all duration-200"
                style={{ backgroundColor: "#141414", color: "#FFFFFF", padding: "12px 18px 12px 42px", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.2)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.boxShadow = "0px 0px 0px 3px rgba(139,92,246,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          )}
        </div>

        {/* Messages List */}
        {messagesLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20" style={{ backgroundColor: "#141414", borderRadius: "20px", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="mb-4" style={{ fontSize: "64px", opacity: 0.5 }}>👻</div>
            <h3 className="font-display font-bold text-white mb-2" style={{ fontSize: "22px" }}>No messages yet</h3>
            <p className="font-body text-sm mb-6" style={{ color: "#6B7280" }}>Share your link to start receiving anonymous messages</p>
            <button onClick={handleCopyLink} className="font-body text-sm font-bold cursor-pointer" style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF", padding: "14px 28px", borderRadius: "28px", border: "none", boxShadow: "0px 0px 24px rgba(139,92,246,0.4)" }}>Copy your link</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ backgroundColor: "#141414", borderRadius: "20px", border: "1px solid rgba(139,92,246,0.15)" }}>
            <p className="font-body text-sm" style={{ color: "#6B7280" }}>No messages matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map((msg) => (
              <div key={msg.id} className="group relative transition-all duration-200" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.12))", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "16px 16px 16px 4px", padding: "18px 20px" }}>
                {/* Message content */}
                <p className="font-body text-white mb-3" style={{ fontSize: "15px", fontWeight: 500, lineHeight: "24px" }}>{msg.content}</p>

                {/* Reaction display */}
                {msg.reaction && (
                  <div className="mb-3">
                    <span style={{ fontSize: "24px", filter: "drop-shadow(0 0 4px rgba(139,92,246,0.4))" }}>{msg.reaction}</span>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs" style={{ color: "#6B7280" }}>{formatTime(msg.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {/* React button */}
                    <div className="relative">
                      <button onClick={() => setReactingId(reactingId === msg.id ? null : msg.id)} className="font-body text-xs cursor-pointer transition-all duration-150 opacity-60 md:opacity-0 md:group-hover:opacity-100" style={{ color: "#6B7280", background: "none", border: "none", padding: "4px 8px" }} aria-label="React">
                        {msg.reaction || "😊"} React
                      </button>
                      {reactingId === msg.id && (
                        <div className="absolute bottom-full right-0 mb-2 flex gap-1 z-10" style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "12px", padding: "8px", boxShadow: "0px 4px 20px rgba(0,0,0,0.4)" }}>
                          {REACTIONS.map((r) => (
                            <button key={r} onClick={() => handleReaction(msg.id, r)} className="cursor-pointer transition-transform duration-150 hover:scale-125" style={{ fontSize: "22px", background: "none", border: "none", padding: "4px", opacity: msg.reaction === r ? 1 : 0.7 }}>{r}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Share as image */}
                    <button onClick={() => handleShareAsImage(msg)} disabled={sharingId === msg.id} className="font-body text-xs cursor-pointer transition-all duration-150 opacity-60 md:opacity-0 md:group-hover:opacity-100" style={{ color: "#6B7280", background: "none", border: "none", padding: "4px 8px" }} aria-label="Share as image">
                      {sharingId === msg.id ? "..." : "📸 Share"}
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleDeleteMessage(msg.id)} disabled={deletingId === msg.id} className="font-body text-xs cursor-pointer transition-all duration-150 opacity-60 md:opacity-0 md:group-hover:opacity-100" style={{ color: "#6B7280", background: "none", border: "none", padding: "4px 8px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")} aria-label="Delete message">
                      {deletingId === msg.id ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-4">
                <button onClick={() => setVisibleCount((p) => p + PAGE_SIZE)} className="font-body text-sm font-bold cursor-pointer transition-all duration-200" style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "12px", padding: "10px 28px" }}>
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
