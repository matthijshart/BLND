"use client";

import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import Image from "next/image";
import type { User } from "@/types";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";
import { PhotoViewer } from "@/components/ui/PhotoViewer";

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
  const [exitX, setExitX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const photos = profile.photos?.length > 0 ? profile.photos : ["/images/sipping.png"];

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = 150; // Higher threshold — need to really mean it
    const velocityThreshold = 500;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swipe right — like
      setExitX(500);
      setSwiped(true);
      setTimeout(() => onLike(), 300);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swipe left — pass
      setExitX(-500);
      setSwiped(true);
      setTimeout(() => onPass(), 300);
    }
    setDragDirection(null);
  }

  function handleDrag(_: unknown, info: PanInfo) {
    if (info.offset.x > 50) setDragDirection("right");
    else if (info.offset.x < -50) setDragDirection("left");
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
        drag={previewMode || swiped ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={swiped ? { x: exitX, opacity: 0, rotate: exitX > 0 ? 15 : -15 } : { x: 0 }}
        transition={swiped ? { duration: 0.3, ease: "easeOut" } : { type: "spring", stiffness: 500, damping: 30 }}
        style={{ rotate: 0 }}
        whileDrag={{ scale: 1.02 }}
        className="rounded-2xl overflow-hidden shadow-lg bg-white cursor-grab active:cursor-grabbing"
      >
        {/* Photo section — shorter to show content below */}
        <div className="relative aspect-[4/5]">
          <Image
            src={photos[photoIndex]}
            alt={profile.displayName}
            fill
            className="object-cover pointer-events-none"
            priority
          />

          {/* Photo navigation — tap left/right, center to enlarge */}
          {photos.length > 1 ? (
            <>
              <button onClick={prevPhoto} className="absolute inset-y-0 left-0 w-1/3 z-10" />
              <button onClick={() => setViewerOpen(true)} className="absolute inset-y-0 left-1/3 w-1/3 z-10" />
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
          ) : (
            <button onClick={() => setViewerOpen(true)} className="absolute inset-0 z-10" />
          )}

          {/* Drag indicator — large and clear */}
          {dragDirection === "right" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-12 left-6 px-6 py-3 rounded-2xl bg-wine/90 backdrop-blur-sm text-cream font-display text-xl rotate-[-12deg] z-20 shadow-lg border-2 border-cream/30"
            >
              ☕ Interested
            </motion.div>
          )}
          {dragDirection === "left" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-12 right-6 px-6 py-3 rounded-2xl bg-ink/70 backdrop-blur-sm text-white font-display text-xl rotate-[12deg] z-20 shadow-lg border-2 border-white/20"
            >
              Pass
            </motion.div>
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

        {/* Content below photo — always visible, scroll to see */}
        <div className="p-5 space-y-4">
          {/* Coffee order as signature */}
          {profile.coffeeOrder && (
            <div className="flex items-center gap-3 -mt-1">
              <span className="text-lg">☕</span>
              <div>
                <p className="text-[9px] text-gray uppercase tracking-[0.2em]">Go-to coffee</p>
                <p className="text-ink font-medium text-sm">{profile.coffeeOrder}</p>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-ink-mid text-[15px] leading-relaxed">{profile.bio}</p>
          )}

          {/* Prompts — compact, clean */}
          {profile.prompts && profile.prompts.length > 0 && (
            <div className="space-y-2.5">
              {profile.prompts.map((p, i) => (
                <div key={i} className="bg-cream rounded-xl px-4 py-3.5">
                  <p className="text-wine text-[10px] font-medium uppercase tracking-wider mb-1">{p.question}</p>
                  <p className="text-ink text-[15px] leading-snug">{p.answer}</p>
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
                <p className="text-cream text-sm font-medium">Their soundtrack</p>
              </div>
              <SpotifyPlayer trackUrl={profile.profileSong} autoplay />
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3.5 py-1.5 rounded-full bg-wine/8 text-ink text-xs font-medium border border-wine/10"
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

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <PhotoViewer
            photos={photos}
            initialIndex={photoIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
