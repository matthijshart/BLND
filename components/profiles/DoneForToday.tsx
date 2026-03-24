"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

function getTimeUntil11() {
  const now = new Date();
  const tomorrow11 = new Date(now);
  tomorrow11.setDate(tomorrow11.getDate() + 1);
  tomorrow11.setHours(11, 0, 0, 0);

  // If it's before 11:00 today, count down to today at 11:00
  const today11 = new Date(now);
  today11.setHours(11, 0, 0, 0);
  if (now < today11) {
    const diff = today11.getTime() - now.getTime();
    return diff;
  }

  // Otherwise count down to tomorrow 11:00
  const diff = tomorrow11.getTime() - now.getTime();
  return diff;
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

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntil11());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = formatCountdown(timeLeft);

  return (
    <div className="px-4 pt-8">
      {/* Mood image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
        <Image
          src="/images/coffe couple.jpeg"
          alt="Coffee date vibes"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6">
          <h2 className="text-3xl font-display text-white">
            That&apos;s a wrap.
          </h2>
          <p className="text-white/70 text-sm mt-2 max-w-[260px] leading-relaxed">
            You&apos;ve seen today&apos;s profiles. New ones drop tomorrow.
          </p>
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
