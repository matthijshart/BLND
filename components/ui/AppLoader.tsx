"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AppLoaderProps {
  /** First name to greet with, once known. Pass undefined while loading. */
  firstName?: string;
  /**
   * Minimum time the greeting screen stays visible after `firstName` arrives,
   * so the user sees their name even on fast networks. Default 1100ms.
   */
  greetingDurationMs?: number;
  /** Called when the loader is ready to fade out. */
  onComplete?: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Welcome back";
  return "Good evening";
}

/**
 * BLEND app loader — the "first impression" surface every time you open
 * the app. Two phases:
 *
 *   1. Breathing logo + wordmark while auth + profile are resolving.
 *      Two cream-on-wine overlapping circles drift toward and away from
 *      each other, "blending" — the literal logo metaphor in motion.
 *
 *   2. Once we know who you are, we transition to a personal greeting:
 *      "Good morning, Matthijs ☕" with a soft fade.
 *
 * Held on screen for at least `greetingDurationMs` after the name is
 * known so users always get the moment of recognition — even on a fast
 * connection. After that, calls `onComplete` so the parent can dismount.
 */
export function AppLoader({
  firstName,
  greetingDurationMs = 1100,
  onComplete,
}: AppLoaderProps) {
  const [phase, setPhase] = useState<"logo" | "greeting" | "done">(
    firstName ? "greeting" : "logo"
  );

  // When firstName arrives, advance to greeting. The new strict React
  // rule flags effect→setState as a code smell, but this is the legit
  // "sync external prop change → internal phase" pattern.
  useEffect(() => {
    if (firstName && phase === "logo") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("greeting");
    }
  }, [firstName, phase]);

  // After greeting has been visible long enough, mark done
  useEffect(() => {
    if (phase !== "greeting") return;
    const t = setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, greetingDurationMs);
    return () => clearTimeout(t);
  }, [phase, greetingDurationMs, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[300] bg-wine flex flex-col items-center justify-center px-6"
          style={{ height: "100dvh" }}
        >
          {/* Phase 1 — breathing logo */}
          {phase === "logo" && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <BreathingLogo />
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
                className="text-cream text-4xl font-display tracking-wide mt-6"
              >
                BLEND
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-cream/50 text-[10px] font-mono uppercase tracking-[0.35em] mt-3"
              >
                brewing your morning
              </motion.p>
            </motion.div>
          )}

          {/* Phase 2 — personal greeting */}
          {phase === "greeting" && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Logo stays present but smaller/stiller during greeting */}
              <BreathingLogo small />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-7 text-center"
              >
                <p className="text-cream/55 text-[10px] font-mono uppercase tracking-[0.35em]">
                  {getGreeting()}
                </p>
                <p className="text-cream font-display text-3xl mt-2 leading-tight">
                  {firstName} ☕
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The two-circle BLEND mark, animated.
 *
 * Both circles drift back and forth along the x-axis so they overlap
 * more then less — "blending" continuously. We use cream-on-wine here
 * because the loader background is wine; passing `small` shrinks it
 * for the greeting phase.
 */
function BreathingLogo({ small }: { small?: boolean }) {
  const size = small ? 64 : 110;
  const cy = small ? 30 : 50;
  const r = small ? 22 : 38;
  // Resting circle centers
  const leftRest = size * 0.36;
  const rightRest = size * 0.64;
  // How far they drift toward each other
  const drift = size * 0.07;

  return (
    <svg
      width={size}
      height={cy * 2}
      viewBox={`0 0 ${size} ${cy * 2}`}
      className="overflow-visible"
      aria-hidden
    >
      <motion.circle
        cx={leftRest}
        cy={cy}
        r={r}
        fill="#e8dfd1"
        opacity={0.55}
        animate={{ cx: [leftRest, leftRest + drift, leftRest] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx={rightRest}
        cy={cy}
        r={r}
        fill="#e8dfd1"
        opacity={0.55}
        animate={{ cx: [rightRest, rightRest - drift, rightRest] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
