"use client";

import { useMatches } from "@/hooks/useMatches";
import Image from "next/image";
import Link from "next/link";

export default function MatchesPage() {
  const { matches, loading } = useMatches();

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Matches</h1>
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
        <h1 className="text-2xl font-display text-ink mb-6">Matches</h1>
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-wine/30" />
            <div className="w-px h-6 bg-ink/10" />
            <div className="w-3 h-3 rounded-full bg-wine/30" />
          </div>
          <h2 className="text-2xl font-display text-ink">No matches yet</h2>
          <p className="text-gray mt-2 max-w-xs">
            Your daily profiles refresh tomorrow. Keep showing up — good things take time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-display text-ink mb-6">Matches</h1>
      <div className="space-y-3">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
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
                  ? "bg-coral/10 text-coral"
                  : match.status === "date_confirmed"
                  ? "bg-blue/10 text-blue"
                  : "bg-stripe-white text-gray"
              }`}
            >
              {match.status === "scheduling"
                ? "Plan date"
                : match.status === "date_confirmed"
                ? "Date planned"
                : match.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
