"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="w-full border-t"
      style={{
        backgroundColor: "#0A0A0A",
        borderTopColor: "rgba(139, 92, 246, 0.15)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-20 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <Image
                src="/logo.png"
                alt="Inkognito icon"
                width={32}
                height={32}
              />
              <span
                className="font-display text-white font-bold text-xl"
                style={{ letterSpacing: "-0.5px" }}
              >
                Inkognito
              </span>
            </Link>
            <p
              className="font-body text-sm leading-6"
              style={{ color: "#6B7280" }}
            >
              Nigeria&apos;s boldest anonymous messaging platform. Say what you
              really feel — no fear, no judgment.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 md:gap-24">
            <div className="flex flex-col gap-4">
              <h4 className="font-body text-xs font-extrabold uppercase tracking-widest text-white">
                Product
              </h4>
              <Link
                href="#features"
                className="font-body text-sm no-underline transition-colors duration-150"
                style={{ color: "#6B7280" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  ((e.target as HTMLAnchorElement).style.color = "#A78BFA")
                }
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  ((e.target as HTMLAnchorElement).style.color = "#6B7280")
                }
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="font-body text-sm no-underline transition-colors duration-150"
                style={{ color: "#6B7280" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  ((e.target as HTMLAnchorElement).style.color = "#A78BFA")
                }
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  ((e.target as HTMLAnchorElement).style.color = "#6B7280")
                }
              >
                How it works
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-body text-xs font-extrabold uppercase tracking-widest text-white">
                Legal
              </h4>
              <span
                className="font-body text-sm cursor-default"
                style={{ color: "#6B7280" }}
              >
                Privacy Policy
              </span>
              <span
                className="font-body text-sm cursor-default"
                style={{ color: "#6B7280" }}
              >
                Terms of Service
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTopColor: "rgba(139, 92, 246, 0.1)" }}
        >
          <p className="font-body text-xs" style={{ color: "#6B7280" }}>
            © {currentYear} Inkognito. All rights reserved.
          </p>
          <p className="font-body text-xs" style={{ color: "#6B7280" }}>
            Made with 💜 in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}
