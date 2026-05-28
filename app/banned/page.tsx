"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth";

/**
 * Banned screen. Users land here when their `bannedAt` is set.
 *
 * Note: the AuthProvider gate handles the redirect — this page just
 * presents the explanation. Once they tap "Sign out" they're released
 * from the auth state, but their UID stays flagged in Firestore so
 * they can't recreate the same account.
 */
export default function BannedPage() {
  const router = useRouter();
  const { profile, loading } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  // If somehow they land here without being banned, bounce them home
  useEffect(() => {
    if (!loading && profile && !profile.bannedAt) {
      router.replace("/today");
    }
  }, [loading, profile, router]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
  }

  const reason = profile?.banReason;
  const reasonCopy =
    reason === "no_show"
      ? "Not showing up to a meet without warning."
      : reason === "repeated_cancellations"
      ? "Repeated cancellations within a short window."
      : "A serious breach of BLEND's etiquette.";

  return (
    <div className="min-h-dvh bg-cream flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-6xl mb-6">🚫</p>

      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-coral mb-3">
        Account suspended
      </p>

      <h1 className="text-3xl font-display text-ink leading-tight">
        Your BLEND account is closed.
      </h1>

      <p className="text-ink-mid text-sm mt-4 max-w-md leading-relaxed">
        BLEND is built on one promise: people show up.
        That promise is broken by:
      </p>

      <p className="text-ink mt-3 italic max-w-md">{reasonCopy}</p>

      <p className="text-ink-mid text-sm mt-6 max-w-md leading-relaxed">
        This ban is permanent. Creating a new account with the same identity is against our terms.
      </p>

      <p className="text-gray-light text-xs mt-8 max-w-md leading-relaxed">
        Think this is a mistake? Email{" "}
        <a href="mailto:hello@bl-nd.nl" className="text-wine underline">
          hello@bl-nd.nl
        </a>{" "}
        and we&apos;ll review it personally.
      </p>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="mt-10 px-8 py-3 rounded-full bg-ink text-cream text-sm font-medium disabled:opacity-50"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
