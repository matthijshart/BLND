"use client";

import { useMatches } from "@/hooks/useMatches";
import { useAuthContext } from "@/components/providers/AuthProvider";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@/types";
import { ShimmerImage } from "@/components/ui/ShimmerImage";

function getCoffeeCombo(myOrder: string | undefined, theirOrder: string | undefined): string | null {
  if (!myOrder || !theirOrder) return null;
  const my = myOrder.toLowerCase();
  const their = theirOrder.toLowerCase();
  if (my === their) return "Perfect match — same order!";
  if (my.includes("espresso") && their.includes("espresso")) return "Double espresso energy";
  if ((my.includes("oat") && their.includes("oat")) || (my.includes("flat white") && their.includes("flat white"))) return "Oat milk soulmates";
  if ((my.includes("chai") || their.includes("chai")) && (my.includes("espresso") || their.includes("espresso"))) return "Opposites attract";
  if (my.includes("matcha") || their.includes("matcha")) return "One of you is the healthy one";
  return null;
}

function getSharedCount(me: User | null, them: User): number {
  if (!me) return 0;
  return (me.interests || []).filter((i) => (them.interests || []).includes(i)).length;
}

export default function MatchesPage() {
  const { matches, loading } = useMatches();
  const { profile } = useAuthContext();

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Blends</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-stripe-white animate-pulse">
              <div className="w-14 h-14 rounded-full bg-cream" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-cream rounded-full" />
                <div className="h-3 w-16 bg-cream rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Blends</h1>

        {/* Mood image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
          <ShimmerImage
            src="/images/coffe couple.jpeg"
            alt="Coffee date"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6">
            <h2 className="text-2xl font-display text-white">No blends yet</h2>
            <p className="text-white/70 text-sm mt-2 max-w-[260px] leading-relaxed">
              Your daily profiles drop at 11:00. Like someone, they like you back, and this could be you.
            </p>
          </div>
        </div>

        <Link
          href="/today"
          className="block text-center w-full py-4 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors"
        >
          Browse today&apos;s profiles
        </Link>
      </div>
    );
  }

  // Sort into sections
  const needsYou = matches.filter((m) => m.status === "date_proposed" || m.status === "scheduling");
  const planned = matches.filter((m) => m.status === "date_confirmed");
  const secondCups = matches.filter((m) => m.status === "second_cup");

  return (
    <div className="px-4 pt-8 pb-8">
      <h1 className="text-2xl font-display text-ink mb-6">Blends</h1>

      {needsYou.length > 0 && (
        <Section label="Needs you" color="coral">
          {needsYou.map((m) => (
            <MatchRow key={m.id} match={m} profile={profile} />
          ))}
        </Section>
      )}

      {secondCups.length > 0 && (
        <Section label="Second cup" color="wine">
          {secondCups.map((m) => (
            <MatchRow key={m.id} match={m} profile={profile} />
          ))}
        </Section>
      )}

      {planned.length > 0 && (
        <Section label="Planned" color="gray">
          {planned.map((m) => (
            <MatchRow key={m.id} match={m} profile={profile} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ label, color, children }: { label: string; color: "coral" | "wine" | "gray"; children: React.ReactNode }) {
  const colorClass = color === "coral" ? "text-coral" : color === "wine" ? "text-wine" : "text-gray";
  const dotClass = color === "coral" ? "bg-coral" : color === "wine" ? "bg-wine" : "bg-gray-light";
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <p className={`text-[10px] font-mono uppercase tracking-[0.25em] ${colorClass}`}>{label}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MatchRow({ match, profile }: { match: ReturnType<typeof useMatches>["matches"][number]; profile: User | null }) {
  const statusMap: Record<string, { label: string; style: string }> = {
    scheduling: { label: "Plan meet", style: "bg-coral/10 text-coral" },
    date_proposed: { label: "Confirm meet", style: "bg-coral text-white" },
    date_confirmed: { label: "Planned ✓", style: "bg-wine/10 text-wine" },
    second_cup: { label: "☕☕", style: "bg-wine text-cream" },
  };
  const s = statusMap[match.status] || { label: match.status, style: "bg-stripe-white text-gray" };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-wine/10">
          <ShimmerImage
            src={match.otherUser.photos[0] || "/images/sipping.png"}
            alt={match.otherUser.displayName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-ink truncate">
            {match.otherUser.displayName}, {match.otherUser.age}
          </h3>
          <p className="text-gray text-sm truncate">{match.otherUser.neighborhood}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${s.style}`}>
          {s.label}
        </span>
      </div>

      {/* Coffee combo + shared interests */}
      {(() => {
        const combo = getCoffeeCombo(profile?.coffeeOrder, match.otherUser.coffeeOrder);
        const shared = getSharedCount(profile, match.otherUser);
        if (!combo && shared === 0) return null;
        return (
          <div className="mt-3 pt-3 border-t border-cream flex items-center gap-3 flex-wrap">
            {combo && (
              <span className="flex items-center gap-1.5 text-[11px] text-wine font-medium">
                <span>☕</span> {combo}
              </span>
            )}
            {shared > 0 && (
              <span className="text-[11px] text-gray">
                {shared} shared interest{shared > 1 ? "s" : ""}
              </span>
            )}
          </div>
        );
      })()}
    </Link>
  );
}
