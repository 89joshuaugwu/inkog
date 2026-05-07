"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const pathname = usePathname();

  const isLoggedIn = !!user && !!userProfile?.onboardingComplete;
  const isAuthPage = pathname === "/login" || pathname === "/onboarding";
  const isAdminPage = pathname.startsWith("/admin");
  const isDashboard = pathname === "/dashboard";
  const isSettings = pathname === "/settings";
  const isProfilePage = pathname.startsWith("/u/");

  // Don't render on admin pages (admin has its own nav)
  if (isAdminPage) return null;

  // Build navigation links based on auth state
  const navLinks: { href: string; label: string }[] = [];

  if (isAuthPage) {
    // Auth pages: logo only, no links
  } else if (isLoggedIn) {
    // Logged in — show app links, hide current page
    if (!isDashboard) navLinks.push({ href: "/dashboard", label: "Dashboard" });
    if (!isSettings) navLinks.push({ href: "/settings", label: "Settings" });
  } else {
    // Logged out — show landing links
    if (pathname === "/") {
      navLinks.push({ href: "#features", label: "Features" });
      navLinks.push({ href: "#how-it-works", label: "How it works" });
    }
  }

  // CTA button config
  const ctaButton = isLoggedIn
    ? null // Sign out is the action
    : isProfilePage && user
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Get Started" };

  return (
    <nav
      className="sticky top-0 z-[100] flex items-center justify-between px-6 h-16 border-b"
      style={{
        backgroundColor: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottomColor: "rgba(139, 92, 246, 0.15)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <Image src="/logo.png" alt="Inkognito icon" width={36} height={36} priority />
        <span
          className="font-display text-white font-bold text-[22px]"
          style={{ letterSpacing: "-0.5px" }}
        >
          Inkognito
        </span>
      </Link>

      {/* Desktop Links */}
      {!isAuthPage && (
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-bold no-underline transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              onClick={signOut}
              className="font-body text-sm font-bold cursor-pointer transition-all duration-200"
              style={{
                color: "#FFFFFF",
                backgroundColor: "transparent",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "28px",
                padding: "10px 20px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FFFFFF";
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Sign out
            </button>
          ) : ctaButton ? (
            <Link
              href={ctaButton.href}
              className="font-body text-sm font-bold text-white no-underline transition-all duration-200"
              style={{
                backgroundColor: "#8B5CF6",
                padding: "12px 24px",
                borderRadius: "28px",
                boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.4)",
              }}
            >
              {ctaButton.label}
            </Link>
          ) : null}
        </div>
      )}

      {/* Mobile hamburger */}
      {!isAuthPage && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex md:hidden flex-col justify-center items-center gap-1.5 cursor-pointer"
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            width: "40px",
            height: "40px",
          }}
          aria-label="Toggle navigation"
        >
          <span
            className="block w-5 h-0.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              transform: mobileOpen ? "rotate(45deg) translate(3px, 3px)" : "none",
            }}
          />
          <span
            className="block w-5 h-0.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              opacity: mobileOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-0.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              transform: mobileOpen ? "rotate(-45deg) translate(3px, -3px)" : "none",
            }}
          />
        </button>
      )}

      {/* Mobile Floating Card Menu */}
      {mobileOpen && (
        <div
          id="mobile-drawer"
          className="absolute right-4 top-[72px] flex flex-col gap-3 z-50 md:hidden"
          style={{
            backgroundColor: "rgba(20, 20, 20, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0px 12px 40px rgba(0,0,0,0.5), 0px 0px 20px rgba(139,92,246,0.1)",
            animation: "fade-in-up 0.2s ease-out",
            minWidth: "200px",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-bold no-underline transition-all duration-150 px-3 py-2.5 rounded-lg"
              style={{ color: "rgba(255,255,255,0.8)" }}
              onClick={() => setMobileOpen(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}

          {(navLinks.length > 0 && (isLoggedIn || ctaButton)) && (
            <div style={{ height: "1px", backgroundColor: "rgba(139,92,246,0.15)", margin: "4px 0" }} />
          )}

          {isLoggedIn ? (
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="font-body text-sm font-bold text-white text-center cursor-pointer px-6 py-3 rounded-[28px]"
              style={{
                backgroundColor: "transparent",
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            >
              Sign out
            </button>
          ) : ctaButton ? (
            <Link
              href={ctaButton.href}
              className="font-body text-sm font-bold text-white text-center no-underline px-6 py-3 rounded-[28px]"
              style={{
                backgroundColor: "#8B5CF6",
                boxShadow: "0px 0px 20px rgba(139,92,246,0.35)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {ctaButton.label}
            </Link>
          ) : null}
        </div>
      )}
    </nav>
  );
}
