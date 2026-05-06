import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Inkognito icon"
        width={64}
        height={64}
        className="opacity-40 mb-6"
      />
      <h1
        className="font-display font-bold text-white mb-3"
        style={{
          fontSize: "clamp(48px, 10vw, 96px)",
          letterSpacing: "-2px",
          background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>
      <p
        className="font-display font-bold text-white mb-2"
        style={{ fontSize: "24px", letterSpacing: "-0.5px" }}
      >
        Page not found
      </p>
      <p
        className="font-body text-sm mb-8 text-center max-w-sm"
        style={{ color: "#6B7280" }}
      >
        Looks like this page went incognito for real. Even we can&apos;t find it.
        👻
      </p>
      <Link
        href="/"
        className="font-body text-sm font-bold no-underline transition-all duration-200"
        style={{
          backgroundColor: "#8B5CF6",
          color: "#FFFFFF",
          padding: "14px 28px",
          borderRadius: "28px",
          boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.4)",
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
