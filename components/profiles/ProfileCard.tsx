"use client";

import { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import type { User } from "@/types";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";

interface ProfileCardProps {
  profile: User;
  currentUser?: User;
  onLike: () => void;
  onPass: () => void;
  previewMode?: boolean;
}

export function ProfileCard({ profile, onLike, onPass, previewMode }: ProfileCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);

  const photos = profile.photos?.length > 0 ? profile.photos : ["/images/sipping.png"];

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

  function nextPhoto() {
    if (photoIndex < photos.length - 1) setPhotoIndex(photoIndex + 1);
  }

  function prevPhoto() {
    if (photoIndex > 0) setPhotoIndex(photoIndex - 1);
  }

  return (
    <div className="relative">
      {/* Scrollable profile card */}
      <motion.div
        drag={previewMode ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.01 }}
        className="rounded-2xl overflow-hidden shadow-lg bg-white cursor-grab active:cursor-grabbing"
      >
        {/* Photo section */}
        <div className="relative aspect-[3/4]">
          <Image
            src={photos[photoIndex]}
            alt={profile.displayName}
            fill
            className="object-cover pointer-events-none"
            priority
          />

          {/* Photo navigation — tap left/right */}
          {photos.length > 1 && (
            <>
              <button onClick={prevPhoto} className="absolute inset-y-0 left-0 w-1/3 z-10" />
              <button onClick={nextPhoto} className="absolute inset-y-0 right-0 w-1/3 z-10" />
              {/* Progress dots */}
              <div className="absolute top-3 inset-x-0 flex gap-1 px-3 z-20">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-[2.5px] rounded-full ${i === photoIndex ? "bg-white/90" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Drag indicator */}
          {dragDirection === "right" && (
            <div className="absolute top-8 left-6 px-4 py-2 rounded-full bg-wine text-cream font-medium text-sm rotate-[-12deg] z-20">
              ☕ Interested
            </div>
          )}
          {dragDirection === "left" && (
            <div className="absolute top-8 right-6 px-4 py-2 rounded-full bg-gray text-white font-medium text-sm rotate-[12deg] z-20">
              Pass
            </div>
          )}

          {/* Gradient + name overlay */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 p-5 z-10">
            <h3 className="text-2xl font-display text-white">
              {profile.displayName}, {profile.age}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-white/60 text-sm">{profile.neighborhood}</span>
            </div>
          </div>
        </div>

        {/* Content below photo — always visible, no click needed */}
        <div className="p-5 space-y-3">
          {/* Bio */}
          {profile.bio && (
            <p className="text-ink text-[15px] leading-relaxed">{profile.bio}</p>
          )}

          {/* Coffee order */}
          {profile.coffeeOrder && (
            <div className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
              <span className="text-lg">☕</span>
              <div>
                <p className="text-[10px] text-gray uppercase tracking-wider">Their order</p>
                <p className="text-ink text-sm font-medium">{profile.coffeeOrder}</p>
              </div>
            </div>
          )}

          {/* Prompts */}
          {profile.prompts && profile.prompts.length > 0 && (
            <div className="space-y-2">
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
            <div className="bg-wine/5 rounded-xl p-4">
              <p className="text-wine text-xs font-medium italic mb-1">Fun fact</p>
              <p className="text-ink text-[15px]">{profile.profilePrompt}</p>
            </div>
          )}

          {/* Profile song — prominent */}
          {profile.profileSong && (
            <div className="bg-wine rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-cream">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="#6b1520" />
                </svg>
                <p className="text-cream text-sm font-medium">Their date soundtrack</p>
              </div>
              <SpotifyPlayer trackUrl={profile.profileSong} autoplay />
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full bg-cream text-ink-mid text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Action buttons */}
      {!previewMode && (
        <div className="flex justify-center gap-6 mt-5">
          <button
            onClick={onPass}
            className="w-14 h-14 rounded-full bg-white text-gray flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={onLike}
            className="w-14 h-14 rounded-full bg-wine text-cream flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
