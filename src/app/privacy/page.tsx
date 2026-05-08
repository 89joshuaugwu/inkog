import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Inkognito handles your data, what we collect, and how we protect your privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-[720px] mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="font-display font-bold text-white mb-4"
            style={{ fontSize: "clamp(32px, 6vw, 48px)", letterSpacing: "-1px" }}
          >
            Privacy Policy
          </h1>
          <p className="font-body text-sm" style={{ color: "#6B7280" }}>
            Last updated: May 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-10">
          <Section title="1. Introduction">
            Inkognito (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an anonymous messaging
            platform built for users in Nigeria and beyond. We are committed to
            protecting your privacy. This policy explains what data we collect, how we
            use it, and your rights regarding your information.
          </Section>

          <Section title="2. Data We Collect">
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li><strong>Account Data:</strong> When you sign in with Google, we receive your name, email address, and profile photo.</li>
              <li><strong>Profile Data:</strong> Your chosen username, display name, bio, and custom prompt.</li>
              <li><strong>Messages:</strong> Anonymous messages sent to your profile are stored so you can view them in your dashboard.</li>
              <li><strong>Device Tokens:</strong> If you enable push notifications, we store your FCM device token to deliver notifications.</li>
              <li><strong>Usage Data:</strong> Basic analytics such as page views and message counts. We do not use third-party tracking cookies.</li>
            </ul>
          </Section>

          <Section title="3. What We Do NOT Collect">
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li>We do <strong>not</strong> track or store the identity of message senders.</li>
              <li>We do <strong>not</strong> log IP addresses of anonymous message senders.</li>
              <li>We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing.</li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Data">
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li>To create and manage your Inkognito profile.</li>
              <li>To deliver anonymous messages to your dashboard.</li>
              <li>To send email notifications (new messages, login alerts) — you can disable these.</li>
              <li>To send push notifications if you opt in.</li>
              <li>To prevent abuse and enforce our Terms of Service.</li>
            </ul>
          </Section>

          <Section title="5. Data Storage & Security">
            Your data is stored securely using Google Firebase (Firestore, Authentication,
            and Realtime Database). All data is transmitted over HTTPS. We use Firebase
            Security Rules to restrict access to authorized users only.
          </Section>

          <Section title="6. Data Retention">
            Your account data is retained as long as your account is active. You may
            delete individual messages from your dashboard at any time. To delete your
            entire account and associated data, contact us at the email below.
          </Section>

          <Section title="7. Third-Party Services">
            <ul className="list-disc list-inside flex flex-col gap-2 mt-2">
              <li><strong>Google Firebase:</strong> Authentication, database, and hosting.</li>
              <li><strong>Google Cloud Messaging (FCM):</strong> Push notifications.</li>
              <li><strong>Cloudinary:</strong> Profile image hosting.</li>
              <li><strong>Gmail SMTP:</strong> Email notifications.</li>
            </ul>
          </Section>

          <Section title="8. Your Rights">
            You have the right to access, update, or delete your personal data at any
            time through your Inkognito settings page. For data deletion requests or
            questions about your privacy, contact us.
          </Section>

          <Section title="9. Contact">
            If you have questions about this Privacy Policy, email us at{" "}
            <a href="mailto:inkognito.notifications@gmail.com" style={{ color: "#A78BFA" }}>
              inkognito.notifications@gmail.com
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
