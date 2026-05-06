import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inkognito — Say it. Anonymously.",
    template: "%s | Inkognito",
  },
  description:
    "Nigeria's boldest anonymous messaging platform. Send and receive anonymous messages, confessions, and real talk — no judgment, no filters.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Inkognito — Say it. Anonymously.",
    description:
      "Nigeria's boldest anonymous messaging platform. Send and receive anonymous messages, confessions, and real talk.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable}`}
    >
      <body className="min-h-screen bg-background text-white antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
