"use client";

import { useAuthContext } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Admin allowlist — UIDs of trusted operators.
 *
 * Set via env var `NEXT_PUBLIC_ADMIN_UIDS` (comma-separated) so we don't
 * hardcode UIDs in the bundle. In dev, you can fall back to the inline
 * list below.
 *
 * NOTE: This is a UI gate, not real security. A determined attacker with
 * Firestore SDK access can still read everything the rules allow. Real
 * admin enforcement happens at the Firestore-rules + Admin-SDK layer.
 */
function getAdminUids(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_UIDS;
  if (fromEnv) return fromEnv.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuthContext();
  const router = useRouter();
  const adminUids = getAdminUids();
  const isAdmin = firebaseUser && adminUids.includes(firebaseUser.uid);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login?next=/admin/metrics");
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-wine/20 animate-pulse" />
      </div>
    );
  }

  if (!firebaseUser) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine mb-3">
          403
        </p>
        <h1 className="text-3xl font-display text-ink">Not for you.</h1>
        <p className="text-ink-mid mt-3 max-w-sm">
          This page is admin-only. If you think you should have access, add
          your UID to <code className="font-mono text-xs">NEXT_PUBLIC_ADMIN_UIDS</code>.
        </p>
        <p className="text-gray-light text-xs mt-6 font-mono">
          Your UID: <span className="select-all">{firebaseUser.uid}</span>
        </p>
      </div>
    );
  }

  return <div className="min-h-dvh bg-cream">{children}</div>;
}
