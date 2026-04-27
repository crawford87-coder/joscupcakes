"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkle } from "./Decorative";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/order", label: "Order" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full px-6 py-5 relative z-50">
      <nav className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-im-fell-sc text-berry text-xl tracking-wide flex items-center gap-2 hover:text-rose transition-colors"
        >
          <Sparkle size={12} className="text-rose-light" />
          Jo&apos;s Cupcakes
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`font-im-fell-sc text-sm tracking-widest uppercase transition-colors ${
                  pathname === href
                    ? "text-rose border-b-2 border-rose pb-0.5"
                    : "text-plum hover:text-rose"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/order" className="btn-primary text-sm py-2 px-5">
              ✦ Order
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className={`block w-6 h-0.5 bg-berry transition-transform duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-berry transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-berry transition-transform duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm border-b-2 border-dashed border-border-pink shadow-card px-6 py-6 flex flex-col gap-5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`font-im-fell-sc text-sm tracking-widest uppercase transition-colors ${
                pathname === href ? "text-rose" : "text-plum hover:text-rose"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/order"
            onClick={() => setOpen(false)}
            className="btn-primary text-sm py-3 justify-center"
          >
            ✦ Order
          </Link>
        </div>
      )}
    </header>
  );
}
