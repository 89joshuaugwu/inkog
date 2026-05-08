"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CYCLING_WORDS = ["Anonymously.", "Honestly.", "Freely.", "Unfiltered."];

const PARTICLES = [
  { x: 8, y: 15, size: 3, delay: 0, dur: 4 },
  { x: 92, y: 22, size: 2, delay: 1.2, dur: 5 },
  { x: 18, y: 75, size: 4, delay: 0.5, dur: 3.5 },
  { x: 85, y: 68, size: 2.5, delay: 2, dur: 4.5 },
  { x: 45, y: 10, size: 2, delay: 0.8, dur: 6 },
  { x: 72, y: 85, size: 3, delay: 1.5, dur: 3.8 },
  { x: 30, y: 92, size: 2, delay: 0.3, dur: 5.2 },
  { x: 60, y: 5, size: 3.5, delay: 1.8, dur: 4.2 },
];

export default function HeroSection() {
  const [wordIdx, setWordIdx] = useState(0);
  const [wordAnimState, setWordAnimState] = useState<"in" | "out">("in");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const sectionRef = useRef<HTMLDivElement>(null);

  // Cycling word
  useEffect(() => {
    const interval = setInterval(() => {
      setWordAnimState("out");
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % CYCLING_WORDS.length);
        setWordAnimState("in");
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Cursor-following glow
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
    const section = sectionRef.current;
    section?.addEventListener("mousemove", onMove);
    return () => section?.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section id="hero" className="relative w-full overflow-hidden" style={{ padding: 0 }}>
      <div
        ref={sectionRef}
        className="relative mx-auto max-w-[1200px] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 30%, #0E7490 70%, #06B6D4 100%)",
          backgroundSize: "300% 300%",
          animation: "gradient-shift 8s ease infinite",
          borderRadius: "0 0 28px 28px",
          padding: "clamp(60px, 10vw, 120px) clamp(20px, 5vw, 48px)",
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.04,
          }}
        />

        {/* Cursor-following glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
          }}
        />

        {/* Animated orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "5%", left: "3%", width: 360, height: 360,
            background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "orb-move-1 12s ease-in-out infinite",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "5%", right: "3%", width: 400, height: 400,
            background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "orb-move-2 15s ease-in-out infinite",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300,
            background: "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)",
            animation: "orb-move-1 18s ease-in-out infinite reverse",
            filter: "blur(30px)",
          }}
        />

        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              backgroundColor: "rgba(255,255,255,0.5)",
              animation: `particle-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
              boxShadow: "0 0 4px rgba(255,255,255,0.3)",
            }}
          />
        ))}

        {/* Floating decoratives */}
        <div
          className="absolute pointer-events-none select-none hidden md:block"
          style={{
            top: "10%", left: "5%", fontSize: 80, opacity: 0.88,
            filter: "drop-shadow(0px 8px 24px rgba(139,92,246,0.6))",
            animation: "float-x 6s ease-in-out infinite",
          }}
        >
          👻
        </div>
        <div
          className="absolute pointer-events-none select-none hidden md:block"
          style={{
            top: "15%", right: "8%", fontSize: 64, opacity: 0.85,
            filter: "drop-shadow(0px 8px 24px rgba(6,182,212,0.5))",
            animation: "float-x-r 7s ease-in-out infinite",
          }}
        >
          ⚡
        </div>
        <div
          className="absolute pointer-events-none select-none hidden lg:block"
          style={{
            bottom: "20%", left: "8%", fontSize: 52, opacity: 0.7,
            filter: "drop-shadow(0px 8px 24px rgba(139,92,246,0.4))",
            animation: "float-x 8s ease-in-out 1s infinite",
          }}
        >
          🔒
        </div>
        <div
          className="absolute pointer-events-none select-none hidden lg:block"
          style={{
            bottom: "25%", right: "5%", fontSize: 48, opacity: 0.65,
            filter: "drop-shadow(0px 8px 24px rgba(6,182,212,0.35))",
            animation: "float-x-r 5.5s ease-in-out 2s infinite",
          }}
        >
          💬
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 mb-8 relative z-10"
          style={{
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: 20, padding: "6px 16px",
            backdropFilter: "blur(8px)",
            opacity: 0,
            animation: "fade-in-down 0.5s ease-out 0.1s forwards",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: "#84CC16", animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <span className="font-body text-xs font-extrabold text-white" style={{ letterSpacing: "0.2px" }}>
            Live in Nigeria 🇳🇬
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-bold text-white mb-6 relative z-10"
          style={{
            fontSize: "clamp(48px, 10vw, 144px)",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            opacity: 0,
            animation: "fade-in-up 0.6s ease-out 0.25s forwards",
          }}
        >
          Say it.{" "}
          <span
            className="block md:inline-block overflow-hidden"
            style={{
              perspective: "600px",
              display: "inline-block",
              minWidth: "10px",
            }}
          >
            <span
              key={wordIdx}
              style={{
                display: "inline-block",
                animation: wordAnimState === "in"
                  ? "word-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards"
                  : "word-slide-out 0.3s ease-in forwards",
                background: "linear-gradient(135deg, #FFFFFF 40%, rgba(255,255,255,0.7) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {CYCLING_WORDS[wordIdx]}
            </span>
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="font-body text-white/85 max-w-xl mx-auto mb-10 relative z-10"
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            fontWeight: 500,
            lineHeight: "28px",
            opacity: 0,
            animation: "fade-in-up 0.6s ease-out 0.4s forwards",
          }}
        >
          Nigeria&apos;s boldest anonymous messaging platform. Get real opinions,
          honest confessions, and unfiltered thoughts from anyone — no fear, no
          judgment.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 relative z-10"
          style={{ opacity: 0, animation: "fade-in-up 0.6s ease-out 0.6s forwards" }}
        >
          <Link
            href="/login"
            className="font-body text-sm font-bold text-white px-8 py-4 rounded-[28px] border-none cursor-pointer no-underline inline-flex items-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: "#8B5CF6",
              boxShadow: "0px 0px 24px rgba(139,92,246,0.5), 0px 0px 60px rgba(139,92,246,0.2)",
              minHeight: 48,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#7C3AED";
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0px 0px 40px rgba(139,92,246,0.7), 0px 8px 32px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#8B5CF6";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0px 0px 24px rgba(139,92,246,0.5), 0px 0px 60px rgba(139,92,246,0.2)";
            }}
          >
            Create your link
            <span style={{ fontSize: 18, transition: "transform 0.2s" }}>→</span>
          </Link>
          <Link
            href="#how-it-works"
            className="font-body text-sm font-bold text-white px-8 py-4 rounded-[28px] cursor-pointer no-underline inline-flex items-center transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.35)",
              backdropFilter: "blur(8px)",
              minHeight: 48,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            See how it works
          </Link>
        </div>

        {/* Social proof micro-stat */}
        <div
          className="flex items-center gap-6 mt-8 relative z-10"
          style={{ opacity: 0, animation: "fade-in-up 0.6s ease-out 0.8s forwards" }}
        >
          {[
            { val: "100%", label: "Anonymous" },
            { val: "0ms", label: "Delay" },
            { val: "🇳🇬", label: "Made for Naija" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-bold text-white" style={{ fontSize: "clamp(16px,3vw,22px)", letterSpacing: "-0.5px" }}>
                {s.val}
              </div>
              <div className="font-body text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Speech bubbles */}
        <div
          className="relative mt-14 z-10 hidden md:block w-full max-w-2xl"
          style={{ opacity: 0, animation: "fade-in-up 0.6s ease-out 1s forwards" }}
        >
          <div className="flex items-end gap-4 justify-center flex-wrap">
            {[
              { text: "Your smile is everything 😍", delay: "0s", offset: "0px" },
              { text: "I've always wanted to tell you... 🤫", delay: "0.15s", offset: "-8px" },
              { text: "No cap, you're the realest 💯", delay: "0.3s", offset: "0px" },
            ].map((b, i) => (
              <div
                key={i}
                className="font-body text-sm font-semibold"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#0A0A0A",
                  padding: "14px 18px",
                  borderRadius: "18px 18px 18px 4px",
                  boxShadow: "0px 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)",
                  maxWidth: 220,
                  backdropFilter: "blur(8px)",
                  animation: `bubble-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${b.delay} both, float 3s ease-in-out ${parseFloat(b.delay) + 0.5}s infinite alternate`,
                  transform: `translateY(${b.offset})`,
                }}
              >
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
