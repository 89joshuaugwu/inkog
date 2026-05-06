"use client";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign in with Google in seconds. No forms, no stress. We set up your profile and give you a unique Inkognito link instantly.",
    icon: "🚀",
  },
  {
    number: "02",
    title: "Share your link",
    description:
      "Drop your Inkognito link on Instagram, Twitter, WhatsApp status, or anywhere your people are. Let them know you're ready for the truth.",
    icon: "🔗",
  },
  {
    number: "03",
    title: "Receive anonymous messages",
    description:
      "Sit back and watch the messages roll in. Read them from your dashboard — completely anonymous, completely real. No filter.",
    icon: "💬",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full"
      style={{ backgroundColor: "#0A0A0A", padding: "clamp(48px, 8vw, 96px) 0" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div
            className="inline-flex items-center mb-6"
            style={{
              background: "rgba(6, 182, 212, 0.12)",
              border: "1px solid rgba(6, 182, 212, 0.4)",
              borderRadius: "20px",
              padding: "6px 12px",
            }}
          >
            <span
              className="font-body text-xs font-extrabold"
              style={{ color: "#22D3EE", letterSpacing: "0.2px" }}
            >
              HOW IT WORKS
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div
            className="absolute top-24 left-[16.67%] right-[16.67%] h-px hidden md:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(139, 92, 246, 0.4), rgba(6, 182, 212, 0.4))",
            }}
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center transition-all duration-300"
              style={{ padding: "32px 24px" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Step Number Circle */}
              <div
                className="relative z-10 flex items-center justify-center mb-8"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(6, 182, 212, 0.2))",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                }}
              >
                <span style={{ fontSize: "40px" }}>{step.icon}</span>
              </div>

              {/* Step Number */}
              <span
                className="font-body text-xs font-extrabold mb-3"
                style={{
                  color: "#8B5CF6",
                  letterSpacing: "1px",
                }}
              >
                STEP {step.number}
              </span>

              {/* Title */}
              <h3
                className="font-display font-bold text-white mb-4"
                style={{
                  fontSize: "24px",
                  letterSpacing: "-0.5px",
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="font-body text-sm leading-6 max-w-xs"
                style={{ color: "rgba(255, 255, 255, 0.65)" }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
