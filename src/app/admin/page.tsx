"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection, getDocs, query, orderBy, limit,
  startAfter, deleteDoc, doc, getCountFromServer,
  QueryDocumentSnapshot, DocumentData,
} from "firebase/firestore";
import { getAvailableTypes, getMessageType } from "@/lib/messageTypes";

// ── Constants ────────────────────────────────────────────────
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@inkognito.com").split(",");
const FLAG_KEYWORDS = ["kill", "die", "hate", "abuse", "rape", "threat", "suicide", "bomb", "attack", "harass", "murder"];
const PAGE_SIZE = 20;

type Tab = "overview" | "users" | "messages" | "moderation";

// ── Interfaces ───────────────────────────────────────────────
interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  onboardingComplete: boolean;
  createdAt: { seconds: number } | null;
  photoURL?: string;
}

interface MessageRow {
  id: string;
  content: string;
  recipientUsername: string;
  recipientId: string;
  messageType?: string;
  senderName?: string;
  createdAt: { seconds: number } | null;
}

function isFlagged(content: string): boolean {
  const lower = content.toLowerCase();
  return FLAG_KEYWORDS.some(kw => lower.includes(kw));
}

function getFoundKeyword(content: string): string {
  const lower = content.toLowerCase();
  return FLAG_KEYWORDS.find(kw => lower.includes(kw)) || "";
}

