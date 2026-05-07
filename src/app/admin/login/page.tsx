"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Must match the admin page
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@inkognito.com").split(",");

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Verify this is an admin account
      if (!ADMIN_EMAILS.includes(result.user.email || "")) {
        await auth.signOut();
        setError("Access denied. This account is not authorized for admin access.");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    }
    setLoading(false);
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: "#141414",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "24px",
            padding: "48px 32px",
            boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.35)",
          }}
        >
          {/* Top gradient accent — red for admin */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: "linear-gradient(90deg, #EF4444, #8B5CF6)",
            }}
          />

          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Image
              src="/logo.png"
              alt="Inkognito icon"
              width={40}
              height={40}
              priority
            />
            <span
              className="font-display text-white font-bold text-2xl"
              style={{ letterSpacing: "-0.5px" }}
            >
              Inkognito
            </span>
          </div>

          {/* Admin badge */}
          <div className="flex justify-center mb-8">
            <span
              className="font-body text-xs font-extrabold"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                padding: "4px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              ADMIN ACCESS
            </span>
          </div>

          {/* Heading */}
          <h1
            className="font-display font-bold text-white text-center mb-2"
            style={{
              fontSize: "28px",
              lineHeight: "1.2",
              letterSpacing: "-1px",
            }}
          >
            Admin Login
          </h1>
          <p
            className="font-body text-center mb-8"
            style={{ color: "#6B7280", fontSize: "14px", lineHeight: "20px" }}
          >
            Sign in with your admin credentials
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="font-body text-xs font-extrabold block mb-2"
                style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
                htmlFor="admin-email"
              >
                EMAIL
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@inkognito.com"
                autoComplete="email"
                required
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

            {/* Password */}
            <div>
              <label
                className="font-body text-xs font-extrabold block mb-2"
                style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
                htmlFor="admin-password"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full font-body outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "#0A0A0A",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    padding: "14px 48px 14px 18px",
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6B7280",
                    fontSize: "16px",
                    padding: "4px",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="font-body text-sm text-center py-3 rounded-xl"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full font-body text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #EF4444, #8B5CF6)",
                color: "#FFFFFF",
                padding: "16px 28px",
                borderRadius: "28px",
                border: "none",
                boxShadow: "0px 0px 24px rgba(239, 68, 68, 0.3)",
                minHeight: "52px",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{
                      borderColor: "#FFFFFF",
                      borderTopColor: "transparent",
                    }}
                  />
                  Signing in...
                </span>
              ) : (
                "Sign in to Admin"
              )}
            </button>
          </form>
        </div>

        {/* Security notice */}
        <p
          className="font-body text-xs text-center mt-6"
          style={{ color: "#6B7280" }}
        >
          🔒 This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
