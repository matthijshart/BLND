"use client";

import { useDailyProfiles } from "@/hooks/useDailyProfiles";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { DoneForToday } from "@/components/profiles/DoneForToday";
import { checkForMatch, createMatch } from "@/lib/matching";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoffeeBeans } from "@/components/ui/CoffeeBeans";
import { playBlendSound, triggerHaptic } from "@/lib/sounds";

export default function TodayPage() {
  const { firebaseUser, profile: currentUser } = useAuthContext();
  const { currentProfile, currentIndex, total, isComplete, loading, handleAction } =
    useDailyProfiles();
  const [matchedUid, setMatchedUid] = useState<string | null>(null);

  async function onLike() {
    if (!firebaseUser) return;
    const targetUid = await handleAction("like");
    if (targetUid) {
      const isMatch = await checkForMatch(firebaseUser.uid, targetUid);
      if (isMatch) {
        await createMatch(firebaseUser.uid, targetUid);
        setMatchedUid(targetUid);
        playBlendSound();
        triggerHaptic();
      }
    }
  }

  async function onPass() {
    await handleAction("pass");
  }

  if (loading) {
    return (
      <div className="px-4 pt-8 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-20 bg-stripe-white rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-stripe-white rounded-full animate-pulse" />
        </div>
        <div className="aspect-[3/4] rounded-2xl bg-stripe-white animate-pulse" />
        <div className="flex justify-center gap-6 mt-6">
          <div className="w-16 h-16 rounded-full bg-stripe-white animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-stripe-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (isComplete || !currentProfile) {
    return <DoneForToday />;
  }

  return (
    <div className="px-4 pt-8 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-ink">Today</h1>
        <span className="text-gray text-sm font-mono">
          {currentIndex + 1} of {total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentProfile.uid}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <ProfileCard
            profile={currentProfile}
            currentUser={currentUser ?? undefined}
            onLike={onLike}
            onPass={onPass}
          />
        </motion.div>
      </AnimatePresence>

      {/* Match notification */}
      <AnimatePresence>
        {matchedUid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 bg-wine flex flex-col items-center justify-center px-6"
          >
            <CoffeeBeans />

            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-4 h-4 rounded-full bg-cream" />
              <div className="w-px h-8 bg-cream/30" />
              <div className="w-4 h-4 rounded-full bg-cream" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl font-display text-cream text-center"
            >
              It&apos;s a blend!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-cream/60 mt-4 text-center max-w-xs"
            >
              Time to plan a coffee. We&apos;ll pick the spot.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col gap-3 w-full max-w-xs mt-10"
            >
              <button
                onClick={() => setMatchedUid(null)}
                className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors"
              >
                Keep browsing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
