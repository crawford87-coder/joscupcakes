"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkle } from "./Decorative";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/order", label: "Order" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="w-full px-6 py-5">
      <nav className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-im-fell-sc text-berry text-xl tracking-wide flex items-center gap-2 hover:text-rose transition-colors"
        >
          <Sparkle size={12} className="text-rose-light" />
          Jo&apos;s Cupcakes
        </Link>

        {/* Links */}
        <ul className="flex items-center gap-6">
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
      </nav>
    </header>
  );
}
