"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { CoffeeRing } from "@/components/ui/CoffeeRing";

const SLIDESHOW_PHOTOS = [
  "/images/coffe couple.jpeg",
  "/images/date.jpeg",
  "/images/Surf coffee.jpeg",
  "/images/Italian spot.jpeg",
  "/images/koffi3.jpeg",
  "/images/hip.jpeg",
  "/images/boekjelezen.jpeg",
  "/images/datemen2.jpeg",
  "/images/chess terrace.jpeg",
  "/images/bike.jpeg",
];

function getTimeUntil11() {
  const now = new Date();
  const tomorrow11 = new Date(now);
  tomorrow11.setDate(tomorrow11.getDate() + 1);
  tomorrow11.setHours(11, 0, 0, 0);

  const today11 = new Date(now);
  today11.setHours(11, 0, 0, 0);
  if (now < today11) {
    return today11.getTime() - now.getTime();
  }
  return tomorrow11.getTime() - now.getTime();
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
}

// Keep slideshow position across re-mounts
let globalSlideIndex = 0;

export function DoneForToday() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntil11());
  const [slideIndex, setSlideIndex] = useState(globalSlideIndex);
  // Before today's 11:00 drop, the copy is "brewing" — the user hasn't
  // seen anything yet, so "that's a wrap" would be a lie.
  const [beforeDrop, setBeforeDrop] = useState(() => new Date().getHours() < 11);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntil11());
      setBeforeDrop(new Date().getHours() < 11);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // The drop moment: if the user is sitting on this screen when the
  // countdown hits zero, fetch the fresh batch instead of leaving them
  // staring at 00:00:00.
  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 1500) {
      const t = setTimeout(() => window.location.reload(), 1600);
      return () => clearTimeout(t);
    }
  }, [timeLeft]);

  // Auto-advance slideshow every 4 seconds — persists across re-mounts
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % SLIDESHOW_PHOTOS.length;
        globalSlideIndex = next;
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = formatCountdown(timeLeft);

  return (
    <div className="px-4 pt-8">
      {/* Slideshow hero */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDESHOW_PHOTOS[slideIndex]}
              alt="BLEND vibes"
              fill
              className="object-cover"
              priority={slideIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Stronger gradient + plate so headline always reads — Rick: contrast fix */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/15 z-10" />
        <div className="absolute bottom-0 inset-x-0 z-10 px-6 pb-7 pt-12 bg-gradient-to-t from-ink/95 via-ink/65 to-transparent">
          <h2
            className="text-3xl font-display text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
          >
            {beforeDrop ? "Today's drop is brewing." : "That's a wrap."}
          </h2>
          <p
            className="text-white/90 text-sm mt-2 max-w-[280px] leading-relaxed"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}
          >
            {beforeDrop
              ? "Fresh profiles at 11:00 — grab a coffee first."
              : "You've seen today's profiles. New ones drop tomorrow."}
          </p>
        </div>

      </div>

      {/* Countdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 relative overflow-hidden">
        <CoffeeRing variant="ring" className="-bottom-8 -right-6 w-28 h-28" opacity={0.05} rotate={-18} />
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray text-center mb-4 relative z-10">
          Next drop
        </p>
        <div className="flex justify-center items-center gap-3 relative z-10">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-display text-ink tabular-nums">{hours}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-light mt-1">hrs</span>
          </div>
          <span className="text-2xl font-display text-wine -mt-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-display text-ink tabular-nums">{minutes}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-light mt-1">min</span>
          </div>
          <span className="text-2xl font-display text-wine -mt-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-display text-ink tabular-nums">{seconds}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-light mt-1">sec</span>
          </div>
        </div>
        <p className="text-gray text-xs text-center mt-4">
          {beforeDrop ? "Today at 11:00 — be there." : "Tomorrow at 11:00 — be there."}
        </p>
      </div>

      <Link
        href="/matches"
        className="block text-center w-full py-4 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors"
      >
        Check blends
      </Link>

      <p className="text-gray-light text-xs mt-6 font-mono tracking-wide text-center">
        Less swiping. More sipping.
      </p>
    </div>
  );
}
