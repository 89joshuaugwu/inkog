"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import {
  collection, query, where, orderBy, onSnapshot,
  deleteDoc, doc, updateDoc
} from "firebase/firestore";
import { ref, onValue, set } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { shareMessageImage, downloadMessageImage } from "@/lib/shareImage";
import { getMessageType, getAvailableTypes } from "@/lib/messageTypes";

interface Message {
  id: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  recipientId: string;
  reaction?: string;
  messageType?: string;
  senderName?: string;
}

const REACTIONS = ["❤️", "😂", "🔥", "😢", "😮", "🙏"];
const PAGE_SIZE = 20;

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [reactingId, setReactingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<"links" | "messages">("links");
  const [selectedTypeIdx, setSelectedTypeIdx] = useState(0);
  const [previewMsg, setPreviewMsg] = useState<Message | null>(null);
  const [tabAnimating, setTabAnimating] = useState(false);

  const allTypes = getAvailableTypes();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && userProfile && !userProfile.onboardingComplete) router.push("/onboarding");
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "messages"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
      setMessagesLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const countRef = ref(rtdb, `unreadCounts/${user.uid}`);
    const unsub = onValue(countRef, (snap) => setUnreadCount(snap.val() || 0));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (activeTab === "messages" && user && unreadCount > 0) {
      set(ref(rtdb, `unreadCounts/${user.uid}`), 0);
    }
  }, [activeTab, user, unreadCount]);

  function switchTab(tab: "links" | "messages") {
    if (tab === activeTab) return;
    setTabAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabAnimating(false);
    }, 180);
  }

  function handleCopyLink() {
    if (!userProfile) return;
    const type = allTypes[selectedTypeIdx];
    const link =
      type.key === "general"
        ? `${window.location.origin}/u/${userProfile.username}`
        : `${window.location.origin}/u/${userProfile.username}/${type.key}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast("Link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareTo(platform: string) {
    if (!userProfile) return;
    const type = allTypes[selectedTypeIdx];
    const link =
      type.key === "general"
        ? `${window.location.origin}/u/${userProfile.username}`
        : `${window.location.origin}/u/${userProfile.username}/${type.key}`;
    const text = encodeURIComponent(`${type.prompt} 👻\n${link}`);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(type.prompt)}`,
    };
    window.open(urls[platform], "_blank");
  }

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteDoc(doc(db, "messages", id));
        toast("Message deleted", "success");
        if (previewMsg?.id === id) setPreviewMsg(null);
      } catch {
        toast("Failed to delete", "error");
      }
      setDeletingId(null);
    },
    [toast, previewMsg]
  );

  const handleReaction = useCallback(
    async (id: string, emoji: string) => {
      try {
        await updateDoc(doc(db, "messages", id), { reaction: emoji });
        setReactingId(null);
      } catch {
        toast("Failed to react", "error");
      }
    },
    [toast]
  );

  const handleShareAsImage = useCallback(
    async (msg: Message) => {
      if (!userProfile) return;
      setSharingId(msg.id);
      try {
        await shareMessageImage(msg.content, userProfile.username, msg.messageType);
      } catch {
        await downloadMessageImage(msg.content, userProfile.username, msg.messageType);
      }
      setSharingId(null);
    },
    [userProfile]
  );

  function formatTime(ts: { seconds: number } | null) {
    if (!ts) return "";
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

  function scrollCarousel(dir: number) {
    const next = Math.max(0, Math.min(allTypes.length - 1, selectedTypeIdx + dir));
    setSelectedTypeIdx(next);
    const el = carouselRef.current?.children[next] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function getMsgFontSize(content: string) {
    if (content.length > 200) return 13;
    if (content.length > 120) return 15;
    if (content.length > 60) return 18;
    return 22;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }}
        />
      </div>
    );
  }
  if (!user || !userProfile) return null;

  const filtered = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const selectedType = allTypes[selectedTypeIdx];

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .tab-content {
          animation: fadeSlideUp 0.22s ease-out;
        }
        .tab-content-exit {
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.18s ease-in;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">

          {/* ── Welcome ── */}
          <div className="mb-6">
            <h1
              className="font-display font-bold text-white mb-1"
              style={{ fontSize: "clamp(26px, 5vw, 36px)", letterSpacing: "-1px" }}
            >
              Hey, {userProfile.displayName?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="font-body text-sm" style={{ color: "#6B7280" }}>
              Manage your links &amp; messages
            </p>
          </div>

          {/* ── Tabs ── */}
          <div
            className="flex gap-2 mb-6 p-1 rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => switchTab("links")}
              className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200 py-3 rounded-xl"
              style={{
                backgroundColor: activeTab === "links" ? "rgba(139,92,246,0.2)" : "transparent",
                color: activeTab === "links" ? "#A78BFA" : "rgba(255,255,255,0.35)",
                border: activeTab === "links" ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                boxShadow: activeTab === "links" ? "0 0 20px rgba(139,92,246,0.15)" : "none",
              }}
            >
              🔗 My Links
            </button>
            <button
              onClick={() => switchTab("messages")}
              className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200 py-3 rounded-xl relative"
              style={{
                backgroundColor: activeTab === "messages" ? "rgba(139,92,246,0.2)" : "transparent",
                color: activeTab === "messages" ? "#A78BFA" : "rgba(255,255,255,0.35)",
                border: activeTab === "messages" ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                boxShadow: activeTab === "messages" ? "0 0 20px rgba(139,92,246,0.15)" : "none",
              }}
            >
              💬 Messages
              {unreadCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 flex items-center justify-center font-body font-extrabold text-white animate-pulse"
                  style={{
                    backgroundColor: "#EF4444",
                    fontSize: 10,
                    minWidth: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "2px solid #0A0A0A",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Tab Content ── */}
          <div className={tabAnimating ? "tab-content-exit" : "tab-content"}>

            {/* ══════════ LINKS TAB ══════════ */}
            {activeTab === "links" && (
              <div>
                {/* Carousel */}
                <div className="relative mb-4">
                  {/* Desktop arrows */}
                  <button
                    onClick={() => scrollCarousel(-1)}
                    disabled={selectedTypeIdx === 0}
                    className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 items-center justify-center cursor-pointer transition-all duration-200"
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      backgroundColor: selectedTypeIdx === 0 ? "rgba(255,255,255,0.04)" : "rgba(139,92,246,0.2)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: selectedTypeIdx === 0 ? "rgba(255,255,255,0.2)" : "#FFFFFF",
                      fontSize: 16,
                    }}
                    aria-label="Previous"
                  >←</button>
                  <button
                    onClick={() => scrollCarousel(1)}
                    disabled={selectedTypeIdx === allTypes.length - 1}
                    className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 items-center justify-center cursor-pointer transition-all duration-200"
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      backgroundColor: selectedTypeIdx === allTypes.length - 1 ? "rgba(255,255,255,0.04)" : "rgba(139,92,246,0.2)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: selectedTypeIdx === allTypes.length - 1 ? "rgba(255,255,255,0.2)" : "#FFFFFF",
                      fontSize: 16,
                    }}
                    aria-label="Next"
                  >→</button>

                  {/* Cards */}
                  <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3"
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const cardWidth = (el.children[0] as HTMLElement)?.clientWidth || 200;
                      const idx = Math.round(el.scrollLeft / (cardWidth + 12));
                      if (idx !== selectedTypeIdx && idx >= 0 && idx < allTypes.length)
                        setSelectedTypeIdx(idx);
                    }}
                  >
                    {allTypes.map((t, i) => {
                      const isFocused = i === selectedTypeIdx;
                      return (
                        <div
                          key={t.key}
                          onClick={() => {
                            setSelectedTypeIdx(i);
                            const el = carouselRef.current?.children[i] as HTMLElement | undefined;
                            el?.scrollIntoView({ behavior: "smooth", inline: "center" });
                          }}
                          className="snap-center shrink-0 cursor-pointer"
                          style={{
                            width: isFocused ? "min(260px, 72vw)" : "min(180px, 48vw)",
                            opacity: isFocused ? 1 : 0.4,
                            transform: isFocused ? "scale(1)" : "scale(0.88)",
                            filter: isFocused ? "none" : "blur(1.5px)",
                            transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        >
                          <div
                            className="relative overflow-hidden"
                            style={{
                              background: isFocused
                                ? `linear-gradient(135deg, ${t.badgeColor}, rgba(10,10,10,0.85))`
                                : "#141414",
                              border: `2px solid ${isFocused ? t.badgeBorder : "rgba(255,255,255,0.05)"}`,
                              borderRadius: "20px",
                              padding: "24px 20px",
                              minHeight: isFocused ? 180 : 130,
                              boxShadow: isFocused ? `0 0 40px ${t.badgeColor}60` : "none",
                              transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            }}
                          >
                            {isFocused && (
                              <div
                                className="absolute top-0 left-0 right-0 h-0.5"
                                style={{ background: `linear-gradient(90deg, ${t.badgeBorder}, transparent)` }}
                              />
                            )}
                            <div style={{ fontSize: isFocused ? 40 : 26, transition: "font-size 0.3s ease" }} className="mb-3">
                              {t.emoji}
                            </div>
                            <p
                              className="font-display font-bold text-white"
                              style={{ fontSize: isFocused ? 17 : 13, letterSpacing: "-0.5px" }}
                            >
                              {t.badgeLabel}
                            </p>
                            {isFocused && (
                              <p className="font-body text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                                {t.prompt}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {allTypes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedTypeIdx(i);
                          const el = carouselRef.current?.children[i] as HTMLElement | undefined;
                          el?.scrollIntoView({ behavior: "smooth", inline: "center" });
                        }}
                        style={{
                          width: i === selectedTypeIdx ? 20 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: i === selectedTypeIdx ? "#8B5CF6" : "rgba(255,255,255,0.15)",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Selected type share card */}
                <div
                  className="mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${selectedType.badgeColor}, rgba(10,10,10,0.6))`,
                    border: `1px solid ${selectedType.badgeBorder}`,
                    borderRadius: "20px",
                    padding: "24px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ fontSize: 28 }}>{selectedType.emoji}</span>
                    <div>
                      <h3
                        className="font-display font-bold text-white"
                        style={{ fontSize: 18, letterSpacing: "-0.5px" }}
                      >
                        {selectedType.badgeLabel} Link
                      </h3>
                      <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {selectedType.prompt}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: copied ? "#84CC16" : "#8B5CF6",
                        color: copied ? "#0A0A0A" : "#FFFFFF",
                        padding: "14px 24px",
                        borderRadius: "28px",
                        border: "none",
                        boxShadow: "0px 0px 20px rgba(139,92,246,0.3)",
                        minHeight: 48,
                      }}
                    >
                      {copied ? "✓ Copied!" : "Copy link"}
                    </button>
                    <div className="flex gap-2">
                      {[
                        { k: "whatsapp", l: "💬", label: "WhatsApp" },
                        { k: "twitter", l: "🐦", label: "Twitter" },
                        { k: "telegram", l: "✈️", label: "Telegram" },
                      ].map((p) => (
                        <button
                          key={p.k}
                          onClick={() => handleShareTo(p.k)}
                          className="cursor-pointer transition-all duration-200 flex items-center justify-center"
                          style={{
                            width: 48, height: 48, borderRadius: "50%",
                            backgroundColor: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.3)",
                            fontSize: 20,
                          }}
                          aria-label={p.label}
                          title={p.label}
                        >
                          {p.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ MESSAGES TAB ══════════ */}
            {activeTab === "messages" && (
              <div>
                {/* Search */}
                {messages.length > 3 && (
                  <div className="relative mb-6">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: "#6B7280" }}
                    >
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full font-body text-sm outline-none"
                      style={{
                        backgroundColor: "#141414",
                        color: "#FFFFFF",
                        padding: "12px 18px 12px 42px",
                        borderRadius: "12px",
                        border: "1px solid rgba(139,92,246,0.2)",
                      }}
                    />
                  </div>
                )}

                {/* Messages */}
                {messagesLoading ? (
                  <div className="flex justify-center py-20">
                    <div
                      className="w-8 h-8 rounded-full border-2 animate-spin"
                      style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }}
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    className="text-center py-20"
                    style={{
                      backgroundColor: "#141414",
                      borderRadius: "20px",
                      border: "1px solid rgba(139,92,246,0.15)",
                    }}
                  >
                    <div className="mb-4" style={{ fontSize: 64, opacity: 0.5 }}>👻</div>
                    <h3 className="font-display font-bold text-white mb-2" style={{ fontSize: 22 }}>
                      No messages yet
                    </h3>
                    <p className="font-body text-sm mb-6" style={{ color: "#6B7280" }}>
                      Share your link to start receiving messages
                    </p>
                    <button
                      onClick={() => switchTab("links")}
                      className="font-body text-sm font-bold cursor-pointer"
                      style={{
                        backgroundColor: "#8B5CF6",
                        color: "#FFFFFF",
                        padding: "14px 28px",
                        borderRadius: "28px",
                        border: "none",
                      }}
                    >
                      Go to My Links
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div
                    className="text-center py-16"
                    style={{
                      backgroundColor: "#141414",
                      borderRadius: "20px",
                      border: "1px solid rgba(139,92,246,0.15)",
                    }}
                  >
                    <p className="font-body text-sm" style={{ color: "#6B7280" }}>
                      No messages matching &quot;{searchQuery}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {visible.map((msg) => {
                      const t = getMessageType(msg.messageType);
                      return (
                        <div
                          key={msg.id}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.06))",
                            border: "1px solid rgba(139,92,246,0.18)",
                            borderRadius: "16px 16px 16px 4px",
                            padding: "16px 18px",
                          }}
                          onClick={() => setPreviewMsg(msg)}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(139,92,246,0.4)";
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(139,92,246,0.18)";
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                          }}
                        >
                          {/* Badge + sender + time */}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="font-body font-extrabold"
                              style={{
                                background: t.badgeColor,
                                border: `1px solid ${t.badgeBorder}`,
                                borderRadius: 6,
                                padding: "2px 8px",
                                color: "rgba(255,255,255,0.8)",
                                fontSize: 10,
                              }}
                            >
                              {t.emoji} {t.badgeLabel}
                            </span>
                            {msg.senderName && (
                              <span className="font-body font-bold" style={{ color: "#A78BFA", fontSize: 10 }}>
                                from {msg.senderName}
                              </span>
                            )}
                            <span className="font-body ml-auto" style={{ color: "#6B7280", fontSize: 10 }}>
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>

                          {/* Content preview */}
                          <p
                            className="font-body text-white text-sm mb-3"
                            style={{
                              fontWeight: 500,
                              lineHeight: "22px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {msg.content}
                          </p>

                          {/* Bottom row: reaction + delete only */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {msg.reaction && <span style={{ fontSize: 16 }}>{msg.reaction}</span>}
                              <span className="font-body text-xs" style={{ color: "rgba(139,92,246,0.6)" }}>
                                Tap to view
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(msg.id);
                              }}
                              disabled={deletingId === msg.id}
                              className="font-body text-xs font-bold cursor-pointer transition-all duration-150"
                              style={{
                                color: "#6B7280",
                                background: "rgba(239,68,68,0.06)",
                                border: "1px solid rgba(239,68,68,0.15)",
                                borderRadius: 8,
                                padding: "4px 12px",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.15)";
                                (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.06)";
                                (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
                              }}
                            >
                              {deletingId === msg.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {hasMore && (
                      <div className="text-center py-4">
                        <button
                          onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}
                          className="font-body text-sm font-bold cursor-pointer"
                          style={{
                            background: "rgba(139,92,246,0.1)",
                            color: "#A78BFA",
                            border: "1px solid rgba(139,92,246,0.3)",
                            borderRadius: 12,
                            padding: "10px 28px",
                          }}
                        >
                          Load more ({filtered.length - visibleCount} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════ MESSAGE PREVIEW MODAL ══════════ */}
        {previewMsg && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(10px)",
              animation: "backdropIn 0.2s ease-out",
            }}
            onClick={() => { setPreviewMsg(null); setReactingId(null); }}
          >
            <div
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: "modalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              {/* Preview card */}
              <div
                className="relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #161622, #141418)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: 24,
                  padding: "32px 24px",
                  boxShadow: "0 0 80px rgba(139,92,246,0.2)",
                }}
              >
                {/* Top gradient bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: "linear-gradient(90deg, #7C3AED, #06B6D4)" }}
                />

                {/* Badge */}
                {(() => {
                  const t = getMessageType(previewMsg.messageType);
                  return (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span
                        className="font-body font-extrabold"
                        style={{
                          background: t.badgeColor,
                          border: `1px solid ${t.badgeBorder}`,
                          borderRadius: 20,
                          padding: "4px 14px",
                          color: "rgba(255,255,255,0.9)",
                          fontSize: 12,
                        }}
                      >
                        {t.emoji} {t.badgeLabel}
                      </span>
                    </div>
                  );
                })()}

                <div className="text-center mb-3" style={{ fontSize: 40 }}>👻</div>
                <p className="font-body text-xs text-center mb-4" style={{ color: "rgba(167,139,250,0.8)" }}>
                  Someone sent you a message
                </p>

                <div
                  className="mb-4"
                  style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }}
                />

                {/* Message — dynamic font size */}
                <p
                  className="font-body text-white text-center mb-4"
                  style={{
                    fontSize: getMsgFontSize(previewMsg.content),
                    fontWeight: 500,
                    lineHeight: 1.6,
                  }}
                >
                  &ldquo;{previewMsg.content}&rdquo;
                </p>

                {previewMsg.senderName && (
                  <p className="font-body text-xs text-center mb-4" style={{ color: "#A78BFA" }}>
                    — {previewMsg.senderName}
                  </p>
                )}

                {previewMsg.reaction && (
                  <div className="text-center mb-4">
                    <span style={{ fontSize: 32 }}>{previewMsg.reaction}</span>
                  </div>
                )}

                <div
                  className="mb-4"
                  style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }}
                />

                <div className="flex items-center justify-between">
                  <span className="font-body text-xs" style={{ color: "#6B7280" }}>
                    {formatTime(previewMsg.createdAt)}
                  </span>
                  <span className="font-body text-xs font-bold" style={{ color: "#A78BFA" }}>
                    @{userProfile.username}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleShareAsImage(previewMsg)}
                  disabled={sharingId === previewMsg.id}
                  className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: "#8B5CF6",
                    color: "#FFFFFF",
                    padding: "14px",
                    borderRadius: 14,
                    border: "none",
                    boxShadow: "0 0 20px rgba(139,92,246,0.3)",
                  }}
                >
                  {sharingId === previewMsg.id ? "Sharing..." : "Share"}
                </button>
                <button
                  onClick={() => setReactingId(reactingId === previewMsg.id ? null : previewMsg.id)}
                  className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: reactingId === previewMsg.id ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.12)",
                    color: "#A78BFA",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  React {previewMsg.reaction || ""}
                </button>
                <button
                  onClick={() => handleDeleteMessage(previewMsg.id)}
                  disabled={deletingId === previewMsg.id}
                  className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.1)",
                    color: "#EF4444",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {deletingId === previewMsg.id ? "..." : "Delete"}
                </button>
              </div>

              {/* Reaction picker */}
              {reactingId === previewMsg.id && (
                <div
                  className="flex justify-center gap-2 mt-2 py-3"
                  style={{
                    backgroundColor: "rgba(20,20,20,0.97)",
                    borderRadius: 16,
                    border: "1px solid rgba(139,92,246,0.2)",
                    animation: "fadeSlideDown 0.2s ease-out",
                  }}
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleReaction(previewMsg.id, r)}
                      className="cursor-pointer transition-transform duration-150 hover:scale-125"
                      style={{
                        fontSize: 28,
                        background: "none",
                        border: "none",
                        padding: 6,
                        opacity: previewMsg.reaction === r ? 1 : 0.55,
                        transform: previewMsg.reaction === r ? "scale(1.2)" : "scale(1)",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Close hint */}
              <p
                className="text-center font-body text-xs mt-3 cursor-pointer"
                style={{ color: "rgba(255,255,255,0.2)" }}
                onClick={() => { setPreviewMsg(null); setReactingId(null); }}
              >
                Tap outside to close
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
