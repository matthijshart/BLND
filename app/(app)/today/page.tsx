"use client";

import { useDailyProfiles } from "@/hooks/useDailyProfiles";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { DoneForToday } from "@/components/profiles/DoneForToday";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoffeeBeans } from "@/components/ui/CoffeeBeans";
import { CoffeeRing } from "@/components/ui/CoffeeRing";
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
        <div className="flex items-center justify-between mb-2">
          <div className="h-8 w-20 bg-stripe-white rounded-full animate-pulse" />
          <div className="h-3 w-12 bg-stripe-white rounded-full animate-pulse" />
        </div>
        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7,8,9,10].map((i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-stripe-white" />
          ))}
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
    <div className="px-4 pt-8 max-w-sm mx-auto relative">
      {/* Decorative coffee stain — signature BLEND detail */}
      <CoffeeRing variant="drip" className="-top-4 -right-2 w-20 h-20" opacity={0.06} rotate={12} />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <h1 className="text-2xl font-display text-ink">Today</h1>
        <span className="text-gray-light text-[10px] font-mono uppercase tracking-[0.2em]">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Visual progression — compact dots */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-[3px] rounded-full transition-colors duration-500 ${
              i < currentIndex ? "bg-wine" : i === currentIndex ? "bg-wine/60" : "bg-stripe-white"
            }`}
          />
        ))}
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
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) {
                setMatchedUid(null);
              }
            }}
            className="fixed inset-0 z-50 bg-wine flex flex-col items-center justify-center px-6"
          >
            {/* Drag indicator at top */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-cream/30 pointer-events-none" style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }} />
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
