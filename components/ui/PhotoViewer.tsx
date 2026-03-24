"use client";

import { useState, useCallback } from "react";
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

  const goTo = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= photos.length) return;
      setDirection(newIndex > index ? 1 : -1);
      setIndex(newIndex);
    },
    [index, photos.length]
  );

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    // Horizontal swipe — next/prev photo
    if (info.offset.x < -50 || info.velocity.x < -300) {
      goTo(index + 1);
    } else if (info.offset.x > 50 || info.velocity.x > 300) {
      goTo(index - 1);
    }
    // Vertical swipe down — close
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
        className="flex justify-end px-4"
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
      <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {/* Progress bars */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 px-6 pb-8" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
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
