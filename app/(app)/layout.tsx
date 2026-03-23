"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { AddToHomescreen } from "@/components/ui/AddToHomescreen";

function IconToday({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 110 8h-1" />
      <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

function IconMatches({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconDates({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  );
}

const navItems = [
  { href: "/today", label: "Today", Icon: IconToday },
  { href: "/matches", label: "Matches", Icon: IconMatches },
  { href: "/dates", label: "Dates", Icon: IconDates },
  { href: "/profile", label: "Profile", Icon: IconProfile },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, hasProfile, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.push("/login");
    } else if (!hasProfile) {
      router.push("/onboarding");
    }
  }, [firebaseUser, hasProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-wine/20 animate-pulse" />
      </div>
    );
  }

  if (!firebaseUser || !hasProfile) return null;

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stripe-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium tracking-wide uppercase transition-colors ${
                  isActive ? "text-wine" : "text-gray-light"
                }`}
              >
                <item.Icon active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AddToHomescreen />
    </div>
  );
}
