"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  submitVerification,
  pickRandomPose,
  VERIFICATION_POSES,
  VerificationError,
} from "@/lib/verification";
import { triggerHaptic } from "@/lib/sounds";
import { Portal } from "@/components/ui/Portal";

type Step = "intro" | "pose" | "submitting" | "done" | "error";

export function VerificationFlow({
  uid,
  onClose,
}: {
  uid: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Roll the pose ONCE per flow open — re-rolling on every render would
  // let users keep refreshing until they got the easy one.
  const pose = useMemo(() => pickRandomPose(), []);
  const poseConfig = VERIFICATION_POSES[pose];

  function handleStart() {
    triggerHaptic();
    setStep("pose");
  }

  function handleOpenCamera() {
    fileInputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep("submitting");
    try {
      await submitVerification(uid, file, pose);
      triggerHaptic();
      setStep("done");
    } catch (err) {
      const msg =
        err instanceof VerificationError
          ? err.message
          : "Something went wrong. Try again.";
      setErrorMsg(msg);
      setStep("error");
    }
  }

  return (
    <Portal>
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-cream"
      style={{ height: "100dvh" }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-ink"
        style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full flex flex-col justify-center px-6 max-w-md mx-auto"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine mb-4">
              Photo verification
            </p>
            <h1 className="text-3xl font-display text-ink leading-tight">
              Show us it&apos;s really you.
            </h1>
            <p className="text-ink-mid mt-4 leading-relaxed">
              We&apos;ll ask for one selfie in a specific pose. Once approved,
              your profile gets a blue checkmark — so other people know
              you&apos;re real before they show up for coffee.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-ink-mid">
              {[
                "Takes 30 seconds",
                "Your selfie is private — only the BLEND team reviews it",
                "Reviewed within 24 hours",
              ].map((line, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-1 h-1 rounded-full bg-wine mt-2 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleStart}
              className="mt-10 w-full py-4 rounded-full bg-wine text-cream font-medium"
            >
              Get verified
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full py-3 text-gray text-sm"
            >
              Maybe later
            </button>
          </motion.div>
        )}

        {step === "pose" && (
          <motion.div
            key="pose"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full flex flex-col justify-center px-6 max-w-md mx-auto"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine mb-4">
              Your pose today
            </p>
            <div className="text-7xl mb-6">{poseConfig.emoji}</div>
            <h2 className="text-2xl font-display text-ink leading-tight">
              {poseConfig.instruction}
            </h2>
            <p className="text-ink-mid mt-4 text-sm leading-relaxed">
              Make sure your face is fully visible and well-lit. The pose
              changes every time — keeps things real.
            </p>

            <button
              onClick={handleOpenCamera}
              className="mt-10 w-full py-4 rounded-full bg-wine text-cream font-medium flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Open camera
            </button>
            <button
              onClick={() => setStep("intro")}
              className="mt-3 w-full py-3 text-gray text-sm"
            >
              Back
            </button>
          </motion.div>
        )}

        {step === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center px-6"
          >
            <div className="w-12 h-12 rounded-full border-4 border-wine/20 border-t-wine animate-spin" />
            <p className="text-ink-mid mt-6 text-sm">Uploading your selfie…</p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col justify-center items-center px-6 max-w-md mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="text-6xl mb-6"
            >
              ☕
            </motion.div>
            <h2 className="text-3xl font-display text-ink leading-tight">
              Thanks — we&apos;ve got it.
            </h2>
            <p className="text-ink-mid mt-4 leading-relaxed">
              We&apos;ll review your selfie within 24 hours. You&apos;ll see a
              blue checkmark on your profile once you&apos;re verified.
            </p>
            <button
              onClick={onClose}
              className="mt-10 w-full py-4 rounded-full bg-wine text-cream font-medium"
            >
              Got it
            </button>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col justify-center items-center px-6 max-w-md mx-auto text-center"
          >
            <p className="text-3xl mb-4">😕</p>
            <h2 className="text-2xl font-display text-ink">
              Something went wrong
            </h2>
            <p className="text-ink-mid mt-3 text-sm">{errorMsg}</p>
            <button
              onClick={() => setStep("pose")}
              className="mt-8 w-full py-4 rounded-full bg-wine text-cream font-medium"
            >
              Try again
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full py-3 text-gray text-sm"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </Portal>
  );
}
