"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate if scrolled to top
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Resistance effect — gets harder to pull the further you go
      const distance = Math.min(diff * 0.4, 120);
      setPullDistance(distance);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);

      // Reload after a short delay for visual feedback
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="flex justify-center overflow-hidden transition-[height] duration-100"
        style={{ height: pullDistance > 5 ? pullDistance : 0 }}
      >
        <div className="flex items-center justify-center py-2">
          {refreshing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border-[2.5px] border-wine/20 border-t-wine"
            />
          ) : (
            <div className="relative w-8 h-8">
              {/* Background circle */}
              <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="#722F3720"
                  strokeWidth="2.5"
                />
              </svg>
              {/* Progress circle */}
              <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="#722F37"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 81.7} 81.7`}
                />
              </svg>
              {/* Center dot when full */}
              {progress >= 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-wine" />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
