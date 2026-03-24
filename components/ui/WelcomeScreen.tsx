"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const WELCOME_KEY = "blend_welcomed";

export function WelcomeScreen() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show once per user
    if (!localStorage.getItem(WELCOME_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(WELCOME_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-wine"
      >
        {/* Step 0: Hero */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col"
          >
            {/* Background image */}
            <div className="absolute inset-0">
              <Image
                src="/images/coffe couple.jpeg"
                alt="Coffee date"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine via-wine/80 to-wine/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-16" style={{ paddingBottom: "max(4rem, env(safe-area-inset-bottom))" }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h1 className="text-5xl font-display text-cream leading-tight">
                  Welcome to<br />BLEND.
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-cream/60 text-lg mt-4 max-w-xs leading-relaxed"
              >
                No endless swiping. No awkward texting. Just coffee, at a spot we pick for you.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                onClick={() => setStep(1)}
                className="mt-8 w-full py-4 rounded-full bg-cream text-wine font-medium text-lg"
              >
                Tell me more
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 1: How it works */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col justify-center px-8"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-cream/40 text-xs font-mono uppercase tracking-[0.3em] mb-8"
            >
              How it works
            </motion.p>

            <div className="space-y-6">
              {[
                { num: "01", text: "Every day at 11:00, you get a fresh set of profiles." },
                { num: "02", text: "Like someone? If they like you back — it's a blend." },
                { num: "03", text: "We pick the spot. You both show up. 60 minutes." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.2 }}
                  className="flex gap-4"
                >
                  <span className="text-cream/30 font-mono text-sm mt-0.5">{item.num}</span>
                  <p className="text-cream text-lg leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-12"
            >
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Vibe set */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col justify-center items-center px-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mb-8"
            >
              {/* Two blending circles — the logo */}
              <svg width="80" height="60" viewBox="0 0 80 60">
                <circle cx="28" cy="30" r="24" fill="#f0ebe3" opacity="0.3" />
                <circle cx="52" cy="30" r="24" fill="#f0ebe3" opacity="0.3" />
                <clipPath id="wc">
                  <circle cx="52" cy="30" r="24" />
                </clipPath>
                <circle cx="28" cy="30" r="24" fill="#f0ebe3" opacity="0.25" clipPath="url(#wc)" />
              </svg>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-display text-cream"
            >
              Less swiping.<br />More sipping.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-cream/50 mt-4 text-sm"
            >
              Your first profiles drop at 11:00.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              onClick={dismiss}
              className="mt-10 w-full py-4 rounded-full bg-cream text-wine font-medium text-lg"
            >
              Let&apos;s go ☕
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