// ── Confirm Modal ────────────────────────────────────────────
function ConfirmModal({
  title, body, confirmLabel, onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "#161616",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: 20, padding: "28px 24px",
          boxShadow: "0 0 60px rgba(239,68,68,0.12)",
          animation: "adminModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="text-center mb-3" style={{ fontSize: 44 }}>⚠️</div>
        <h3 className="font-display font-bold text-white text-center mb-2"
          style={{ fontSize: 20, letterSpacing: "-0.5px" }}>
          {title}
        </h3>
        <p className="font-body text-sm text-center mb-6"
          style={{ color: "#6B7280", lineHeight: "20px" }}>
          {body}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.55)",
              padding: "12px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: "rgba(239,68,68,0.15)",
              color: "#EF4444", padding: "12px", borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.4)",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.15)")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mini SVG Bar Chart ────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const slotW = 100 / data.length;

  return (
    <svg width="100%" height="90" viewBox="0 0 280 90" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * 58 : 0;
        const bw = 18;
        const x = (i / data.length) * 280 + (280 / data.length - bw) / 2;
        const y = 64 - barH;
        return (
          <g key={i}>
            <rect x={x} y={6} width={bw} height={58} rx={4} fill="rgba(255,255,255,0.04)" />
            {barH > 0 && (
              <rect x={x} y={y} width={bw} height={barH} rx={4} fill="url(#barG)" opacity={0.85} />
            )}
            {d.value > 0 && (
              <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize="8"
                fill="rgba(255,255,255,0.6)" fontFamily="sans-serif" fontWeight="bold">
                {d.value}
              </text>
            )}
            <text x={x + bw / 2} y={80} textAnchor="middle" fontSize="8"
              fill="rgba(255,255,255,0.35)" fontFamily="sans-serif">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Type Breakdown Bars ──────────────────────────────────────
function TypeBreakdown({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  if (data.length === 0) return (
    <p className="font-body text-xs text-center py-4" style={{ color: "#6B7280" }}>No messages yet</p>
  );
  return (
    <div className="flex flex-col gap-2">
      {data.slice(0, 6).map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="font-body text-xs" style={{ color: "rgba(255,255,255,0.6)", minWidth: 90, fontSize: 11 }}>
            {d.label}
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="font-body font-bold text-white" style={{ fontSize: 11, minWidth: 24, textAlign: "right" }}>
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Data
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [allMessages, setAllMessages] = useState<MessageRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lastUserDoc, setLastUserDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastMsgDoc, setLastMsgDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [msgTypeFilter, setMsgTypeFilter] = useState("all");
  const [msgDateFilter, setMsgDateFilter] = useState("all");

  // UI state
  const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string; body: string; confirmLabel: string; onConfirm: () => void;
  } | null>(null);

  const allTypes = getAvailableTypes();

  // ── Auth ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user && ADMIN_EMAILS.includes(user.email || "")) {
        setAdminUser(user);
      } else {
        setAdminUser(null);
        router.push("/admin/login");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── Counts ────────────────────────────────────────────────
  useEffect(() => {
    if (!adminUser) return;
    async function fetchCounts() {
      try {
        const [uc, mc] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "messages")),
        ]);
        setTotalUsers(uc.data().count);
        setTotalMessages(mc.data().count);
      } catch (e) { console.error(e); }
    }
    fetchCounts();
  }, [adminUser]);

  // ── Fetch Users ───────────────────────────────────────────
  const fetchUsers = useCallback(async (loadMore = false) => {
    setUsersLoading(true);
    try {
      const q = loadMore && lastUserDoc
        ? query(collection(db, "users"), orderBy("createdAt", "desc"), startAfter(lastUserDoc), limit(PAGE_SIZE))
        : query(collection(db, "users"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRow));
      setAllUsers(prev => loadMore ? [...prev, ...rows] : rows);
      setLastUserDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMoreUsers(snap.docs.length === PAGE_SIZE);
    } catch (e) { console.error(e); }
    setUsersLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch Messages ────────────────────────────────────────
  const fetchMessages = useCallback(async (loadMore = false) => {
    setMessagesLoading(true);
    try {
      const q = loadMore && lastMsgDoc
        ? query(collection(db, "messages"), orderBy("createdAt", "desc"), startAfter(lastMsgDoc), limit(PAGE_SIZE))
        : query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageRow));
      setAllMessages(prev => loadMore ? [...prev, ...rows] : rows);
      setLastMsgDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMoreMessages(snap.docs.length === PAGE_SIZE);
    } catch (e) { console.error(e); }
    setMessagesLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initial data load ─────────────────────────────────────
  useEffect(() => {
    if (!adminUser || dataLoaded) return;
    fetchUsers();
    fetchMessages();
    setDataLoaded(true);
  }, [adminUser, dataLoaded, fetchUsers, fetchMessages]);

  // ── Delete message ────────────────────────────────────────
  function confirmDeleteMessage(id: string) {
    setConfirmModal({
      title: "Delete this message?",
      body: "This action is permanent and cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "messages", id));
          setAllMessages(prev => prev.filter(m => m.id !== id));
          setTotalMessages(prev => prev - 1);
          setSelectedMsgs(prev => { const s = new Set(prev); s.delete(id); return s; });
        } catch (e) { console.error(e); }
        setConfirmModal(null);
      },
    });
  }

  // ── Bulk delete ───────────────────────────────────────────
  function confirmBulkDelete() {
    const ids = Array.from(selectedMsgs);
    setConfirmModal({
      title: `Delete ${ids.length} messages?`,
      body: "All selected messages will be permanently deleted.",
      confirmLabel: `Delete ${ids.length}`,
      onConfirm: async () => {
        try {
          await Promise.all(ids.map(id => deleteDoc(doc(db, "messages", id))));
          setAllMessages(prev => prev.filter(m => !ids.includes(m.id)));
          setTotalMessages(prev => prev - ids.length);
          setSelectedMsgs(new Set());
        } catch (e) { console.error(e); }
        setConfirmModal(null);
      },
    });
  }

  // ── Delete user ───────────────────────────────────────────
  function confirmDeleteUser(u: UserRow) {
    setConfirmModal({
      title: `Delete @${u.username || u.displayName}?`,
      body: "This removes the user record. Their messages remain unless deleted separately.",
      confirmLabel: "Delete User",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", u.uid));
          setAllUsers(prev => prev.filter(x => x.uid !== u.uid));
          setTotalUsers(prev => prev - 1);
        } catch (e) { console.error(e); }
        setConfirmModal(null);
      },
    });
  }

  // ── Computed: filtered users ──────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers;
    const q = userSearch.toLowerCase();
    return allUsers.filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  // ── Computed: filtered messages ───────────────────────────
  const filteredMessages = useMemo(() => {
    let result = allMessages;
    if (msgSearch.trim()) {
      const q = msgSearch.toLowerCase();
      result = result.filter(m =>
        m.content?.toLowerCase().includes(q) ||
        m.recipientUsername?.toLowerCase().includes(q)
      );
    }
    if (msgTypeFilter !== "all") {
      result = result.filter(m => (m.messageType || "general") === msgTypeFilter);
    }
    if (msgDateFilter !== "all") {
      const cutoff = {
        today: Date.now() - 86400000,
        week: Date.now() - 7 * 86400000,
        month: Date.now() - 30 * 86400000,
      }[msgDateFilter] || 0;
      result = result.filter(m => m.createdAt && m.createdAt.seconds * 1000 >= cutoff);
    }
    return result;
  }, [allMessages, msgSearch, msgTypeFilter, msgDateFilter]);

  // ── Computed: flagged messages ────────────────────────────
  const flaggedMessages = useMemo(() =>
    allMessages.filter(m => isFlagged(m.content)), [allMessages]);

  // ── Computed: messages per day ────────────────────────────
  const messagesPerDay = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const count = allMessages.filter(m =>
        m.createdAt &&
        m.createdAt.seconds * 1000 >= dayStart.getTime() &&
        m.createdAt.seconds * 1000 <= dayEnd.getTime()
      ).length;
      days.push({ label, value: count });
    }
    return days;
  }, [allMessages]);

  // ── Computed: type breakdown ──────────────────────────────
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allMessages.forEach(m => {
      const t = m.messageType || "general";
      counts[t] = (counts[t] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      general: "#8B5CF6", rate: "#06B6D4", describe: "#A78BFA",
      confess: "#7C3AED", ship: "#EC4899", surgery: "#84CC16",
      savage: "#EF4444", db: "#F59E0B", gbas: "#EF4444", crush: "#EC4899",
    };
    return allTypes
      .filter(t => (counts[t.key] || 0) > 0)
      .map(t => ({ label: `${t.emoji} ${t.badgeLabel}`, value: counts[t.key] || 0, color: colorMap[t.key] || "#8B5CF6" }))
      .sort((a, b) => b.value - a.value);
  }, [allMessages, allTypes]);

  // ── Stats ─────────────────────────────────────────────────
  const now = Date.now();
  const todayCount = allMessages.filter(m => m.createdAt && (now - m.createdAt.seconds * 1000) < 86400000).length;
  const weekCount = allMessages.filter(m => m.createdAt && (now - m.createdAt.seconds * 1000) < 7 * 86400000).length;
  const activeUsersCount = allUsers.filter(u => u.onboardingComplete).length;
  const avgMsgsPerUser = totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : "0";

  // ── Helpers ───────────────────────────────────────────────
  function formatDate(ts: { seconds: number } | null) {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function formatRelative(ts: { seconds: number } | null) {
    if (!ts) return "—";
    const diff = Date.now() - ts.seconds * 1000;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#EF4444", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!adminUser) return null;

  const tabs: { key: Tab; label: string; emoji: string; count?: number; alert?: boolean }[] = [
    { key: "overview", label: "Overview", emoji: "📊" },
    { key: "users", label: "Users", emoji: "👥", count: totalUsers },
    { key: "messages", label: "Messages", emoji: "💬", count: totalMessages },
    { key: "moderation", label: "Moderation", emoji: "🚨", count: flaggedMessages.length, alert: flaggedMessages.length > 0 },
  ];

  return (
    <>
      <style>{`
        @keyframes adminModalIn {
          from { opacity: 0; transform: scale(0.9) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-content { animation: adminFadeUp 0.2s ease-out; }
        .admin-row { transition: background-color 0.15s ease; }
        .admin-row:hover { background-color: rgba(255,255,255,0.03) !important; }
      `}</style>

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          body={confirmModal.body}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>

        {/* ── Navbar ── */}
        <nav
          className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-16 border-b"
          style={{
            backgroundColor: "rgba(10,10,10,0.94)",
            backdropFilter: "blur(16px)",
            borderBottomColor: "rgba(239,68,68,0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <Image src="/logo.png" alt="Inkognito" width={30} height={30} priority />
              <span className="font-display text-white font-bold text-xl" style={{ letterSpacing: "-0.5px" }}>
                Inkognito
              </span>
            </Link>
            <span
              className="font-body font-extrabold"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.22)",
                letterSpacing: "0.5px",
              }}
            >
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-body text-xs text-white" style={{ fontWeight: 500 }}>
                {adminUser.displayName || "Admin"}
              </span>
              <span className="font-body text-[10px]" style={{ color: "#6B7280" }}>
                {adminUser.email}
              </span>
            </div>
            <button
              onClick={() => signOut(auth).then(() => router.push("/admin/login"))}
              className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
              style={{
                color: "#FFFFFF",
                backgroundColor: "transparent",
                border: "1.5px solid rgba(239,68,68,0.3)",
                borderRadius: 28, padding: "7px 16px",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#EF4444";
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Sign out
            </button>
          </div>
        </nav>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

          {/* Page header */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display font-bold text-white mb-1"
                style={{ fontSize: "clamp(22px,4vw,30px)", letterSpacing: "-1px" }}>
                Admin Dashboard
              </h1>
              <p className="font-body text-xs" style={{ color: "#6B7280" }}>
                {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {flaggedMessages.length > 0 && (
              <button
                onClick={() => setActiveTab("moderation")}
                className="flex items-center gap-2 cursor-pointer transition-all duration-200 flex-shrink-0"
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 12, padding: "8px 14px",
                  animation: "pulse 2s infinite",
                }}
              >
                <span style={{ fontSize: 14 }}>🚨</span>
                <span className="font-body text-xs font-bold" style={{ color: "#EF4444" }}>
                  {flaggedMessages.length} flagged
                </span>
              </button>
            )}
          </div>

          {/* ── Tabs ── */}
          <div
            className="flex gap-1.5 mb-8 p-1 rounded-2xl overflow-x-auto scrollbar-hide"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 font-body text-sm font-bold cursor-pointer transition-all duration-200 whitespace-nowrap rounded-xl"
                style={{
                  backgroundColor: activeTab === tab.key ? "rgba(239,68,68,0.14)" : "transparent",
                  color: activeTab === tab.key ? "#EF4444" : "rgba(255,255,255,0.35)",
                  border: activeTab === tab.key ? "1px solid rgba(239,68,68,0.32)" : "1px solid transparent",
                  padding: "9px 16px",
                  boxShadow: activeTab === tab.key ? "0 0 16px rgba(239,68,68,0.1)" : "none",
                }}
              >
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="font-body font-extrabold"
                    style={{
                      backgroundColor: tab.alert ? "#EF4444" : "rgba(255,255,255,0.08)",
                      color: tab.alert ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                      fontSize: 10, padding: "1px 6px",
                      borderRadius: 10, minWidth: 20, textAlign: "center",
                    }}
                  >
                    {tab.count > 999 ? `${Math.floor(tab.count / 1000)}k` : tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════════ OVERVIEW TAB ══════════════ */}
          {activeTab === "overview" && (
            <div className="tab-content">

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                  { label: "Total Users", value: totalUsers.toLocaleString(), emoji: "👥", color: "#8B5CF6", glow: "rgba(139,92,246,0.1)" },
                  { label: "Total Messages", value: totalMessages.toLocaleString(), emoji: "💬", color: "#06B6D4", glow: "rgba(6,182,212,0.1)" },
                  { label: "Active Users", value: activeUsersCount.toLocaleString(), emoji: "✅", color: "#84CC16", glow: "rgba(132,204,22,0.1)" },
                  { label: "Messages Today", value: todayCount.toLocaleString(), emoji: "📅", color: "#F59E0B", glow: "rgba(245,158,11,0.1)" },
                  { label: "This Week", value: weekCount.toLocaleString(), emoji: "📈", color: "#EC4899", glow: "rgba(236,72,153,0.1)" },
                  { label: "Avg / User", value: avgMsgsPerUser, emoji: "🎯", color: "#EF4444", glow: "rgba(239,68,68,0.1)" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="transition-all duration-200 cursor-default"
                    style={{
                      background: `linear-gradient(135deg, ${s.glow}, rgba(10,10,10,0.3))`,
                      border: `1px solid ${s.color}22`,
                      borderRadius: 18, padding: "18px 20px",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${s.color}44`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = `${s.color}22`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-body font-extrabold uppercase"
                        style={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.4px" }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    </div>
                    <p className="font-display font-bold text-white"
                      style={{ fontSize: "clamp(24px,3.5vw,38px)", letterSpacing: "-1px", lineHeight: 1 }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div style={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 18, padding: "20px",
                }}>
                  <p className="font-body font-extrabold mb-4"
                    style={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.5px" }}>
                    MESSAGES — LAST 7 DAYS
                  </p>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center" style={{ height: 90 }}>
                      <div className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
                    </div>
                  ) : (
                    <BarChart data={messagesPerDay} />
                  )}
                </div>

                <div style={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 18, padding: "20px",
                }}>
                  <p className="font-body font-extrabold mb-4"
                    style={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.5px" }}>
                    MESSAGE TYPES
                  </p>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center" style={{ height: 90 }}>
                      <div className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
                    </div>
                  ) : (
                    <TypeBreakdown data={typeBreakdown} />
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent signups */}
                <div style={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 18, padding: "20px",
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-body font-extrabold"
                      style={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.5px" }}>
                      RECENT SIGNUPS
                    </p>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="font-body text-xs cursor-pointer"
                      style={{ color: "#A78BFA", background: "none", border: "none", padding: 0 }}
                    >
                      View all →
                    </button>
                  </div>
                  {allUsers.length === 0 ? (
                    <p className="font-body text-xs" style={{ color: "#6B7280" }}>No users yet</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {allUsers.slice(0, 5).map(u => (
                        <div key={u.uid} className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center font-display font-bold text-white flex-shrink-0"
                            style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #06B6D4)", fontSize: 12 }}
                          >
                            {u.displayName?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-xs font-bold text-white truncate">
                              {u.displayName || "—"}
                            </p>
                            <p className="font-body truncate" style={{ fontSize: 10, color: "#6B7280" }}>
                              @{u.username || "—"}
                            </p>
                          </div>
                          <span className="font-body flex-shrink-0" style={{ color: "#6B7280", fontSize: 10 }}>
                            {formatRelative(u.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent messages */}
                <div style={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 18, padding: "20px",
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-body font-extrabold"
                      style={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.5px" }}>
                      RECENT MESSAGES
                    </p>
                    <button
                      onClick={() => setActiveTab("messages")}
                      className="font-body text-xs cursor-pointer"
                      style={{ color: "#A78BFA", background: "none", border: "none", padding: 0 }}
                    >
                      View all →
                    </button>
                  </div>
                  {allMessages.length === 0 ? (
                    <p className="font-body text-xs" style={{ color: "#6B7280" }}>No messages yet</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {allMessages.slice(0, 5).map(m => {
                        const t = getMessageType(m.messageType);
                        const flagged = isFlagged(m.content);
                        return (
                          <div key={m.id} className="flex items-start gap-2">
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{t.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs text-white truncate" style={{ fontWeight: 500 }}>
                                {m.content.length > 55 ? m.content.slice(0, 55) + "…" : m.content}
                              </p>
                              <p className="font-body" style={{ fontSize: 10, color: "#6B7280" }}>
                                → @{m.recipientUsername} · {formatRelative(m.createdAt)}
                              </p>
                            </div>
                            {flagged && (
                              <span style={{ fontSize: 12, flexShrink: 0 }}>🚨</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ USERS TAB ══════════════ */}
          {activeTab === "users" && (
            <div className="tab-content">
              {/* Search */}
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7280", fontSize: 14 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full font-body text-sm outline-none"
                  style={{
                    backgroundColor: "#111",
                    color: "#FFFFFF",
                    padding: "12px 40px 12px 40px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: "#6B7280", background: "none", border: "none", fontSize: 14 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <p className="font-body text-xs mb-4" style={{ color: "#6B7280" }}>
                {userSearch
                  ? `${filteredUsers.length} result${filteredUsers.length !== 1 ? "s" : ""} for "${userSearch}"`
                  : `Showing ${allUsers.length} of ${totalUsers} users`}
              </p>

              {/* Desktop table */}
              <div className="hidden md:block">
                {filteredUsers.length > 0 ? (
                  <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 3px" }}>
                    <thead>
                      <tr>
                        {["User", "Username", "Email", "Status", "Messages Rcvd", "Joined", "Actions"].map(h => (
                          <th key={h}
                            className="font-body text-left px-4 py-2"
                            style={{ color: "#6B7280", fontSize: 10, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <Fragment key={u.uid}>
                          <tr
                            className="admin-row cursor-pointer"
                            style={{ backgroundColor: expandedUser === u.uid ? "#1C1C1C" : "#141414" }}
                            onClick={() => setExpandedUser(expandedUser === u.uid ? null : u.uid)}
                          >
                            <td className="px-4 py-3 font-body text-sm text-white font-bold"
                              style={{ borderRadius: "10px 0 0 10px" }}>
                              <div className="flex items-center gap-2.5">
                                <div className="flex-shrink-0 flex items-center justify-center font-bold text-white"
                                  style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #06B6D4)", fontSize: 11 }}>
                                  {u.displayName?.charAt(0) || "?"}
                                </div>
                                <span className="truncate" style={{ maxWidth: 110 }}>{u.displayName || "—"}</span>
                                <span style={{ fontSize: 10, color: "#6B7280", flexShrink: 0 }}>
                                  {expandedUser === u.uid ? "▲" : "▼"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-body text-sm" style={{ color: "#A78BFA" }}>
                              {u.username ? `@${u.username}` : "—"}
                            </td>
                            <td className="px-4 py-3 font-body" style={{ color: "#6B7280", fontSize: 12 }}>
                              <span className="truncate block" style={{ maxWidth: 160 }}>{u.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body font-extrabold"
                                style={{
                                  background: u.onboardingComplete ? "rgba(132,204,22,0.1)" : "rgba(245,158,11,0.1)",
                                  color: u.onboardingComplete ? "#84CC16" : "#F59E0B",
                                  fontSize: 10, padding: "3px 8px", borderRadius: 6,
                                }}>
                                {u.onboardingComplete ? "Active" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-body text-sm text-white">
                              {allMessages.filter(m => m.recipientId === u.uid).length}
                            </td>
                            <td className="px-4 py-3 font-body" style={{ color: "#6B7280", fontSize: 12 }}>
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="px-4 py-3" style={{ borderRadius: "0 10px 10px 0" }}>
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                {u.username && (
                                  <a
                                    href={`/u/${u.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-body font-bold no-underline transition-all duration-150"
                                    style={{
                                      color: "#6B7280", fontSize: 11,
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: 6, padding: "3px 8px",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#A78BFA")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
                                  >
                                    View
                                  </a>
                                )}
                                <button
                                  onClick={() => confirmDeleteUser(u)}
                                  className="font-body font-bold cursor-pointer transition-all duration-150"
                                  style={{
                                    color: "#6B7280", fontSize: 11,
                                    background: "rgba(239,68,68,0.06)",
                                    border: "1px solid rgba(239,68,68,0.1)",
                                    borderRadius: 6, padding: "3px 8px",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color = "#EF4444";
                                    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.14)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color = "#6B7280";
                                    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)";
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {expandedUser === u.uid && (
                            <tr>
                              <td colSpan={7} style={{ padding: "0 4px 6px" }}>
                                <div style={{
                                  backgroundColor: "#1C1C1C",
                                  border: "1px solid rgba(139,92,246,0.15)",
                                  borderRadius: 12, padding: "16px 20px",
                                  animation: "adminFadeUp 0.15s ease-out",
                                }}>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                      <p className="font-body font-extrabold uppercase mb-1"
                                        style={{ color: "#6B7280", fontSize: 9, letterSpacing: "0.4px" }}>
                                        User ID
                                      </p>
                                      <p className="font-body text-xs text-white" style={{ wordBreak: "break-all" }}>
                                        {u.uid.slice(0, 20)}…
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-body font-extrabold uppercase mb-1"
                                        style={{ color: "#6B7280", fontSize: 9, letterSpacing: "0.4px" }}>
                                        Messages received (loaded)
                                      </p>
                                      <p className="font-display font-bold text-white" style={{ fontSize: 22 }}>
                                        {allMessages.filter(m => m.recipientId === u.uid).length}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-body font-extrabold uppercase mb-1"
                                        style={{ color: "#6B7280", fontSize: 9, letterSpacing: "0.4px" }}>
                                        Profile URL
                                      </p>
                                      <a
                                        href={`/u/${u.username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-body text-xs no-underline"
                                        style={{ color: "#8B5CF6" }}
                                      >
                                        /u/{u.username}
                                      </a>
                                    </div>
                                    <div>
                                      <p className="font-body font-extrabold uppercase mb-1"
                                        style={{ color: "#6B7280", fontSize: 9, letterSpacing: "0.4px" }}>
                                        Onboarding
                                      </p>
                                      <p className="font-body text-xs"
                                        style={{ color: u.onboardingComplete ? "#84CC16" : "#F59E0B", fontWeight: 700 }}>
                                        {u.onboardingComplete ? "✓ Complete" : "⏳ Incomplete"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16"
                    style={{ backgroundColor: "#111", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>👤</div>
                    <p className="font-body text-sm" style={{ color: "#6B7280" }}>
                      {userSearch ? `No users match "${userSearch}"` : "No users found"}
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredUsers.map(u => (
                  <div key={u.uid}
                    style={{
                      backgroundColor: "#141414",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 14, padding: "14px 16px",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center font-bold text-white flex-shrink-0"
                          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #06B6D4)", fontSize: 13 }}>
                          {u.displayName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-body text-sm font-bold text-white">{u.displayName || "—"}</p>
                          <p className="font-body text-xs" style={{ color: "#A78BFA" }}>@{u.username || "—"}</p>
                        </div>
                      </div>
                      <span className="font-body font-extrabold"
                        style={{
                          background: u.onboardingComplete ? "rgba(132,204,22,0.1)" : "rgba(245,158,11,0.1)",
                          color: u.onboardingComplete ? "#84CC16" : "#F59E0B",
                          fontSize: 10, padding: "3px 8px", borderRadius: 6,
                        }}>
                        {u.onboardingComplete ? "Active" : "Pending"}
                      </span>
                    </div>
                    <p className="font-body text-xs mb-3 truncate" style={{ color: "#6B7280" }}>{u.email}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs" style={{ color: "#6B7280" }}>
                        Joined {formatDate(u.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        {u.username && (
                          <a
                            href={`/u/${u.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-body font-bold no-underline"
                            style={{
                              color: "#A78BFA", fontSize: 12,
                              background: "rgba(139,92,246,0.1)",
                              border: "1px solid rgba(139,92,246,0.2)",
                              borderRadius: 8, padding: "5px 12px",
                            }}
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => confirmDeleteUser(u)}
                          className="font-body font-bold cursor-pointer"
                          style={{
                            color: "#EF4444", fontSize: 12,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 8, padding: "5px 12px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {usersLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
                </div>
              )}

              {hasMoreUsers && !usersLoading && !userSearch && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => fetchUsers(true)}
                    className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                    style={{
                      background: "rgba(139,92,246,0.08)", color: "#A78BFA",
                      border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, padding: "10px 24px",
                    }}
                  >
                    Load more users
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ MESSAGES TAB ══════════════ */}
          {activeTab === "messages" && (
            <div className="tab-content">
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7280", fontSize: 14 }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search content, username..."
                    value={msgSearch}
                    onChange={e => setMsgSearch(e.target.value)}
                    className="w-full font-body text-sm outline-none"
                    style={{
                      backgroundColor: "#111", color: "#FFFFFF",
                      padding: "11px 38px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                  />
                  {msgSearch && (
                    <button
                      onClick={() => setMsgSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: "#6B7280", background: "none", border: "none", fontSize: 13 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={msgTypeFilter}
                  onChange={e => setMsgTypeFilter(e.target.value)}
                  className="font-body text-sm outline-none cursor-pointer"
                  style={{
                    backgroundColor: "#111", color: "#FFFFFF",
                    padding: "11px 14px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.07)", minWidth: 130,
                  }}
                >
                  <option value="all">All types</option>
                  {allTypes.map(t => (
                    <option key={t.key} value={t.key}>{t.emoji} {t.badgeLabel}</option>
                  ))}
                </select>
                <select
                  value={msgDateFilter}
                  onChange={e => setMsgDateFilter(e.target.value)}
                  className="font-body text-sm outline-none cursor-pointer"
                  style={{
                    backgroundColor: "#111", color: "#FFFFFF",
                    padding: "11px 14px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.07)", minWidth: 120,
                  }}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>

              {/* Bulk action bar */}
              {selectedMsgs.size > 0 && (
                <div
                  className="flex items-center justify-between mb-3 px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.22)",
                    animation: "adminFadeUp 0.15s ease-out",
                  }}
                >
                  <span className="font-body text-sm font-bold" style={{ color: "#EF4444" }}>
                    {selectedMsgs.size} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedMsgs(new Set())}
                      className="font-body text-xs cursor-pointer"
                      style={{ color: "#6B7280", background: "none", border: "none", padding: "2px 8px" }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={confirmBulkDelete}
                      className="font-body text-xs font-bold cursor-pointer transition-all duration-200"
                      style={{
                        color: "#FFFFFF", backgroundColor: "#EF4444",
                        border: "none", borderRadius: 8, padding: "6px 14px",
                      }}
                    >
                      Delete {selectedMsgs.size}
                    </button>
                  </div>
                </div>
              )}

              {/* Count + select all */}
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-xs" style={{ color: "#6B7280" }}>
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? "s" : ""}
                  {(msgSearch || msgTypeFilter !== "all" || msgDateFilter !== "all") && " (filtered)"}
                </p>
                {filteredMessages.length > 0 && (
                  <button
                    onClick={() => {
                      if (selectedMsgs.size === filteredMessages.length) {
                        setSelectedMsgs(new Set());
                      } else {
                        setSelectedMsgs(new Set(filteredMessages.map(m => m.id)));
                      }
                    }}
                    className="font-body text-xs font-bold cursor-pointer"
                    style={{ color: "#A78BFA", background: "none", border: "none" }}
                  >
                    {selectedMsgs.size === filteredMessages.length && filteredMessages.length > 0
                      ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>

              {/* Message list */}
              <div className="flex flex-col gap-2">
                {filteredMessages.map(msg => {
                  const t = getMessageType(msg.messageType);
                  const flagged = isFlagged(msg.content);
                  const isSelected = selectedMsgs.has(msg.id);
                  return (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 transition-all duration-150"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(239,68,68,0.07)"
                          : flagged
                          ? "rgba(239,68,68,0.03)"
                          : "#141414",
                        border: `1px solid ${isSelected
                          ? "rgba(239,68,68,0.3)"
                          : flagged
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(255,255,255,0.05)"}`,
                        borderRadius: 12, padding: "13px 16px",
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => {
                          const s = new Set(selectedMsgs);
                          isSelected ? s.delete(msg.id) : s.add(msg.id);
                          setSelectedMsgs(s);
                        }}
                        className="flex-shrink-0 cursor-pointer transition-all duration-150 flex items-center justify-center"
                        style={{
                          width: 18, height: 18, borderRadius: 4, marginTop: 2,
                          backgroundColor: isSelected ? "#EF4444" : "transparent",
                          border: `2px solid ${isSelected ? "#EF4444" : "rgba(255,255,255,0.18)"}`,
                        }}
                      >
                        {isSelected && (
                          <span style={{ color: "white", fontSize: 10, lineHeight: 1, fontWeight: 900 }}>✓</span>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="font-body font-extrabold"
                            style={{
                              background: t.badgeColor,
                              border: `1px solid ${t.badgeBorder}`,
                              borderRadius: 5, padding: "1px 7px",
                              color: "rgba(255,255,255,0.8)", fontSize: 10,
                            }}
                          >
                            {t.emoji} {t.badgeLabel}
                          </span>
                          {flagged && (
                            <span className="font-body font-bold" style={{ color: "#EF4444", fontSize: 10 }}>
                              🚨 Flagged
                            </span>
                          )}
                        </div>
                        <p className="font-body text-sm text-white mb-1" style={{
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {msg.content}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-body text-xs" style={{ color: "#A78BFA" }}>
                            → @{msg.recipientUsername || "unknown"}
                          </span>
                          {msg.senderName && (
                            <span className="font-body text-xs" style={{ color: "#6B7280" }}>
                              from {msg.senderName}
                            </span>
                          )}
                          <span className="font-body text-xs" style={{ color: "#6B7280" }}>
                            {formatRelative(msg.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => confirmDeleteMessage(msg.id)}
                        className="font-body font-bold cursor-pointer transition-all duration-150 flex-shrink-0"
                        style={{
                          color: "#6B7280", fontSize: 12,
                          background: "rgba(239,68,68,0.06)",
                          border: "1px solid rgba(239,68,68,0.1)",
                          borderRadius: 8, padding: "5px 10px",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = "#EF4444";
                          e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.14)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = "#6B7280";
                          e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)";
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>

              {messagesLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }} />
                </div>
              )}

              {!messagesLoading && filteredMessages.length === 0 && (
                <div className="text-center py-16"
                  style={{ backgroundColor: "#111", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>💬</div>
                  <p className="font-body text-sm" style={{ color: "#6B7280" }}>
                    No messages match your filters
                  </p>
                </div>
              )}

              {hasMoreMessages && !messagesLoading && !msgSearch && msgTypeFilter === "all" && msgDateFilter === "all" && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => fetchMessages(true)}
                    className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                    style={{
                      background: "rgba(139,92,246,0.08)", color: "#A78BFA",
                      border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, padding: "10px 24px",
                    }}
                  >
                    Load more messages
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ MODERATION TAB ══════════════ */}
          {activeTab === "moderation" && (
            <div className="tab-content">
              {/* Info banner */}
              <div
                className="flex items-start gap-3 mb-6 px-4 py-4 rounded-xl"
                style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)" }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
                <div>
                  <p className="font-body text-sm font-bold mb-1" style={{ color: "#EF4444" }}>
                    {flaggedMessages.length} message{flaggedMessages.length !== 1 ? "s" : ""} auto-flagged
                  </p>
                  <p className="font-body text-xs" style={{ color: "#6B7280", lineHeight: "18px" }}>
                    Flagged for keywords: <span style={{ color: "rgba(239,68,68,0.7)" }}>
                      {FLAG_KEYWORDS.join(", ")}
                    </span>
                  </p>
                </div>
              </div>

              {flaggedMessages.length === 0 ? (
                <div className="text-center py-20"
                  style={{ backgroundColor: "#111", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                  <h3 className="font-display font-bold text-white mb-2" style={{ fontSize: 22 }}>
                    All clear
                  </h3>
                  <p className="font-body text-sm" style={{ color: "#6B7280" }}>
                    No flagged content to review
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {flaggedMessages.map(msg => {
                    const t = getMessageType(msg.messageType);
                    const kw = getFoundKeyword(msg.content);
                    return (
                      <div
                        key={msg.id}
                        style={{
                          backgroundColor: "#1A1010",
                          border: "1px solid rgba(239,68,68,0.28)",
                          borderRadius: 16, padding: "18px 20px",
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-body font-extrabold"
                                style={{
                                  background: t.badgeColor, border: `1px solid ${t.badgeBorder}`,
                                  borderRadius: 5, padding: "1px 7px", color: "rgba(255,255,255,0.8)", fontSize: 10,
                                }}>
                                {t.emoji} {t.badgeLabel}
                              </span>
                              <span
                                className="font-body font-bold"
                                style={{
                                  backgroundColor: "rgba(239,68,68,0.15)",
                                  color: "#EF4444", fontSize: 10,
                                  padding: "2px 8px", borderRadius: 20,
                                  border: "1px solid rgba(239,68,68,0.3)",
                                }}
                              >
                                🚨 Contains: &quot;{kw}&quot;
                              </span>
                            </div>
                            <p className="font-body text-sm text-white mb-2" style={{ lineHeight: "20px" }}>
                              {msg.content}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="font-body text-xs" style={{ color: "#A78BFA" }}>
                                → @{msg.recipientUsername}
                              </span>
                              <span className="font-body text-xs" style={{ color: "#6B7280" }}>
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => confirmDeleteMessage(msg.id)}
                              className="font-body text-xs font-bold cursor-pointer transition-all duration-200"
                              style={{
                                color: "#FFFFFF", backgroundColor: "#EF4444",
                                border: "none", borderRadius: 8, padding: "8px 16px",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DC2626")}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#EF4444")}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => {
                                // Mark as reviewed by appending a tag (client-side only)
                                setAllMessages(prev =>
                                  prev.map(m =>
                                    m.id === msg.id
                                      ? { ...m, content: m.content + " __reviewed__" }
                                      : m
                                  )
                                );
                              }}
                              className="font-body text-xs font-bold cursor-pointer transition-all duration-200"
                              style={{
                                color: "#6B7280",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 8, padding: "8px 16px",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

