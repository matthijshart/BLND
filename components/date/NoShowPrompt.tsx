"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recordNoShow } from "@/lib/strikes";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types";

/**
 * Post-meet "did they show?" prompt.
 *
 * Shown 2h after the scheduled meet time, as long as the meet's status
 * is still upcoming/chat_open (i.e. neither party has resolved it).
 *
 * A no-show triggers an INSTANT permanent ban on the reported user —
 * per Matthijs's directive. Conservative UX choices:
 * - Requires explicit two-tap confirmation
 * - Clear copy about the consequence
 * - Cancels the meet doc as part of the same write
 *
 * Trust: at <500 users, we trust the report. Once volume scales we'll
 * add cross-confirmation (both parties must agree, or wait 48h for
 * dispute).
 */
const POST_MEET_BUFFER_MS = 2 * 60 * 60 * 1000;

interface Props {
  dateId: string;
  meetTime: Date;
  status: string;
  currentUser: User;
  otherUser: User;
}

export function NoShowPrompt({
  dateId,
  meetTime,
  status,
  currentUser,
  otherUser,
}: Props) {
  const [step, setStep] = useState<"prompt" | "confirm" | "submitting" | "done">("prompt");
  const [error, setError] = useState<string | null>(null);
  // `now` lives in state so the prompt appears automatically once the
  // grace window expires while the page stays open. Re-tick every minute.
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const meetMs = meetTime.getTime();
  const showPrompt =
    now >= meetMs + POST_MEET_BUFFER_MS &&
    (status === "upcoming" || status === "chat_open");

  if (!showPrompt || step === "done") return null;

  async function handleShowed() {
    // Just mark the date as completed. No strike. Pleasant outcome.
    setStep("submitting");
    try {
      await updateDoc(doc(db, "dates", dateId), { status: "completed" });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
      setStep("prompt");
    }
  }

  async function handleNoShow() {
    setStep("submitting");
    setError(null);
    try {
      // Record strike on the other user — auto-bans them
      await recordNoShow(otherUser.uid, dateId, currentUser.uid);
      // Update date doc
      await updateDoc(doc(db, "dates", dateId), { status: "no_show" });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
      setStep("confirm");
    }
  }

  return (
    <div className="mx-4 mb-4">
      <AnimatePresence mode="wait">
        {step === "prompt" && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-wine/10"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-wine mb-2">
              Quick check
            </p>
            <p className="font-display text-lg text-ink">
              Did {otherUser.displayName} show up?
            </p>
            <p className="text-ink-mid text-sm mt-1">
              Only takes a second. Helps us keep BLEND honest.
            </p>

            {error && <p className="text-coral text-xs mt-3">{error}</p>}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 py-3 rounded-full border border-coral/30 text-coral text-sm font-medium hover:bg-coral/5"
              >
                Didn&apos;t show
              </button>
              <button
                onClick={handleShowed}
                className="flex-[2] py-3 rounded-full bg-wine text-cream text-sm font-medium hover:bg-burgundy"
              >
                Yes, we met ☕
              </button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-coral/10 border border-coral/30 rounded-2xl p-5"
          >
            <p className="font-display text-lg text-ink">Are you sure?</p>
            <p className="text-ink-mid text-sm mt-2">
              Reporting <strong>{otherUser.displayName}</strong> as a no-show will permanently ban their account from BLEND. There&apos;s no appeal.
            </p>
            <p className="text-ink-mid text-sm mt-2">
              Only report if they truly didn&apos;t show up without warning.
            </p>

            {error && <p className="text-coral text-xs mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setStep("prompt")}
                className="flex-1 py-3 rounded-full text-gray text-sm"
              >
                Back
              </button>
              <button
                onClick={handleNoShow}
                className="flex-[2] py-3 rounded-full bg-coral text-cream text-sm font-medium"
              >
                Confirm no-show
              </button>
            </div>
          </motion.div>
        )}

        {step === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full border-2 border-wine/20 border-t-wine animate-spin" />
            <p className="text-ink-mid text-sm">Saving…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
