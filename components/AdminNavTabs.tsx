"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Orders", href: "/admin" },
  { label: "Calendar", href: "/admin/calendar" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Customers", href: "/admin/customers" },
];

export default function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b-2 border-border-pink bg-white/90 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-0 overflow-x-auto">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`font-im-fell-sc text-sm tracking-wide px-5 py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-rose text-rose"
                  : "border-transparent text-plum/60 hover:text-plum hover:border-border-pink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
