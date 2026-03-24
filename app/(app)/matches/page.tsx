"use client";

import { useMatches } from "@/hooks/useMatches";
import Image from "next/image";
import Link from "next/link";

export default function MatchesPage() {
  const { matches, loading } = useMatches();

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Blends</h1>
        <div className="space-y-3">
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
          <Image
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

  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-display text-ink mb-6">Blends</h1>
      <div className="space-y-3">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-wine/10">
              <Image
                src={match.otherUser.photos[0] || "/images/sipping.png"}
                alt={match.otherUser.displayName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg text-ink">
                {match.otherUser.displayName}, {match.otherUser.age}
              </h3>
              <p className="text-gray text-sm">{match.otherUser.neighborhood}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                match.status === "scheduling"
                  ? "bg-wine/10 text-wine"
                  : match.status === "date_confirmed"
                  ? "bg-blue/10 text-blue"
                  : match.status === "date_proposed"
                  ? "bg-coral/10 text-coral"
                  : "bg-stripe-white text-gray"
              }`}
            >
              {match.status === "scheduling"
                ? "Plan date"
                : match.status === "date_proposed"
                ? "Confirm date"
                : match.status === "date_confirmed"
                ? "Date planned ✓"
                : match.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
