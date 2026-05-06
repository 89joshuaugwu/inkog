"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, userProfile, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userProfile) {
      if (!userProfile.onboardingComplete) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, userProfile, loading, router]);

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

  if (user) return null;

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
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "24px",
            padding: "48px 32px",
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

          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
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

          {/* Heading */}
          <h1
            className="font-display font-bold text-white text-center mb-3"
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              lineHeight: "1.2",
              letterSpacing: "-1px",
            }}
          >
            Welcome back
          </h1>
          <p
            className="font-body text-center mb-10"
            style={{ color: "#6B7280", fontSize: "15px", lineHeight: "22px" }}
          >
            Sign in to see your anonymous messages
          </p>

          {/* Google Sign In Button */}
          <button
            id="google-signin-btn"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 font-body text-sm font-bold cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#0A0A0A",
              padding: "16px 28px",
              borderRadius: "28px",
              border: "none",
              minHeight: "52px",
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0px 8px 24px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0px 4px 16px rgba(0, 0, 0, 0.25)";
            }}
          >
            {/* Google Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "rgba(139, 92, 246, 0.15)" }}
            />
            <span className="font-body text-xs" style={{ color: "#6B7280" }}>
              Google sign-in only
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "rgba(139, 92, 246, 0.15)" }}
            />
          </div>

          {/* Info */}
          <p
            className="font-body text-xs text-center leading-5"
            style={{ color: "#6B7280" }}
          >
            By signing in, you agree to let people send you anonymous messages.
            Your identity is never shared with message senders.
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="font-body text-sm no-underline transition-colors duration-150"
            style={{ color: "#8B5CF6" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#A78BFA";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#8B5CF6";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
