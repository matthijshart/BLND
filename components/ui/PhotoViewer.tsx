"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import Image from "next/image";
import { Portal } from "@/components/ui/Portal";

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Fullscreen photo viewer — iPhone-bulletproof rewrite.
 *
 * Fixes the bugs Matthijs reported on his own profile photo:
 * - Sized to `100dvh` so iOS Safari URL bar doesn't cut off the bottom
 * - Single drag handler (free 2D) — swipe horizontally to navigate,
 *   swipe down to dismiss. The old code used drag="x" so swipe-down
 *   silently did nothing.
 * - Image uses `object-contain` with `sizes="100vw"` and full-bleed
 *   container so portrait and landscape both fit without crop.
 * - Tap-to-close ONLY when tapping the dark bezel (top/bottom margin),
 *   not the image area. The image area is reserved for drag gestures.
 * - touchAction: 'none' on the swipe surface so iOS doesn't try to
 *   trigger native scroll/back-swipe at the edges.
 * - Larger tap targets (Apple HIG 44pt minimum).
 * - All buttons have e.stopPropagation so they never accidentally
 *   trigger the bezel close.
 */
export function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  // Clamp initialIndex defensively — if a caller passes a stale index, don't crash
  const safeInitial = Math.max(0, Math.min(initialIndex, photos.length - 1));
  const [index, setIndex] = useState(safeInitial);
  const [direction, setDirection] = useState(0);
  const [showArrows, setShowArrows] = useState(true);
  const arrowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock body scroll while viewer is open. Save/restore the exact previous
  // value so we don't trample an already-locked state (e.g. another modal).
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Re-show arrows on every navigation, fade out after 2.5s
  useEffect(() => {
    setShowArrows(true);
    if (arrowTimerRef.current) clearTimeout(arrowTimerRef.current);
    arrowTimerRef.current = setTimeout(() => setShowArrows(false), 2500);
    return () => {
      if (arrowTimerRef.current) clearTimeout(arrowTimerRef.current);
    };
  }, [index]);

  // Hardware-back / Escape close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goTo = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= photos.length) return;
      setDirection(newIndex > index ? 1 : -1);
      setIndex(newIndex);
    },
    [index, photos.length]
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    const SWIPE_X = 60;
    const SWIPE_Y = 120;
    const VEL_X = 350;
    const VEL_Y = 550;

    // Vertical takes priority — swipe down dismisses
    if (info.offset.y > SWIPE_Y || info.velocity.y > VEL_Y) {
      onClose();
      return;
    }
    // Then horizontal navigation
    if (info.offset.x < -SWIPE_X || info.velocity.x < -VEL_X) {
      goTo(index + 1);
    } else if (info.offset.x > SWIPE_X || info.velocity.x > VEL_X) {
      goTo(index - 1);
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <Portal>
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      // h-dvh = the iOS dynamic viewport — guarantees the bottom isn't
      // cut off when the URL bar collapses
      className="fixed inset-0 z-[200] bg-ink flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* Top bar — close button only */}
      <div
        className="relative z-30 flex justify-end px-4 pb-2"
        style={{ paddingTop: "max(0.75rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Photo surface — drag here. Bezel taps (the dark margin around
          the image) close the viewer because it bubbles up to root. */}
      <div
        className="flex-1 relative overflow-hidden"
        onClick={(e) => {
          // Only close on direct bezel taps, not on drag end / image taps
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ touchAction: "none" }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 400, damping: 36 },
              opacity: { duration: 0.15 },
            }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.25}
            dragDirectionLock={false}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Image stays inside the motion div, object-contain preserves AR */}
            <div className="relative w-full h-full">
              <Image
                src={photos[index]}
                alt=""
                fill
                className="object-contain pointer-events-none select-none"
                priority
                draggable={false}
                sizes="100vw"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Side arrows — visible briefly on photo change, also auto-fade */}
        {photos.length > 1 && (
          <>
            {index > 0 && (
              <motion.button
                initial={{ opacity: 0.85 }}
                animate={{ opacity: showArrows ? 0.85 : 0 }}
                transition={{ duration: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(index - 1);
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center z-20 active:scale-95 transition-transform"
                style={{ touchAction: "manipulation" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.button>
            )}
            {index < photos.length - 1 && (
              <motion.button
                initial={{ opacity: 0.85 }}
                animate={{ opacity: showArrows ? 0.85 : 0 }}
                transition={{ duration: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(index + 1);
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center z-20 active:scale-95 transition-transform"
                style={{ touchAction: "manipulation" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Footer: counter + progress dots */}
      <div
        className="relative z-30 px-6 pt-2"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {photos.length > 1 ? (
          <>
            <p className="text-center text-white/55 text-[11px] font-mono mb-2 tabular-nums">
              {index + 1} / {photos.length}
            </p>
            <div className="flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 active:bg-white/30 transition-colors"
                  aria-label={`Go to photo ${i + 1}`}
                >
                  <div
                    className={`h-full bg-white rounded-full transition-all duration-300 ${
                      i === index ? "w-full" : i < index ? "w-full opacity-60" : "w-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          // Hint to dismiss when there's only one photo
          <p className="text-center text-white/40 text-[10px] font-mono">Swipe down to close</p>
        )}
      </div>
    </motion.div>
    </Portal>
  );
}

/**
 * Subtle swipe hint arrows for inline photo carousels.
 * Shows briefly then fades out.
 */
export function SwipeHintArrows({
  show,
  canGoLeft,
  canGoRight,
  onLeft,
  onRight,
}: {
  show: boolean;
  canGoLeft: boolean;
  canGoRight: boolean;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <>
      {canGoLeft && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 0.7 : 0 }}
          transition={{ duration: 0.4 }}
          onClick={(e) => {
            e.stopPropagation();
            onLeft();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink/20 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>
      )}
      {canGoRight && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 0.7 : 0 }}
          transition={{ duration: 0.4 }}
          onClick={(e) => {
            e.stopPropagation();
            onRight();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink/20 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </motion.button>
      )}
    </>
  );
}
