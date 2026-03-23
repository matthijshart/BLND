"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getMatchWithProfile } from "@/lib/matching";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { Match, User } from "@/types";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuthContext();
  const [match, setMatch] = useState<Match | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!firebaseUser || !params.id) return;
      const result = await getMatchWithProfile(
        params.id as string,
        firebaseUser.uid
      );
      if (result) {
        setMatch(result.match);
        setOtherUser(result.otherUser);
      }
      setLoading(false);
    }
    load();
  }, [firebaseUser, params.id]);

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="aspect-[3/4] rounded-2xl bg-stripe-white animate-pulse" />
      </div>
    );
  }

  if (!match || !otherUser) {
    return (
      <div className="px-4 pt-8 text-center">
        <p className="text-gray">Match not found.</p>
        <button
          onClick={() => router.push("/matches")}
          className="mt-4 text-wine font-medium"
        >
          Back to matches
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto pb-24">
      {/* Back button */}
      <div className="px-4 pt-6 mb-4">
        <button
          onClick={() => router.push("/matches")}
          className="text-gray text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Main photo */}
      <div className="relative aspect-[3/4] mx-4 rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={otherUser.photos[0] || "/images/sipping.png"}
          alt={otherUser.displayName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6">
          <h2 className="text-3xl font-display text-white">
            {otherUser.displayName}, {otherUser.age}
          </h2>
          <p className="text-white/70 text-sm mt-1">{otherUser.neighborhood}</p>
        </div>
      </div>

      {/* More photos */}
      {otherUser.photos.length > 1 && (
        <div className="grid grid-cols-2 gap-2 mx-4 mt-2">
          {otherUser.photos.slice(1).map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
              <Image src={photo} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Bio */}
      <div className="px-6 mt-6">
        <p className="text-ink-mid leading-relaxed">{otherUser.bio}</p>

        {otherUser.interests && otherUser.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {otherUser.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 rounded-full bg-stripe-white text-ink-mid text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Match status / action */}
      <div className="fixed bottom-20 inset-x-0 bg-cream/90 backdrop-blur-sm py-4 px-6">
        <div className="max-w-sm mx-auto">
          {match.status === "scheduling" ? (
            <div className="text-center">
              <p className="text-gray text-sm mb-3">
                Date planning coming soon
              </p>
              <div className="py-4 rounded-full bg-wine text-cream font-medium text-lg text-center">
                ☕ Plan your date
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray text-sm">
                Status: {match.status}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
