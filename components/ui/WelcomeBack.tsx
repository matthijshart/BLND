"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/components/providers/AuthProvider";

const LAST_ACTIVE_KEY = "blend_last_active";
const AWAY_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
const TOAST_DURATION_MS = 2800;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Welkom terug";
  return "Goedenavond";
}

export function WelcomeBack() {
  const { profile } = useAuthContext();
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function checkAndShow() {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    const lastActive = raw ? parseInt(raw, 10) : 0;
    const awayMs = Date.now() - lastActive;

    // Update timestamp immediately so next check uses this open time
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));

    if (lastActive > 0 && awayMs > AWAY_THRESHOLD_MS) {
      setShow(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShow(false);
        timerRef.current = null;
      }, TOAST_DURATION_MS);
    }
  }

  useEffect(() => {
    // Set initial timestamp if not set
    if (!localStorage.getItem(LAST_ACTIVE_KEY)) {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    }

    // Check on visibility restore (PWA homescreen open / tab switch back)
    function onVisible() {
      if (document.visibilityState === "visible") {
        checkAndShow();
      } else {
        // Update last-active when leaving
        localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = profile?.displayName?.split(" ")[0] ?? "";

  return (
    <AnimatePresence>
      {show && firstName && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed top-0 inset-x-0 z-[200] flex justify-center pointer-events-none"
          style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
        >
          <button
            className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-full bg-wine shadow-lg"
            onClick={() => setShow(false)}
          >
            <span className="text-cream font-display text-base leading-none">
              {getGreeting()}, {firstName}
            </span>
            <span className="text-lg leading-none">☕</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
