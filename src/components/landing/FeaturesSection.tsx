"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: "👻",
    title: "100% Anonymous",
    description: "Messages are completely anonymous. No one sees who sent them — not even us. Your identity stays hidden, always.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  {
    icon: "⚡",
    title: "Instant delivery",
    description: "Messages arrive in real-time. No delays, no waiting. Drop a message and it lands instantly in their inbox.",
    accentColor: "#06B6D4",
    glowColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  {
    icon: "🔗",
    title: "Share your link",
    description: "Get your unique Inkognito link, drop it on your socials, and let the messages flow in. It's that simple.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  {
    icon: "🔒",
    title: "Privacy first",
    description: "Built with security at the core. No tracking, no data selling. We respect your privacy like we respect our jollof.",
    accentColor: "#06B6D4",
    glowColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  {
    icon: "📱",
    title: "Works everywhere",
    description: "No app download needed. Inkognito works beautifully on any device — phone, tablet, or desktop. Just open and go.",
    accentColor: "#84CC16",
    glowColor: "rgba(132, 204, 22, 0.15)",
    borderColor: "rgba(132, 204, 22, 0.3)",
  },
  {
    icon: "🔥",
    title: "Made for Naija",
    description: "Built by Nigerians, for Nigerians. The vibes, the energy, the audacity — it's all here. No dulling.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative transition-all duration-500 cursor-default"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${feature.glowColor.replace("0.15", "0.22")}, rgba(6,182,212,0.08))`
          : `linear-gradient(135deg, ${feature.glowColor}, rgba(6,182,212,0.04))`,
        border: `1px solid ${hovered ? feature.borderColor.replace("0.3", "0.55") : feature.borderColor}`,
        borderRadius: 22,
        padding: "32px",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(32px) scale(0.96)",
        transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.08}s, background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease`,
        boxShadow: hovered ? `0 12px 40px ${feature.glowColor.replace("0.15", "0.3")}` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px rounded-full transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${feature.accentColor}, transparent)`,
          opacity: hovered ? 0.7 : 0.2,
        }}
      />

      {/* Icon */}
      <div
        className="mb-5 transition-all duration-300"
        style={{
          fontSize: 48,
          filter: `drop-shadow(0px 4px 12px ${feature.glowColor.replace("0.15", "0.5")})`,
          transform: hovered ? "scale(1.12) translateY(-2px)" : "scale(1)",
        }}
      >
        {feature.icon}
      </div>

      {/* Title */}
      <h3
        className="font-display font-bold text-white mb-3"
        style={{ fontSize: 22, letterSpacing: "-0.5px" }}
      >
        {feature.title}
      </h3>

      {/* Description */}
      <p className="font-body text-sm leading-6" style={{ color: "rgba(255,255,255,0.65)" }}>
        {feature.description}
      </p>

      {/* Bottom arrow hint on hover */}
      <div
        className="mt-4 flex items-center gap-1 transition-all duration-300"
        style={{
          color: feature.accentColor,
          fontSize: 12,
          fontWeight: 700,
          opacity: hovered ? 0.8 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-8px)",
          fontFamily: "var(--font-body)",
        }}
      >
        Learn more <span style={{ fontSize: 14 }}>→</span>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeaderVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="features"
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
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.4)",
              borderRadius: 20,
              padding: "6px 12px",
            }}
          >
            <span className="font-body text-xs font-extrabold" style={{ color: "#A78BFA", letterSpacing: "0.2px" }}>
              FEATURES
            </span>
          </div>
          <h2
            className="font-display font-bold text-white"
            style={{ fontSize: "clamp(36px, 8vw, 72px)", lineHeight: "1.1", letterSpacing: "-1px" }}
          >
            Everything you need to
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              speak freely
            </span>
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
