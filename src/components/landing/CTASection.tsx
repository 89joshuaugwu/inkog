"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CTA_PARTICLES = [
  { x: 5, y: 20, delay: 0, dur: 4 },
  { x: 95, y: 15, delay: 1, dur: 5 },
  { x: 10, y: 80, delay: 0.5, dur: 3.5 },
  { x: 90, y: 75, delay: 1.5, dur: 4.5 },
  { x: 50, y: 5, delay: 0.8, dur: 6 },
  { x: 25, y: 90, delay: 2, dur: 3.8 },
  { x: 75, y: 95, delay: 0.3, dur: 5.2 },
];

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="cta"
      className="w-full"
      style={{ backgroundColor: "#0A0A0A", padding: "clamp(48px, 8vw, 96px) 0" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          ref={ref}
          className="relative overflow-hidden text-center"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 40%, #0E7490 70%, #06B6D4 100%)",
            backgroundSize: "200% 200%",
            animation: "gradient-shift 6s ease infinite",
            borderRadius: 28,
            padding: "clamp(48px, 8vw, 80px) clamp(24px, 5vw, 64px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
            transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: "0 0 80px rgba(139,92,246,0.25), 0 0 160px rgba(6,182,212,0.1)",
          }}
        >
          {/* Noise */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              opacity: 0.04,
            }}
          />

          {/* Glow orbs */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-30%", left: "-10%", width: 400, height: 400,
              background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "orb-move-1 10s ease-in-out infinite",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "-20%", right: "-5%", width: 350, height: 350,
              background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "orb-move-2 12s ease-in-out infinite",
              filter: "blur(50px)",
            }}
          />

          {/* Particles */}
          {CTA_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: 4, height: 4,
                backgroundColor: "rgba(255,255,255,0.4)",
                animation: `particle-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}

          {/* Floating decoratives */}
          <div
            className="absolute pointer-events-none select-none hidden md:block"
            style={{ top: "8%", right: "7%", fontSize: 64, opacity: 0.85, animation: "float-x-r 6s ease-in-out infinite", filter: "drop-shadow(0px 8px 24px rgba(139,92,246,0.5))" }}
          >
            👻
          </div>
          <div
            className="absolute pointer-events-none select-none hidden md:block"
            style={{ bottom: "8%", left: "5%", fontSize: 48, opacity: 0.7, animation: "float-x 7s ease-in-out infinite", filter: "drop-shadow(0px 8px 24px rgba(6,182,212,0.4))" }}
          >
            ⚡
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div
              className="inline-flex items-center mb-6"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 20, padding: "5px 14px",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="font-body text-xs font-extrabold text-white" style={{ letterSpacing: "0.5px" }}>
                🎯 JOIN THE MOVEMENT
              </span>
            </div>

            <h2
              className="font-display font-bold text-white mb-6"
              style={{ fontSize: "clamp(32px, 6vw, 64px)", lineHeight: "1.1", letterSpacing: "-1px" }}
            >
              Ready to hear the truth?
            </h2>

            <p
              className="font-body text-white/85 max-w-lg mx-auto mb-10"
              style={{ fontSize: "clamp(15px, 2vw, 18px)", fontWeight: 500, lineHeight: "26px" }}
            >
              Create your Inkognito profile, share your link, and start receiving
              real anonymous messages from people around you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="font-body text-sm font-bold px-10 py-4 rounded-[28px] border-none cursor-pointer no-underline inline-flex items-center gap-2 transition-all duration-200"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#0A0A0A",
                  boxShadow: "0px 8px 32px rgba(0,0,0,0.3)",
                  minHeight: 52,
                  fontSize: 15,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                  e.currentTarget.style.boxShadow = "0px 16px 48px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0px 8px 32px rgba(0,0,0,0.3)";
                }}
              >
                Get started — it&apos;s free
                <span style={{ fontSize: 18 }}>→</span>
              </Link>
            </div>

            {/* Trust line */}
            <p className="font-body text-xs mt-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              No credit card · No download · Just your link
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
