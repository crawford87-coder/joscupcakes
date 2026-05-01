"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Don't show nav on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className="w-full px-6 py-4 relative z-50"
      style={{ backgroundColor: "rgba(250,247,242,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid #E8DDD4" }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-caveat text-xl tracking-wide transition-opacity hover:opacity-70"
          style={{ color: "#4A2545" }}
        >
          ✦ Jo&apos;s Cupcakes
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-7">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="font-eb-garamond text-base transition-all"
                style={{
                  color: pathname === href ? "#D4788E" : "#7A4A6E",
                  borderBottom: pathname === href ? "2px solid #D4788E" : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/#build"
              onClick={() => setOpen(false)}
              className="font-eb-garamond text-base px-5 py-2 rounded-pill transition-all"
              style={{
                backgroundColor: "#D4788E",
                color: "white",
              }}
            >
              ✦ Build a Cupcake
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span
            className={`block w-5 h-0.5 transition-transform duration-200 ${open ? "rotate-45 translate-y-2" : ""}`}
            style={{ backgroundColor: "#4A2545" }}
          />
          <span
            className={`block w-5 h-0.5 transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
            style={{ backgroundColor: "#4A2545" }}
          />
          <span
            className={`block w-5 h-0.5 transition-transform duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`}
            style={{ backgroundColor: "#4A2545" }}
          />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden absolute top-full left-0 right-0 px-6 py-6 flex flex-col gap-5"
          style={{
            backgroundColor: "rgba(250,247,242,0.98)",
            borderBottom: "1px solid #E8DDD4",
            backdropFilter: "blur(8px)",
          }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="font-eb-garamond text-lg transition-colors"
              style={{ color: pathname === href ? "#D4788E" : "#7A4A6E" }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/#build"
            onClick={() => setOpen(false)}
              className="font-eb-garamond text-lg py-3 rounded-pill text-center transition-all"
            style={{ backgroundColor: "#D4788E", color: "white" }}
          >
            ✦ Build a Cupcake
          </Link>
        </div>
      )}
    </header>
  );
}

