"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AddToHomescreen } from "@/components/ui/AddToHomescreen";
import { PageTransition } from "@/components/ui/PageTransition";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";
import { WelcomeBack } from "@/components/ui/WelcomeBack";
import { AppLoader } from "@/components/ui/AppLoader";
import { motion } from "framer-motion";

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
  { href: "/matches", label: "Blends", Icon: IconMatches },
  { href: "/dates", label: "Meets", Icon: IconDates },
  { href: "/profile", label: "Profile", Icon: IconProfile },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, profile, hasProfile, loading } = useAuthContext();
  const [newBlends, setNewBlends] = useState(0);
  // Loader: stays mounted until both auth loading completes AND the
  // greeting phase finishes. `loaderDone` is the gate. Once true, we
  // unmount the loader so the app is fully interactive underneath.
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.push("/login");
    } else if (!hasProfile) {
      router.push("/onboarding");
    } else if (profile?.bannedAt) {
      // Banned user can't access the app — bounce to /banned
      router.replace("/banned");
    }
  }, [firebaseUser, hasProfile, loading, profile?.bannedAt, router]);

  // Badge = actionable blends (need to plan OR need to confirm proposed date).
  // It reflects real state — no manual reset needed.
  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, "matches"),
      where("users", "array-contains", firebaseUser.uid),
      where("status", "in", ["scheduling", "date_proposed"])
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const now = Date.now();
      // Filter out expired matches (the hook does this too, but keep badge honest)
      const active = snap.docs.filter((d) => {
        const expiresAt = d.data().expiresAt?.toMillis?.();
        return !expiresAt || expiresAt > now;
      });
      setNewBlends(active.length);
    }, () => {});
    return unsubscribe;
  }, [firebaseUser]);

  if (!firebaseUser || (!loading && !hasProfile)) {
    // No user yet, or no profile yet: redirect is in flight in the
    // effect above. While that happens, show the loader idle on logo.
    return <AppLoader onComplete={() => setLoaderDone(true)} />;
  }

  // Cold-load loader: wait for the profile name to arrive, then greet.
  // Once `loaderDone` flips, we render the actual app underneath.
  const firstName = profile?.displayName?.split(" ")[0];

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Cold-load loader — sits on top until greeting completes */}
      {!loaderDone && (
        <AppLoader
          firstName={firstName}
          onComplete={() => setLoaderDone(true)}
        />
      )}
      <main className="flex-1 pb-20">
          <PageTransition>{children}</PageTransition>
        </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stripe-white pb-[env(safe-area-inset-bottom)]">
        <div className="relative flex justify-around items-center h-14 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 text-[10px] font-medium tracking-wide uppercase transition-colors relative py-1 ${
                  isActive ? "text-wine" : "text-gray-light"
                }`}
              >
                <div className="relative">
                  <item.Icon active={isActive} />
                  {item.href === "/matches" && newBlends > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-wine text-cream text-[9px] font-bold rounded-full flex items-center justify-center">
                      {newBlends > 9 ? "9+" : newBlends}
                    </span>
                  )}
                </div>
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-b-full bg-wine"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <AddToHomescreen />
      <WelcomeScreen />
      <WelcomeBack />
    </div>
  );
}
