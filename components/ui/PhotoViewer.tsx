"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [showArrows, setShowArrows] = useState(true);

  // Fade out arrows after 2 seconds
  useEffect(() => {
    setShowArrows(true);
    const timer = setTimeout(() => setShowArrows(false), 2000);
    return () => clearTimeout(timer);
  }, [index]);

  const goTo = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= photos.length) return;
      setDirection(newIndex > index ? 1 : -1);
      setIndex(newIndex);
    },
    [index, photos.length]
  );

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    if (info.offset.x < -50 || info.velocity.x < -300) {
      goTo(index + 1);
    } else if (info.offset.x > 50 || info.velocity.x > 300) {
      goTo(index - 1);
    }
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] bg-ink/95 flex flex-col"
      onClick={onClose}
    >
      {/* Close button */}
      <div
        className="flex justify-end px-4 relative z-10"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 400, damping: 35 }, opacity: { duration: 0.15 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="w-full h-full relative"
          >
            <Image
              src={photos[index]}
              alt=""
              fill
              className="object-contain pointer-events-none select-none"
              priority
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Swipe arrows — fade after 2s */}
        {photos.length > 1 && (
          <>
            {index > 0 && (
              <motion.button
                initial={{ opacity: 0.8 }}
                animate={{ opacity: showArrows ? 0.8 : 0 }}
                transition={{ duration: 0.5 }}
                onClick={(e) => { e.stopPropagation(); goTo(index - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center z-10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.button>
            )}
            {index < photos.length - 1 && (
              <motion.button
                initial={{ opacity: 0.8 }}
                animate={{ opacity: showArrows ? 0.8 : 0 }}
                transition={{ duration: 0.5 }}
                onClick={(e) => { e.stopPropagation(); goTo(index + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center z-10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </motion.button>
            )}
          </>
        )}

        {/* Tap zones */}
        {photos.length > 1 && (
          <>
            <button className="absolute left-0 top-0 w-1/4 h-full z-5" onClick={(e) => { e.stopPropagation(); goTo(index - 1); }} />
            <button className="absolute right-0 top-0 w-1/4 h-full z-5" onClick={(e) => { e.stopPropagation(); goTo(index + 1); }} />
          </>
        )}
      </div>

      {/* Counter */}
      {photos.length > 1 && (
        <div className="text-center text-white/50 text-xs font-mono pb-2">
          {index + 1} / {photos.length}
        </div>
      )}

      {/* Progress bars */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 px-6" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/20"
            >
              <div
                className={`h-full bg-white rounded-full transition-all duration-300 ${i <= index ? "w-full" : "w-0"}`}
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Subtle swipe hint arrows for inline photo carousels.
 * Shows briefly then fades out.
 */
export function SwipeHintArrows({ show, canGoLeft, canGoRight, onLeft, onRight }: {
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
          onClick={(e) => { e.stopPropagation(); onLeft(); }}
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
          onClick={(e) => { e.stopPropagation(); onRight(); }}
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
