"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingPage() {
  const { user, userProfile, loading, checkUsernameAvailable, completeOnboarding } =
    useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [prompt, setPrompt] = useState("Send me anonymous messages! 👻");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in or already onboarded
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && userProfile?.onboardingComplete) {
      router.push("/dashboard");
    }
  }, [user, userProfile, loading, router]);

  // Prefill display name from Google
  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
  }, [userProfile]);

  // Debounced username check
  const checkUsername = useCallback(
    async (value: string) => {
      const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleaned.length < 3) {
        setUsernameStatus("invalid");
        return;
      }
      if (cleaned.length > 20) {
        setUsernameStatus("invalid");
        return;
      }
      setUsernameStatus("checking");
      try {
        const available = await checkUsernameAvailable(cleaned);
        setUsernameStatus(available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    },
    [checkUsernameAvailable]
  );

  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (val.length <= 20) setUsername(val);
  }

  async function handleComplete() {
    if (usernameStatus !== "available" || !displayName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await completeOnboarding({
        username: username.toLowerCase(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        prompt: prompt.trim() || "Send me anonymous messages! 👻",
      });
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    }
    setSaving(false);
  }

  if (loading || !user || userProfile?.onboardingComplete) {
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

  const promptSuggestions = [
    "Send me anonymous messages! 👻",
    "Tell me what you really think 💭",
    "Rate me honestly, no filter 🔥",
    "Confess something... I won't judge 🤫",
    "What's your honest opinion of me? 👀",
    "Drop a truth bomb 💣",
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <Image
              src="/logo.png"
              alt="Inkognito icon"
              width={44}
              height={44}
              priority
            />
            <span
              className="font-display text-white font-bold text-2xl"
              style={{ letterSpacing: "-0.5px" }}
            >
              Inkognito
            </span>
          </div>
          <h1
            className="font-display font-bold text-white mb-2"
            style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              letterSpacing: "-1px",
            }}
          >
            Set up your profile
          </h1>
          <p className="font-body text-sm" style={{ color: "#6B7280" }}>
            Step {step} of 2 — {step === 1 ? "Choose your identity" : "Personalize"}
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: "48px",
                backgroundColor: "#8B5CF6",
              }}
            />
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: "48px",
                backgroundColor: step >= 2 ? "#8B5CF6" : "rgba(139, 92, 246, 0.2)",
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: "#141414",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "24px",
            padding: "36px 28px",
            boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.35)",
          }}
        >
          {/* Top gradient accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
            }}
          />

          {step === 1 && (
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label
                  className="font-body text-xs font-extrabold block mb-2"
                  style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
                >
                  CHOOSE YOUR USERNAME
                </label>
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm"
                    style={{ color: "#6B7280" }}
                  >
                    @
                  </span>
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="yourname"
                    className="w-full font-body outline-none transition-all duration-200"
                    style={{
                      backgroundColor: "#0A0A0A",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 500,
                      lineHeight: "20px",
                      padding: "14px 18px 14px 32px",
                      borderRadius: "12px",
                      border: `1px solid ${
                        usernameStatus === "available"
                          ? "rgba(132, 204, 22, 0.5)"
                          : usernameStatus === "taken" || usernameStatus === "invalid"
                          ? "rgba(239, 68, 68, 0.5)"
                          : "rgba(139, 92, 246, 0.25)"
                      }`,
                    }}
                    onFocus={(e) => {
                      if (usernameStatus !== "available" && usernameStatus !== "taken") {
                        e.currentTarget.style.borderColor = "#8B5CF6";
                        e.currentTarget.style.boxShadow =
                          "0px 0px 0px 3px rgba(139,92,246,0.2)";
                      }
                    }}
                    onBlur={(e) => {
                      if (usernameStatus !== "available" && usernameStatus !== "taken") {
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  />
                  {/* Status indicator */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: "#8B5CF6",
                          borderTopColor: "transparent",
                        }}
                      />
                    )}
                    {usernameStatus === "available" && (
                      <span style={{ color: "#84CC16", fontSize: "16px" }}>✓</span>
                    )}
                    {usernameStatus === "taken" && (
                      <span style={{ color: "#EF4444", fontSize: "16px" }}>✗</span>
                    )}
                  </div>
                </div>
                <p
                  className="font-body text-xs mt-2"
                  style={{
                    color:
                      usernameStatus === "available"
                        ? "#84CC16"
                        : usernameStatus === "taken"
                        ? "#EF4444"
                        : usernameStatus === "invalid"
                        ? "#EF4444"
                        : "#6B7280",
                  }}
                >
                  {usernameStatus === "idle" && "3-20 characters. Letters, numbers, underscores only."}
                  {usernameStatus === "checking" && "Checking availability..."}
                  {usernameStatus === "available" && `@${username} is available! 🎉`}
                  {usernameStatus === "taken" && `@${username} is already taken.`}
                  {usernameStatus === "invalid" && "Must be 3-20 characters. Letters, numbers, underscores only."}
                </p>
              </div>

              {/* Display Name */}
              <div>
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
                  placeholder="How people will see you"
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
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={usernameStatus !== "available" || !displayName.trim()}
                className="w-full font-body text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "#FFFFFF",
                  padding: "16px 28px",
                  borderRadius: "28px",
                  border: "none",
                  boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.4)",
                  minHeight: "52px",
                }}
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Bio */}
              <div>
                <label
                  className="font-body text-xs font-extrabold block mb-2"
                  style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
                >
                  BIO (OPTIONAL)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the world about yourself..."
                  maxLength={200}
                  rows={3}
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
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p className="font-body text-xs mt-1 text-right" style={{ color: "#6B7280" }}>
                  {bio.length}/200
                </p>
              </div>

              {/* Profile Prompt */}
              <div>
                <label
                  className="font-body text-xs font-extrabold block mb-2"
                  style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
                >
                  YOUR PROFILE PROMPT
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What do you want people to tell you?"
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
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {promptSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(s)}
                      className="font-body text-xs cursor-pointer transition-all duration-200"
                      style={{
                        background:
                          prompt === s
                            ? "rgba(139, 92, 246, 0.2)"
                            : "rgba(139, 92, 246, 0.08)",
                        color: prompt === s ? "#A78BFA" : "#6B7280",
                        border: `1px solid ${
                          prompt === s
                            ? "rgba(139, 92, 246, 0.4)"
                            : "rgba(139, 92, 246, 0.15)"
                        }`,
                        borderRadius: "20px",
                        padding: "6px 12px",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p
                  className="font-body text-sm text-center"
                  style={{ color: "#EF4444" }}
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: "transparent",
                    color: "#FFFFFF",
                    padding: "16px 24px",
                    borderRadius: "28px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    minHeight: "52px",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 font-body text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "#8B5CF6",
                    color: "#FFFFFF",
                    padding: "16px 28px",
                    borderRadius: "28px",
                    border: "none",
                    boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.4)",
                    minHeight: "52px",
                  }}
                >
                  {saving ? "Setting up..." : "Let's go! 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {username && usernameStatus === "available" && (
          <div
            className="mt-6 text-center transition-all duration-300"
            style={{ opacity: 0, animation: "fade-in-up 0.4s ease-out forwards" }}
          >
            <p className="font-body text-xs mb-1" style={{ color: "#6B7280" }}>
              Your Inkognito link will be:
            </p>
            <p className="font-body text-sm font-bold" style={{ color: "#A78BFA" }}>
              inkognito.app/u/{username}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
