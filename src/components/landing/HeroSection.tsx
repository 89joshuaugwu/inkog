"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ padding: "0" }}
    >
      {/* Gradient Hero Card */}
      <div
        className="relative mx-auto max-w-[1200px] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          borderRadius: "0 0 24px 24px",
          padding: "clamp(60px, 10vw, 120px) clamp(20px, 5vw, 48px)",
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />

        {/* Floating Decorative Elements */}
        <div
          className="absolute animate-float pointer-events-none select-none hidden md:block"
          style={{
            top: "10%",
            left: "5%",
            fontSize: "80px",
            opacity: 0.85,
            filter: "drop-shadow(0px 8px 24px rgba(139,92,246,0.5))",
            transform: "rotate(-12deg)",
          }}
        >
          👻
        </div>
        <div
          className="absolute animate-float-delayed pointer-events-none select-none hidden md:block"
          style={{
            top: "15%",
            right: "8%",
            fontSize: "64px",
            opacity: 0.85,
            filter: "drop-shadow(0px 8px 24px rgba(6,182,212,0.4))",
            transform: "rotate(12deg)",
          }}
        >
          ⚡
        </div>
        <div
          className="absolute animate-float pointer-events-none select-none hidden lg:block"
          style={{
            bottom: "15%",
            left: "8%",
            fontSize: "56px",
            opacity: 0.7,
            filter: "drop-shadow(0px 8px 24px rgba(139,92,246,0.4))",
            transform: "rotate(8deg)",
          }}
        >
          🔒
        </div>
        <div
          className="absolute animate-float-delayed pointer-events-none select-none hidden lg:block"
          style={{
            bottom: "20%",
            right: "5%",
            fontSize: "48px",
            opacity: 0.6,
            filter: "drop-shadow(0px 8px 24px rgba(6,182,212,0.3))",
            transform: "rotate(-8deg)",
          }}
        >
          💬
        </div>

        {/* Tag / Badge */}
        <div
          className="inline-flex items-center gap-2 mb-8 animate-fade-in-up"
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            borderRadius: "20px",
            padding: "6px 16px",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              backgroundColor: "#84CC16",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          <span
            className="font-body text-xs font-extrabold text-white"
            style={{ letterSpacing: "0.2px" }}
          >
            Live in Nigeria 🇳🇬
          </span>
        </div>

        {/* Hero Headline */}
        <h1
          className="font-display font-bold text-white mb-6 animate-fade-in-up-delayed relative z-10"
          style={{
            fontSize: "clamp(48px, 10vw, 144px)",
            lineHeight: "1.05",
            letterSpacing: "-2px",
          }}
        >
          Say it.{" "}
          <span className="block md:inline">Anonymously.</span>
        </h1>

        {/* Subtext */}
        <p
          className="font-body text-white/90 max-w-xl mx-auto mb-10 animate-fade-in-up-delayed-2 relative z-10"
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            fontWeight: 500,
            lineHeight: "28px",
          }}
        >
          Nigeria&apos;s boldest anonymous messaging platform. Get real opinions,
          honest confessions, and unfiltered thoughts from anyone — no fear, no
          judgment.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 relative z-10"
          style={{ opacity: 0, animation: "fade-in-up 0.6s ease-out 0.6s forwards" }}
        >
          <Link
            href="/login"
            id="hero-cta-primary"
            className="font-body text-sm font-bold text-white px-8 py-4 rounded-[28px] border-none cursor-pointer transition-all duration-200 no-underline inline-flex items-center gap-2"
            style={{
              backgroundColor: "#8B5CF6",
              boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.45)",
              minHeight: "48px",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              const t = e.currentTarget;
              t.style.backgroundColor = "#7C3AED";
              t.style.boxShadow = "0px 0px 40px rgba(139, 92, 246, 0.65)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              const t = e.currentTarget;
              t.style.backgroundColor = "#8B5CF6";
              t.style.boxShadow = "0px 0px 24px rgba(139, 92, 246, 0.45)";
            }}
          >
            Create your link
            <span className="text-lg">→</span>
          </Link>
          <Link
            href="#how-it-works"
            id="hero-cta-secondary"
            className="font-body text-sm font-bold text-white px-8 py-4 rounded-[28px] cursor-pointer transition-all duration-200 no-underline inline-flex items-center"
            style={{
              backgroundColor: "transparent",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              minHeight: "48px",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              const t = e.currentTarget;
              t.style.borderColor = "#FFFFFF";
              t.style.backgroundColor = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              const t = e.currentTarget;
              t.style.borderColor = "rgba(255, 255, 255, 0.4)";
              t.style.backgroundColor = "transparent";
            }}
          >
            See how it works
          </Link>
        </div>

        {/* Floating Speech Bubble Preview */}
        <div
          className="relative mt-16 z-10 hidden md:block"
          style={{ opacity: 0, animation: "fade-in-up 0.6s ease-out 0.8s forwards" }}
        >
          <div className="flex items-center gap-4 justify-center">
            {/* Bubble 1 */}
            <div
              className="font-body text-sm font-semibold relative"
              style={{
                background: "#FFFFFF",
                color: "#0A0A0A",
                padding: "16px 20px",
                borderRadius: "20px",
                boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
                maxWidth: "200px",
                animation: "float 3s ease-in-out infinite alternate",
              }}
            >
              Your smile is everything 😍
            </div>
            {/* Bubble 2 */}
            <div
              className="font-body text-sm font-semibold relative"
              style={{
                background: "#FFFFFF",
                color: "#0A0A0A",
                padding: "16px 20px",
                borderRadius: "20px",
                boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
                maxWidth: "220px",
                animation: "float 3s ease-in-out 1s infinite alternate",
              }}
            >
              I&apos;ve always wanted to tell you... 🤫
            </div>
            {/* Bubble 3 */}
            <div
              className="font-body text-sm font-semibold relative hidden lg:block"
              style={{
                background: "#FFFFFF",
                color: "#0A0A0A",
                padding: "16px 20px",
                borderRadius: "20px",
                boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
                maxWidth: "200px",
                animation: "float 3s ease-in-out 2s infinite alternate",
              }}
            >
              No cap, you&apos;re the realest 💯
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
