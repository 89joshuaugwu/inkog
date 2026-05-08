"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign in with Google in seconds. No forms, no stress. We set up your profile and give you a unique Inkognito link instantly.",
    icon: "🚀",
  },
  {
    number: "02",
    title: "Share your link",
    description: "Drop your Inkognito link on Instagram, Twitter, WhatsApp status, or anywhere your people are. Let them know you're ready for the truth.",
    icon: "🔗",
  },
  {
    number: "03",
    title: "Receive messages",
    description: "Sit back and watch the messages roll in. Read them from your dashboard — completely anonymous, completely real. No filter.",
    icon: "💬",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

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
    <div
      ref={ref}
      className="relative flex flex-col items-center text-center"
      style={{
        padding: "32px 24px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.15}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Circle */}
      <div
        className="relative z-10 flex items-center justify-center mb-6 transition-all duration-300"
        style={{
          width: 88, height: 88, borderRadius: "50%",
          background: hovered
            ? "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(6,182,212,0.35))"
            : "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.18))",
          border: hovered ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(139,92,246,0.28)",
          boxShadow: hovered ? "0 0 32px rgba(139,92,246,0.3), inset 0 0 20px rgba(139,92,246,0.1)" : "none",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        <span style={{ fontSize: 40 }}>{step.icon}</span>
      </div>

      {/* Step number */}
      <span
        className="font-body font-extrabold mb-3"
        style={{ color: "#8B5CF6", letterSpacing: "1px", fontSize: 11 }}
      >
        STEP {step.number}
      </span>

      {/* Title */}
      <h3
        className="font-display font-bold text-white mb-4 transition-all duration-300"
        style={{
          fontSize: 24, letterSpacing: "-0.5px",
          color: hovered ? "#A78BFA" : "#FFFFFF",
        }}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p className="font-body text-sm leading-6 max-w-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
        {step.description}
      </p>
    </div>
  );
}

export default function HowItWorksSection() {
  const lineRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [lineVisible, setLineVisible] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const lineEl = lineRef.current;
    const headerEl = headerRef.current;

    const lineObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setLineVisible(true); lineObs.disconnect(); } },
      { threshold: 0.3 }
    );
    const headerObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHeaderVisible(true); headerObs.disconnect(); } },
      { threshold: 0.2 }
    );

    if (lineEl) lineObs.observe(lineEl);
    if (headerEl) headerObs.observe(headerEl);

    return () => { lineObs.disconnect(); headerObs.disconnect(); };
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="w-full"
      style={{ backgroundColor: "#0A0A0A", padding: "clamp(48px, 8vw, 96px) 0" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-16 md:mb-20"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div
            className="inline-flex items-center mb-6"
            style={{
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.4)",
              borderRadius: 20, padding: "6px 12px",
            }}
          >
            <span className="font-body text-xs font-extrabold" style={{ color: "#22D3EE", letterSpacing: "0.2px" }}>
              HOW IT WORKS
            </span>
          </div>
          <h2
            className="font-display font-bold text-white"
            style={{ fontSize: "clamp(36px, 8vw, 72px)", lineHeight: "1.1", letterSpacing: "-1px" }}
          >
            Three steps to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              real talk
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div ref={lineRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Animated connecting line — desktop only */}
          <div
            className="absolute hidden md:block overflow-hidden"
            style={{
              top: 44, left: "16.67%", right: "16.67%", height: 1,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, rgba(139,92,246,0.6), rgba(6,182,212,0.6))",
                width: lineVisible ? "100%" : "0%",
                transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s",
              }}
            />
          </div>

          {/* Dot markers on line */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute hidden md:block"
              style={{
                top: 37, width: 14, height: 14, borderRadius: "50%",
                left: i === 0 ? "16.2%" : i === 1 ? "49.5%" : "83%",
                background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                border: "2px solid #0A0A0A",
                boxShadow: "0 0 12px rgba(139,92,246,0.6)",
                opacity: lineVisible ? 1 : 0,
                transform: lineVisible ? "scale(1)" : "scale(0)",
                transition: `opacity 0.4s ease ${0.3 + i * 0.4}s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.4}s`,
              }}
            />
          ))}

          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
