import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Inkognito, Nigeria's anonymous messaging platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-[720px] mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="font-display font-bold text-white mb-4"
            style={{ fontSize: "clamp(32px, 6vw, 48px)", letterSpacing: "-1px" }}
          >
            Terms of Service
          </h1>
          <p className="font-body text-sm" style={{ color: "#6B7280" }}>
            Last updated: May 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-10">
          <Section title="1. Acceptance of Terms">
            By creating an account or using Inkognito (&quot;the Platform&quot;), you agree to
            these Terms of Service. If you do not agree, please do not use the Platform.
          </Section>

          <Section title="2. Description of Service">
            Inkognito is an anonymous messaging platform that allows users to create a
            public profile link and receive anonymous messages from anyone. The Platform
            is designed for fun, honest, and respectful communication.
          </Section>

          <Section title="3. User Accounts">
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li>You must sign in with a valid Google account to create an Inkognito profile.</li>
              <li>You are responsible for maintaining the security of your account.</li>
              <li>You may only create one account per person.</li>
              <li>Usernames must be unique and must not impersonate other individuals or brands.</li>
            </ul>
          </Section>

          <Section title="4. User Responsibilities">
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li>You must not use Inkognito to send threatening, harassing, or abusive messages.</li>
              <li>You must not use the Platform for illegal activities.</li>
              <li>You must not send spam or unsolicited commercial messages.</li>
              <li>You must not attempt to identify anonymous message senders through technical means.</li>
              <li>You must be at least 13 years old to use Inkognito.</li>
            </ul>
          </Section>

          <Section title="5. Content Policy">
            While messages are anonymous, the following content is prohibited:
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li>Threats of violence or harm.</li>
              <li>Hate speech, discrimination, or targeted harassment.</li>
              <li>Sexually explicit content involving minors.</li>
              <li>Doxxing or sharing of private personal information.</li>
              <li>Encouragement of self-harm or suicide.</li>
            </ul>
          </Section>

          <Section title="6. Anonymity">
            Inkognito is designed to protect message sender anonymity. However, we
            reserve the right to cooperate with law enforcement if legally required,
            such as in cases involving credible threats of violence or illegal activity.
          </Section>

          <Section title="7. Message Ownership">
            Messages sent through Inkognito are received by the profile owner. The
            profile owner may share, delete, or react to messages at their discretion.
            Once a message is deleted, it is permanently removed from our systems.
          </Section>

          <Section title="8. Intellectual Property">
            The Inkognito name, logo, design, and code are the property of the Inkognito
            team. You may not copy, modify, or distribute the Platform without permission.
          </Section>

          <Section title="9. Termination">
            We reserve the right to suspend or terminate accounts that violate these
            Terms, engage in abusive behavior, or attempt to circumvent Platform
            protections. You may delete your account at any time.
          </Section>

          <Section title="10. Limitation of Liability">
            Inkognito is provided &quot;as is&quot; without warranties of any kind. We are not
            responsible for the content of anonymous messages. We are not liable for any
            damages resulting from the use of the Platform.
          </Section>

          <Section title="11. Changes to Terms">
            We may update these Terms from time to time. Continued use of the Platform
            after changes constitutes acceptance of the updated Terms.
          </Section>

          <Section title="12. Contact">
            Questions about these Terms? Email us at{" "}
            <a href="mailto:joshuaugwu04062002@gmail.com" style={{ color: "#A78BFA" }}>
              joshuaugwu04062002@gmail.com
            </a>.
          </Section>
        </div>

        {/* Back link */}
        <div className="mt-16 pt-8" style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}>
          <Link href="/" className="font-body text-sm no-underline" style={{ color: "#A78BFA" }}>
            ← Back to Inkognito
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display font-bold text-white mb-3" style={{ fontSize: 22, letterSpacing: "-0.5px" }}>
        {title}
      </h2>
      <div className="font-body text-sm leading-7" style={{ color: "rgba(255,255,255,0.65)" }}>
        {children}
      </div>
    </div>
  );
}
