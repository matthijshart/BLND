"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/today", label: "Today", icon: "☕" },
  { href: "/matches", label: "Matches", icon: "💬" },
  { href: "/dates", label: "Dates", icon: "📅" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stripe-white">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? "text-coral" : "text-gray"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
