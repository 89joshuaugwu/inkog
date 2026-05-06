"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user, userProfile, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && userProfile && !userProfile.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setBio(userProfile.bio || "");
      setPrompt(userProfile.prompt || "Send me anonymous messages! 👻");
    }
  }, [userProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        prompt: prompt.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    setSaving(false);
  }

  async function handleCopyLink() {
    if (!userProfile) return;
    const link = `${window.location.origin}/u/${userProfile.username}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user || !userProfile) return null;

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/u/${userProfile.username}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Top Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottomColor: "rgba(139, 92, 246, 0.15)",
        }}
      >
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
        <Link
          href="/dashboard"
          className="font-body text-sm font-bold no-underline transition-colors duration-200"
          style={{ color: "rgba(255,255,255,0.6)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
          }
        >
          ← Dashboard
        </Link>
      </nav>

      {/* Settings Content */}
      <div className="max-w-[600px] mx-auto px-6 py-10">
        <h1
          className="font-display font-bold text-white mb-8"
          style={{
            fontSize: "clamp(28px, 5vw, 36px)",
            letterSpacing: "-1px",
          }}
        >
          Settings
        </h1>

        {/* Share Link Section */}
        <div
          className="mb-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.15))",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <h3
            className="font-display font-bold text-white mb-2"
            style={{ fontSize: "18px", letterSpacing: "-0.5px" }}
          >
            Your share link
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div
              className="flex-1 font-body text-sm px-4 py-3 rounded-xl w-full overflow-hidden"
              style={{
                backgroundColor: "rgba(10, 10, 10, 0.5)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                color: "rgba(255,255,255,0.7)",
                wordBreak: "break-all",
              }}
            >
              {shareLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="font-body text-sm font-bold cursor-pointer transition-all duration-200 whitespace-nowrap shrink-0"
              style={{
                backgroundColor: copied ? "#84CC16" : "#8B5CF6",
                color: copied ? "#0A0A0A" : "#FFFFFF",
                padding: "12px 24px",
                borderRadius: "28px",
                border: "none",
                minHeight: "48px",
              }}
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave}>
          <div
            style={{
              backgroundColor: "#141414",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "20px",
              padding: "32px",
            }}
          >
            <h3
              className="font-display font-bold text-white mb-6"
              style={{ fontSize: "20px", letterSpacing: "-0.5px" }}
            >
              Edit profile
            </h3>

            {/* Username (read only) */}
            <div className="mb-5">
              <label
                className="font-body text-xs font-extrabold block mb-2"
                style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
              >
                USERNAME
              </label>
              <div
                className="font-body text-sm px-4 py-3.5 rounded-xl"
                style={{
                  backgroundColor: "rgba(20, 20, 20, 0.8)",
                  border: "1px solid rgba(139, 92, 246, 0.15)",
                  color: "#6B7280",
                }}
              >
                @{userProfile.username}
              </div>
              <p
                className="font-body text-xs mt-1.5"
                style={{ color: "#6B7280" }}
              >
                Username cannot be changed
              </p>
            </div>

            {/* Display Name */}
            <div className="mb-5">
              <label
                className="font-body text-xs font-extrabold block mb-2"
                style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
              >
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={50}
                className="w-full font-body outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#0A0A0A",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.boxShadow =
                    "0px 0px 0px 3px rgba(139,92,246,0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(139, 92, 246, 0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label
                className="font-body text-xs font-extrabold block mb-2"
                style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
              >
                BIO
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people what kind of messages you want..."
                rows={3}
                maxLength={200}
                className="w-full font-body outline-none resize-y transition-all duration-200"
                style={{
                  backgroundColor: "#0A0A0A",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.boxShadow =
                    "0px 0px 0px 3px rgba(139,92,246,0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(139, 92, 246, 0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Profile Prompt */}
            <div className="mb-8">
              <label
                className="font-body text-xs font-extrabold block mb-2"
                style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
              >
                PROFILE PROMPT
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What do people see on your profile?"
                maxLength={100}
                className="w-full font-body outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#0A0A0A",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.boxShadow =
                    "0px 0px 0px 3px rgba(139,92,246,0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(139, 92, 246, 0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <p
                className="font-body text-xs mt-1.5"
                style={{ color: "#6B7280" }}
              >
                This is the label visitors see on your anonymous message form
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              id="save-profile-btn"
              className="w-full font-body text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: saved ? "#84CC16" : "#8B5CF6",
                color: saved ? "#0A0A0A" : "#FFFFFF",
                padding: "16px 28px",
                borderRadius: "28px",
                border: "none",
                boxShadow: saved
                  ? "0px 0px 20px rgba(132, 204, 22, 0.35)"
                  : "0px 0px 24px rgba(139, 92, 246, 0.4)",
                minHeight: "52px",
              }}
            >
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save changes"}
            </button>
          </div>
        </form>

        {/* Account Info */}
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
            className="font-body text-xs font-extrabold mb-4"
            style={{ color: "#6B7280", letterSpacing: "0.2px" }}
          >
            ACCOUNT
          </h4>
          <div className="flex items-center gap-3">
            {userProfile.photoURL ? (
              <Image
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                width={40}
                height={40}
                className="rounded-full w-10 h-10 object-cover"
              />
            ) : (
              <div
                className="flex items-center justify-center font-display font-bold text-white text-sm"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                }}
              >
                {userProfile.displayName?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <p className="font-body text-sm font-bold text-white">
                {userProfile.displayName}
              </p>
              <p className="font-body text-xs" style={{ color: "#6B7280" }}>
                {userProfile.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
