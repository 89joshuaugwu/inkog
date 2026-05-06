"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div style={{ fontSize: "64px", opacity: 0.5, marginBottom: "24px" }}>
        ⚠️
      </div>
      <h1
        className="font-display font-bold text-white mb-3"
        style={{ fontSize: "28px", letterSpacing: "-0.5px" }}
      >
        Something went wrong
      </h1>
      <p
        className="font-body text-sm mb-8 text-center max-w-sm"
        style={{ color: "#6B7280" }}
      >
        An unexpected error occurred. Don&apos;t worry, your messages are safe.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
          style={{
            backgroundColor: "#8B5CF6",
            color: "#FFFFFF",
            padding: "14px 28px",
            borderRadius: "28px",
            border: "none",
            boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.4)",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="font-body text-sm font-bold no-underline transition-colors duration-200"
          style={{ color: "#8B5CF6" }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
