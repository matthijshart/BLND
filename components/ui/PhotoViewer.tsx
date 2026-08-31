"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, animate, useMotionValue, type PanInfo } from "framer-motion";
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
  // Width of one page. The track is positioned in px, not percentages, so
  // the drag offset and the rest position are in the same unit and the
  // photo can track the finger exactly.
  const [pageWidth, setPageWidth] = useState(0);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
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

  // Measure the photo surface and keep it current through rotation and the
  // iOS URL bar collapsing.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const measure = () => setPageWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Settle the track on the current page whenever the index or the width
  // changes. This is the only thing that moves the track other than a drag.
  useEffect(() => {
    if (!pageWidth) return;
    const controls = animate(x, -index * pageWidth, {
      type: "spring",
      stiffness: 320,
      damping: 34,
      restDelta: 0.5,
    });
    return () => controls.stop();
  }, [index, pageWidth, x]);

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
      setIndex(newIndex);
    },
    [photos.length]
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    // Swipe down to dismiss. dragDirectionLock means a gesture is either
    // vertical or horizontal, never both, so this no longer competes with
    // paging the way the old free-2D drag did.
    if (info.offset.y > 120 || info.velocity.y > 550) {
      onClose();
      return;
    }

    // Page on distance OR flick speed. A fast flick should advance even if
    // the finger barely travelled — that is what makes it feel responsive.
    const w = pageWidth || 1;
    const travelled = -info.offset.x / w;
    const flick = Math.abs(info.velocity.x) > 400 ? Math.sign(-info.velocity.x) : 0;
    const step = Math.abs(travelled) > 0.28 ? Math.sign(travelled) : flick;

    const next = Math.max(0, Math.min(photos.length - 1, index + step));
    if (next !== index) {
      setIndex(next);
    } else {
      // Snap back to the current page — the effect above only reacts to an
      // index change, so a cancelled swipe needs its own settle.
      animate(x, -index * w, { type: "spring", stiffness: 320, damping: 34 });
    }
  }

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
        ref={surfaceRef}
        className="flex-1 relative overflow-hidden"
        onClick={(e) => {
          // Only close on direct bezel taps, not on drag end / image taps
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ touchAction: "none" }}
      >
        {/* One continuous track holding every photo, dragged in px.
            The previous version mounted a single photo and cross-faded it,
            so during a swipe there was nothing beside the image to follow
            your finger — it read as a slide transition rather than a
            carousel. Now the neighbouring photos are really there, moving
            with the gesture, and the constraints give you the iOS
            rubber-band at the first and last photo. */}
        {pageWidth > 0 && (
          <motion.div
            className="absolute inset-0 flex"
            style={{ x, width: photos.length * pageWidth }}
            drag
            dragDirectionLock
            dragConstraints={{
              left: -(photos.length - 1) * pageWidth,
              right: 0,
              top: 0,
              bottom: 0,
            }}
            dragElastic={{ left: 0.12, right: 0.12, top: 0.5, bottom: 0.5 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
          >
            {photos.map((src, i) => (
              <div
                key={src + i}
                className="relative h-full shrink-0"
                style={{ width: pageWidth }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-contain pointer-events-none select-none"
                  priority={i === safeInitial}
                  draggable={false}
                  sizes="100vw"
                />
              </div>
            ))}
          </motion.div>
        )}

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
