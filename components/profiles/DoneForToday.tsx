"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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

export function DoneForToday() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntil11());
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntil11());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDESHOW_PHOTOS.length);
    }, 4000);
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

        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent z-10" />
        <div className="absolute bottom-0 inset-x-0 p-6 z-10">
          <h2 className="text-3xl font-display text-white">
            That&apos;s a wrap.
          </h2>
          <p className="text-white/70 text-sm mt-2 max-w-[260px] leading-relaxed">
            You&apos;ve seen today&apos;s profiles. New ones drop tomorrow.
          </p>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-2 right-4 flex gap-1 z-20">
          {SLIDESHOW_PHOTOS.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-colors duration-500 ${
                i === slideIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Countdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray text-center mb-4">
          Next drop
        </p>
        <div className="flex justify-center items-center gap-3">
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
          Tomorrow at 11:00 — be there.
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
