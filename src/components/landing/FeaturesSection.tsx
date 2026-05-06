"use client";

const features = [
  {
    icon: "👻",
    title: "100% Anonymous",
    description:
      "Messages are completely anonymous. No one sees who sent them — not even us. Your identity stays hidden, always.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  {
    icon: "⚡",
    title: "Instant delivery",
    description:
      "Messages arrive in real-time. No delays, no waiting. Drop a message and it lands instantly in their inbox.",
    accentColor: "#06B6D4",
    glowColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.35)",
  },
  {
    icon: "🔗",
    title: "Share your link",
    description:
      "Get your unique Inkognito link, drop it on your socials, and let the messages flow in. It's that simple.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  {
    icon: "🔒",
    title: "Privacy first",
    description:
      "Built with security at the core. No tracking, no data selling. We respect your privacy like we respect our jollof.",
    accentColor: "#06B6D4",
    glowColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.35)",
  },
  {
    icon: "📱",
    title: "Works everywhere",
    description:
      "No app download needed. Inkognito works beautifully on any device — phone, tablet, or desktop. Just open and go.",
    accentColor: "#84CC16",
    glowColor: "rgba(132, 204, 22, 0.15)",
    borderColor: "rgba(132, 204, 22, 0.35)",
  },
  {
    icon: "🔥",
    title: "Made for Naija",
    description:
      "Built by Nigerians, for Nigerians. The vibes, the energy, the audacity — it's all here. No dulling.",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full"
      style={{ backgroundColor: "#0A0A0A", padding: "clamp(48px, 8vw, 96px) 0" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div
            className="inline-flex items-center mb-6"
            style={{
              background: "rgba(139, 92, 246, 0.12)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              borderRadius: "20px",
              padding: "6px 12px",
            }}
          >
            <span
              className="font-body text-xs font-extrabold"
              style={{ color: "#A78BFA", letterSpacing: "0.2px" }}
            >
              FEATURES
            </span>
          </div>
          <h2
            className="font-display font-bold text-white"
            style={{
              fontSize: "clamp(36px, 8vw, 72px)",
              lineHeight: "1.1",
              letterSpacing: "-1px",
            }}
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

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative transition-all duration-300 cursor-default"
              style={{
                background: `linear-gradient(135deg, ${feature.glowColor}, rgba(6, 182, 212, 0.05))`,
                border: `1px solid ${feature.borderColor}`,
                borderRadius: "20px",
                padding: "32px",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0px 8px 32px ${feature.glowColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                className="mb-5"
                style={{
                  fontSize: "48px",
                  filter: `drop-shadow(0px 4px 12px ${feature.glowColor})`,
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3
                className="font-display font-bold text-white mb-3"
                style={{ fontSize: "22px", letterSpacing: "-0.5px" }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                className="font-body text-sm leading-6"
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
