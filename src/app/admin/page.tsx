"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  doc,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Admin emails — must match admin/login/page.tsx
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@inkognito.com").split(",");

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  onboardingComplete: boolean;
  createdAt: { seconds: number } | null;
}

interface MessageRow {
  id: string;
  content: string;
  recipientUsername: string;
  recipientId: string;
  createdAt: { seconds: number } | null;
}

export default function AdminPage() {
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "messages" | "stats">(
    "stats"
  );
  const [users, setUsers] = useState<UserRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lastUserDoc, setLastUserDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastMsgDoc, setLastMsgDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const PAGE_SIZE = 20;

  // Listen for admin auth state directly from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && ADMIN_EMAILS.includes(user.email || "")) {
        setAdminUser(user);
      } else {
        setAdminUser(null);
        router.push("/admin/login");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch counts
  useEffect(() => {
    if (!adminUser) return;

    async function fetchCounts() {
      try {
        const usersCount = await getCountFromServer(collection(db, "users"));
        const msgsCount = await getCountFromServer(collection(db, "messages"));
        setTotalUsers(usersCount.data().count);
        setTotalMessages(msgsCount.data().count);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    }
    fetchCounts();
  }, [adminUser]);

  // Fetch users
  const fetchUsers = useCallback(
    async (loadMore = false) => {
      setUsersLoading(true);
      try {
        let q;
        if (loadMore && lastUserDoc) {
          q = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            startAfter(lastUserDoc),
            limit(PAGE_SIZE)
          );
        } else {
          q = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE)
          );
        }
        const snapshot = await getDocs(q);
        const rows = snapshot.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        })) as UserRow[];

        if (loadMore) {
          setUsers((prev) => [...prev, ...rows]);
        } else {
          setUsers(rows);
        }
        setLastUserDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMoreUsers(snapshot.docs.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setUsersLoading(false);
    },
    [lastUserDoc]
  );

  // Fetch messages
  const fetchMessages = useCallback(
    async (loadMore = false) => {
      setMessagesLoading(true);
      try {
        let q;
        if (loadMore && lastMsgDoc) {
          q = query(
            collection(db, "messages"),
            orderBy("createdAt", "desc"),
            startAfter(lastMsgDoc),
            limit(PAGE_SIZE)
          );
        } else {
          q = query(
            collection(db, "messages"),
            orderBy("createdAt", "desc"),
            limit(PAGE_SIZE)
          );
        }
        const snapshot = await getDocs(q);
        const rows = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MessageRow[];

        if (loadMore) {
          setMessages((prev) => [...prev, ...rows]);
        } else {
          setMessages(rows);
        }
        setLastMsgDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMoreMessages(snapshot.docs.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
      setMessagesLoading(false);
    },
    [lastMsgDoc]
  );

  useEffect(() => {
    if (!adminUser) return;
    if (activeTab === "users" && users.length === 0) fetchUsers();
    if (activeTab === "messages" && messages.length === 0) fetchMessages();
  }, [activeTab, adminUser, users.length, messages.length, fetchUsers, fetchMessages]);

  async function handleDeleteMessage(messageId: string) {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "messages", messageId));
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setTotalMessages((prev) => prev - 1);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }

  async function handleAdminSignOut() {
    await signOut(auth);
    router.push("/admin/login");
  }

  function formatDate(timestamp: { seconds: number } | null) {
    if (!timestamp) return "—";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (authLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#EF4444", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!adminUser) return null;

  const tabs = [
    { key: "stats" as const, label: "Overview", emoji: "📊" },
    { key: "users" as const, label: "Users", emoji: "👥" },
    { key: "messages" as const, label: "Messages", emoji: "💬" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Top Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottomColor: "rgba(239, 68, 68, 0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Image
              src="/logo.png"
              alt="Inkognito icon"
              width={36}
              height={36}
              priority
            />
            <span
              className="font-display text-white font-bold text-[22px]"
              style={{ letterSpacing: "-0.5px" }}
            >
              Inkognito
            </span>
          </Link>
          <span
            className="font-body text-xs font-extrabold"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#EF4444",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            ADMIN
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-body text-xs hidden sm:block" style={{ color: "#6B7280" }}>
            {adminUser.email}
          </span>
          <button
            onClick={handleAdminSignOut}
            className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
            style={{
              color: "#FFFFFF",
              backgroundColor: "transparent",
              border: "2px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "28px",
              padding: "8px 18px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#EF4444";
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <h1
          className="font-display font-bold text-white mb-8"
          style={{ fontSize: "32px", letterSpacing: "-1px" }}
        >
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 font-body text-sm font-bold cursor-pointer transition-all duration-200 whitespace-nowrap"
              style={{
                backgroundColor:
                  activeTab === tab.key
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(139, 92, 246, 0.06)",
                color:
                  activeTab === tab.key ? "#EF4444" : "rgba(255,255,255,0.5)",
                border: `1px solid ${
                  activeTab === tab.key
                    ? "rgba(239, 68, 68, 0.4)"
                    : "rgba(139, 92, 246, 0.15)"
                }`,
                borderRadius: "12px",
                padding: "10px 20px",
              }}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: "Total Users",
                value: totalUsers,
                emoji: "👥",
                color: "#8B5CF6",
                glow: "rgba(139, 92, 246, 0.15)",
              },
              {
                label: "Total Messages",
                value: totalMessages,
                emoji: "💬",
                color: "#06B6D4",
                glow: "rgba(6, 182, 212, 0.15)",
              },
              {
                label: "Avg Messages/User",
                value:
                  totalUsers > 0
                    ? (totalMessages / totalUsers).toFixed(1)
                    : "0",
                emoji: "📈",
                color: "#84CC16",
                glow: "rgba(132, 204, 22, 0.15)",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${stat.glow}, rgba(10,10,10,0.5))`,
                  border: `1px solid ${stat.color}33`,
                  borderRadius: "20px",
                  padding: "28px",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-body text-xs font-extrabold"
                    style={{ color: "#6B7280" }}
                  >
                    {stat.label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "28px" }}>{stat.emoji}</span>
                </div>
                <p
                  className="font-display font-bold text-white"
                  style={{ fontSize: "40px", letterSpacing: "-1px" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="overflow-x-auto">
              <table
                className="w-full"
                style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}
              >
                <thead>
                  <tr>
                    {["User", "Username", "Email", "Status", "Joined"].map(
                      (h) => (
                        <th
                          key={h}
                          className="font-body text-xs font-extrabold text-left px-4 py-3"
                          style={{ color: "#6B7280" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.uid}
                      className="transition-all duration-150"
                      style={{
                        backgroundColor: "#141414",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1A1A1A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#141414")
                      }
                    >
                      <td
                        className="px-4 py-3 font-body text-sm text-white font-bold"
                        style={{ borderRadius: "12px 0 0 12px" }}
                      >
                        {u.displayName || "—"}
                      </td>
                      <td
                        className="px-4 py-3 font-body text-sm"
                        style={{ color: "#A78BFA" }}
                      >
                        {u.username ? `@${u.username}` : "—"}
                      </td>
                      <td
                        className="px-4 py-3 font-body text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-body text-xs font-extrabold"
                          style={{
                            background: u.onboardingComplete
                              ? "rgba(132,204,22,0.12)"
                              : "rgba(239,68,68,0.12)",
                            color: u.onboardingComplete ? "#84CC16" : "#EF4444",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {u.onboardingComplete ? "Active" : "Pending"}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 font-body text-xs"
                        style={{
                          color: "#6B7280",
                          borderRadius: "0 12px 12px 0",
                        }}
                      >
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersLoading && (
              <div className="flex justify-center py-8">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{
                    borderColor: "#8B5CF6",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}
            {hasMoreUsers && !usersLoading && (
              <div className="text-center mt-6">
                <button
                  onClick={() => fetchUsers(true)}
                  className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    color: "#A78BFA",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "12px",
                    padding: "10px 24px",
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start justify-between gap-4 transition-all duration-150"
                style={{
                  backgroundColor: "#141414",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="font-body text-sm text-white mb-2"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {msg.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-body text-xs"
                      style={{ color: "#A78BFA" }}
                    >
                      → @{msg.recipientUsername || "unknown"}
                    </span>
                    <span
                      className="font-body text-xs"
                      style={{ color: "#6B7280" }}
                    >
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="font-body text-xs cursor-pointer transition-colors duration-150 shrink-0"
                  style={{
                    color: "#6B7280",
                    background: "none",
                    border: "none",
                    padding: "4px 8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#EF4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#6B7280")
                  }
                  aria-label="Delete message"
                >
                  🗑
                </button>
              </div>
            ))}
            {messagesLoading && (
              <div className="flex justify-center py-8">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{
                    borderColor: "#8B5CF6",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}
            {hasMoreMessages && !messagesLoading && (
              <div className="text-center mt-4">
                <button
                  onClick={() => fetchMessages(true)}
                  className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    color: "#A78BFA",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "12px",
                    padding: "10px 24px",
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
