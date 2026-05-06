"use client";

import Link from "next/link";

export default function CTASection() {
  return (
    <section
      id="cta"
      className="w-full"
      style={{ backgroundColor: "#0A0A0A", padding: "clamp(48px, 8vw, 96px) 0" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="relative overflow-hidden text-center"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            borderRadius: "24px",
            padding: "clamp(48px, 8vw, 80px) clamp(24px, 5vw, 64px)",
          }}
        >
          {/* Noise Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              opacity: 0.03,
            }}
          />

          {/* Floating decoratives */}
          <div
            className="absolute pointer-events-none select-none hidden md:block animate-float"
            style={{
              top: "10%",
              right: "8%",
              fontSize: "64px",
              opacity: 0.8,
              transform: "rotate(12deg)",
              filter: "drop-shadow(0px 8px 24px rgba(139,92,246,0.5))",
            }}
          >
            👻
          </div>
          <div
            className="absolute pointer-events-none select-none hidden md:block animate-float-delayed"
            style={{
              bottom: "10%",
              left: "6%",
              fontSize: "48px",
              opacity: 0.7,
              transform: "rotate(-8deg)",
              filter: "drop-shadow(0px 8px 24px rgba(6,182,212,0.4))",
            }}
          >
            ⚡
          </div>

          {/* Content */}
          <h2
            className="font-display font-bold text-white mb-6 relative z-10"
            style={{
              fontSize: "clamp(32px, 6vw, 64px)",
              lineHeight: "1.1",
              letterSpacing: "-1px",
            }}
          >
            Ready to hear the{" "}
            <span className="block sm:inline">
              truth?
            </span>
          </h2>

          <p
            className="font-body text-white/85 max-w-lg mx-auto mb-10 relative z-10"
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              fontWeight: 500,
              lineHeight: "26px",
            }}
          >
            Create your Inkognito profile, share your link, and start receiving
            real anonymous messages from people around you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              href="/login"
              id="cta-primary-btn"
              className="font-body text-sm font-bold px-10 py-4 rounded-[28px] border-none cursor-pointer transition-all duration-200 no-underline inline-flex items-center gap-2"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#0A0A0A",
                boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.24)",
                minHeight: "48px",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0px 12px 40px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0px 8px 32px rgba(0, 0, 0, 0.24)";
              }}
            >
              Get started — it&apos;s free
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
