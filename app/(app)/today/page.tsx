"use client";

import { useDailyProfiles } from "@/hooks/useDailyProfiles";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { DoneForToday } from "@/components/profiles/DoneForToday";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoffeeBeans } from "@/components/ui/CoffeeBeans";
import { playBlendSound, triggerHaptic } from "@/lib/sounds";

const MATCH_MODAL_DELAY_MS = 450; // Wait for ProfileCard exit animation to finish

export default function TodayPage() {
  const { profile: currentUser } = useAuthContext();
  const {
    currentProfile,
    currentIndex,
    total,
    isComplete,
    loading,
    lastPassed,
    handleAction,
    undoLastPass,
  } = useDailyProfiles();

  const [matchedUid, setMatchedUid] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear undo chip when it's no longer possible to undo
  useEffect(() => {
    if (!lastPassed && undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
      setShowUndo(false);
    }
  }, [lastPassed]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  async function onLike() {
    triggerHaptic();
    const result = await handleAction("like");
    if (!result) return;
    if (result.matchedUid) {
      // Delay match modal so the card exit animation can finish first
      setTimeout(() => {
        setMatchedUid(result.matchedUid);
        playBlendSound();
        triggerHaptic();
      }, MATCH_MODAL_DELAY_MS);
    }
  }

  async function onPass() {
    triggerHaptic();
    const result = await handleAction("pass");
    if (!result) return;

    // Show undo chip for 4 seconds
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setShowUndo(true);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      undoTimeoutRef.current = null;
    }, 4000);
  }

  async function onUndoPass() {
    triggerHaptic();
    const success = await undoLastPass();
    if (success) {
      setShowUndo(false);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
    }
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

      {/* Undo pass chip — floats near the action buttons */}
      <AnimatePresence>
        {showUndo && lastPassed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 -translate-x-1/2 z-40"
            style={{ bottom: "calc(max(5rem, env(safe-area-inset-bottom)) + 5rem)" }}
          >
            <button
              onClick={onUndoPass}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink/90 backdrop-blur-md text-cream text-sm font-medium shadow-lg active:scale-[0.98] transition-transform"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Oops — undo
            </button>
          </motion.div>
        )}
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
                onClick={() => {
                  triggerHaptic();
                  setMatchedUid(null);
                }}
                className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors active:scale-[0.98]"
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
