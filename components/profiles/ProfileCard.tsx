"use client";

import { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import type { User } from "@/types";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";
import { calculateVibeMatch } from "@/lib/vibe";
import { getCoffeeCompatibility } from "@/lib/coffee-compat";

interface ProfileCardProps {
  profile: User;
  currentUser?: User;
  onLike: () => void;
  onPass: () => void;
  /** When true, hides swipe/action buttons (used for preview mode) */
  previewMode?: boolean;
}

export function ProfileCard({ profile, currentUser, onLike, onPass, previewMode }: ProfileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);

  const vibeMatch = currentUser ? calculateVibeMatch(currentUser, profile) : null;
  const coffeeCompat =
    currentUser?.coffeeOrder && profile.coffeeOrder
      ? getCoffeeCompatibility(currentUser.coffeeOrder, profile.coffeeOrder)
      : null;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 100) {
      onLike();
    } else if (info.offset.x < -100) {
      onPass();
    }
    setDragDirection(null);
  }

  function handleDrag(_: unknown, info: PanInfo) {
    if (info.offset.x > 30) setDragDirection("right");
    else if (info.offset.x < -30) setDragDirection("left");
    else setDragDirection(null);
  }

  if (expanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 z-50 bg-cream overflow-y-auto"
      >
        <div className="max-w-sm mx-auto pb-32">
          {/* Photos */}
          <div className="relative aspect-[3/4]">
            <Image
              src={profile.photos[0] || "/images/sipping.png"}
              alt={profile.displayName}
              fill
              className="object-cover"
            />
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-ink/50 text-cream flex items-center justify-center text-lg"
            >
              x
            </button>

            {/* Vibe match badge on expanded photo */}
            {vibeMatch !== null && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-wine/90 backdrop-blur-sm text-cream text-xs font-medium">
                {vibeMatch}% vibe
              </div>
            )}
          </div>

          {/* More photos */}
          {profile.photos.length > 1 && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              {profile.photos.slice(1).map((photo, i) => (
                <div key={i} className="relative aspect-square">
                  <Image src={photo} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="px-6 py-6">
            <h2 className="text-3xl font-display text-ink">
              {profile.displayName}, {profile.age}
            </h2>
            <p className="text-gray text-sm mt-1">{profile.neighborhood}</p>

            <p className="text-ink-mid mt-4 leading-relaxed">{profile.bio}</p>

            {/* Coffee order */}
            {profile.coffeeOrder && (
              <div className="mt-5 flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
                <span className="text-xl">☕</span>
                <div>
                  <p className="text-[10px] text-gray uppercase tracking-wider">Their order</p>
                  <p className="text-ink text-[15px] font-medium">{profile.coffeeOrder}</p>
                </div>
              </div>
            )}

            {/* Coffee compatibility badge */}
            {coffeeCompat && (
              <div className="mt-2 px-4 py-2 rounded-xl bg-wine/10 text-wine text-xs font-medium italic">
                {coffeeCompat}
              </div>
            )}

            {/* Prompts */}
            {profile.prompts && profile.prompts.length > 0 && (
              <div className="mt-5 space-y-2">
                {profile.prompts.map((p, i) => (
                  <div key={i} className="bg-wine/5 rounded-xl p-4">
                    <p className="text-wine text-xs font-medium italic mb-1">{p.question}</p>
                    <p className="text-ink text-[15px]">{p.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Legacy profile prompt */}
            {profile.profilePrompt && !profile.prompts?.length && (
              <div className="mt-5 bg-wine/5 rounded-xl p-4">
                <p className="text-wine text-xs font-medium italic mb-1">
                  Fun fact
                </p>
                <p className="text-ink text-[15px]">{profile.profilePrompt}</p>
              </div>
            )}

            {/* Profile song — autoplay when viewing someone's profile */}
            {profile.profileSong && (
              <div className="mt-4">
                <p className="text-xs text-gray uppercase tracking-wider font-medium mb-2">Their song</p>
                <SpotifyPlayer trackUrl={profile.profileSong} autoplay />
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.interests.map((interest) => (
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

          {/* Fixed action buttons — hidden in preview mode */}
          {!previewMode && (
            <div className="fixed bottom-0 inset-x-0 bg-cream/90 backdrop-blur-sm pb-8 pt-4 px-6">
              <div className="flex justify-center gap-6 max-w-sm mx-auto">
                <button
                  onClick={() => { setExpanded(false); onPass(); }}
                  className="w-16 h-16 rounded-full bg-stripe-white text-gray flex items-center justify-center text-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  ✕
                </button>
                <button
                  onClick={() => { setExpanded(false); onLike(); }}
                  className="w-16 h-16 rounded-full bg-coral text-white flex items-center justify-center text-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  ☕
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        drag={previewMode ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02 }}
        className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg cursor-grab active:cursor-grabbing"
      >
        <Image
          src={profile.photos[0] || "/images/sipping.png"}
          alt={profile.displayName}
          fill
          className="object-cover pointer-events-none"
          priority
        />

        {/* Drag indicator */}
        {dragDirection === "right" && (
          <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-coral text-white font-medium text-sm rotate-[-12deg]">
            ☕ Interested
          </div>
        )}
        {dragDirection === "left" && (
          <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-gray text-white font-medium text-sm rotate-[12deg]">
            Pass
          </div>
        )}

        {/* Vibe match badge on compact card */}
        {vibeMatch !== null && (
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-wine/90 backdrop-blur-sm text-cream text-xs font-medium">
            {vibeMatch}% vibe
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Info overlay */}
        <button
          onClick={() => setExpanded(true)}
          className="absolute inset-x-0 bottom-0 p-6 text-left"
        >
          <h3 className="text-2xl font-display text-white">
            {profile.displayName}, {profile.age}
          </h3>
          <p className="text-white/70 text-sm mt-1">{profile.neighborhood}</p>
          {profile.bio && (
            <p className="text-white/60 text-sm mt-2 line-clamp-2">{profile.bio}</p>
          )}
        </button>
      </motion.div>

      {/* Action buttons — hidden in preview mode */}
      {!previewMode && (
        <div className="flex justify-center gap-6 mt-6">
          <button
            onClick={onPass}
            className="w-16 h-16 rounded-full bg-stripe-white text-gray flex items-center justify-center text-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            ✕
          </button>
          <button
            onClick={onLike}
            className="w-16 h-16 rounded-full bg-coral text-white flex items-center justify-center text-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            ☕
          </button>
        </div>
      )}
    </div>
  );
}
