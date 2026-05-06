"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      id="navbar"
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b"
      style={{
        backgroundColor: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottomColor: "rgba(139, 92, 246, 0.15)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline" id="logo-link">
        <Image
          src="/logo.png"
          alt="Inkognito icon"
          width={36}
          height={36}
          priority
        />
        <span
          className="font-display text-white font-bold text-[22px]"
          style={{ letterSpacing: "-0.5px" }}
        >
          Inkognito
        </span>
      </Link>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="#features"
          className="text-sm font-bold font-body transition-all duration-200 no-underline"
          style={{ color: "rgba(255, 255, 255, 0.6)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")
          }
        >
          Features
        </Link>
        <Link
          href="#how-it-works"
          className="text-sm font-bold font-body transition-all duration-200 no-underline"
          style={{ color: "rgba(255, 255, 255, 0.6)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")
          }
        >
          How it works
        </Link>
        <Link
          href="/login"
          id="nav-login-btn"
          className="font-body text-sm font-bold text-white px-7 py-3.5 rounded-[28px] border-none cursor-pointer transition-all duration-200 no-underline"
          style={{
            backgroundColor: "#8B5CF6",
            boxShadow: "0px 0px 24px rgba(139, 92, 246, 0.4)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#7C3AED";
            e.currentTarget.style.boxShadow =
              "0px 0px 40px rgba(139, 92, 246, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#8B5CF6";
            e.currentTarget.style.boxShadow =
              "0px 0px 24px rgba(139, 92, 246, 0.4)";
          }}
        >
          Get Started
        </Link>
      </div>

      {/* Mobile Hamburger */}
      <button
        id="mobile-menu-btn"
        className="flex md:hidden flex-col justify-center items-center gap-1.5 w-12 h-12 bg-transparent border-none cursor-pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
      >
        <span
          className="block w-6 h-0.5 bg-white rounded-full transition-all duration-300"
          style={
            mobileOpen
              ? { transform: "translateY(4px) rotate(45deg)" }
              : {}
          }
        />
        <span
          className="block w-6 h-0.5 bg-white rounded-full transition-all duration-300"
          style={mobileOpen ? { opacity: 0 } : {}}
        />
        <span
          className="block w-6 h-0.5 bg-white rounded-full transition-all duration-300"
          style={
            mobileOpen
              ? { transform: "translateY(-4px) rotate(-45deg)" }
              : {}
          }
        />
      </button>

      {/* Mobile Drawer */}
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
            boxShadow:
              "0px 12px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(139, 92, 246, 0.1)",
            animation: "fade-in-up 0.2s ease-out",
            minWidth: "200px",
          }}
        >
          <Link
            href="#features"
            className="font-body text-sm font-bold no-underline transition-all duration-150 px-3 py-2.5 rounded-lg"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
            onClick={() => setMobileOpen(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="font-body text-sm font-bold no-underline transition-all duration-150 px-3 py-2.5 rounded-lg"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
            onClick={() => setMobileOpen(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            How it works
          </Link>
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(139, 92, 246, 0.15)",
              margin: "4px 0",
            }}
          />
          <Link
            href="/login"
            className="font-body text-sm font-bold text-white text-center no-underline px-6 py-3 rounded-[28px]"
            style={{
              backgroundColor: "#8B5CF6",
              boxShadow: "0px 0px 20px rgba(139, 92, 246, 0.35)",
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
