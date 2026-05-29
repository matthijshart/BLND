"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CANCELLATION_REASONS,
  classifyCancellationTiming,
  recordCancellation,
  getStrikeStatus,
  STRIKE_THRESHOLDS,
  STRIKE_WINDOW_DAYS,
} from "@/lib/strikes";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Portal } from "@/components/ui/Portal";
import type { User } from "@/types";
import type { Timestamp } from "firebase/firestore";

type Step = "reason" | "confirm" | "submitting" | "banned";

interface Props {
  open: boolean;
  onClose: () => void;
  onCancelled: (banned: boolean) => void;
  dateId: string;
  meetTime: Date | Timestamp;
  currentUser: User;
}

/**
 * Two-step cancel flow per Matthijs:
 * 1. Pick a reason (required) — also auto-detects timing
 * 2. Confirm — with a clear strike-count warning. If this strike will
 *    trigger a ban, the confirm button goes red and uses harsher copy.
 *
 * Reasons aren't filtered ("good" vs "bad") — we count ALL cancellations
 * because we can't verify reasons. Transparency comes from showing the
 * strike count, not from selectively ignoring strikes.
 */
export function CancelMeetModal({
  open,
  onClose,
  onCancelled,
  dateId,
  meetTime,
  currentUser,
}: Props) {
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Timing is fixed at modal-open — recomputing on each render would
  // create a race condition (could flip from "close" to "last_minute"
  // mid-confirm). Useful for tests too.
  const timing = useMemo(() => classifyCancellationTiming(meetTime), [meetTime]);

  const status = useMemo(() => getStrikeStatus(currentUser), [currentUser]);

  // Will this cancellation push them over the line?
  const wouldBan =
    (timing === "last_minute" && status.lastMinute + 1 >= STRIKE_THRESHOLDS.last_minute) ||
    (timing === "close" && status.close + 1 >= STRIKE_THRESHOLDS.close);

  async function handleConfirm() {
    if (!reason || !currentUser.uid) return;
    setStep("submitting");
    setError(null);
    try {
      // 1. Update the date doc to cancelled
      await updateDoc(doc(db, "dates", dateId), { status: "cancelled" });
      // 2. Record the strike + potentially auto-ban
      const result = await recordCancellation(currentUser.uid, dateId, reason, timing);
      if (result.banned) {
        setStep("banned");
      } else {
        onCancelled(false);
        onClose();
        setStep("reason");
        setReason("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't cancel — try again.");
      setStep("confirm");
    }
  }

  if (!open) return null;

  // Timing copy — used in confirmation step
  const timingCopy =
    timing === "last_minute"
      ? "Less than 2 hours before your meet — this is a heavy strike."
      : timing === "close"
      ? "Less than 24 hours before your meet — this counts as a strike."
      : "More than 24 hours before your meet — a light strike, no immediate ban risk.";

  const currentCount =
    timing === "last_minute" ? status.lastMinute : timing === "close" ? status.close : status.far;
  const threshold =
    timing === "last_minute"
      ? STRIKE_THRESHOLDS.last_minute
      : timing === "close"
      ? STRIKE_THRESHOLDS.close
      : STRIKE_THRESHOLDS.far;

  return (
    <Portal>
      <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget && step !== "submitting") onClose();
        }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          // Swipe-down to dismiss (same UX as QuickPromptEdit)
          drag={step === "submitting" ? false : "y"}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          dragDirectionLock
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl px-6 pt-6 max-h-[90dvh] overflow-y-auto"
          style={{
            paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))",
            touchAction: "pan-y",
          }}
        >
          {/* Step 1 — reason */}
          {step === "reason" && (
            <>
              <div className="w-12 h-1 rounded-full bg-ink/15 mx-auto mb-4" />
              <h2 className="font-display text-2xl text-ink">Cancel your meet</h2>
              <p className="text-ink-mid text-sm mt-1">
                We get it — life happens. Pick the reason that fits best.
              </p>

              <div className="mt-5 space-y-2">
                {CANCELLATION_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                      reason === r.value
                        ? "bg-wine text-cream border-wine"
                        : "bg-white text-ink border-transparent hover:border-wine/20"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-full text-gray text-sm"
                >
                  Keep the meet
                </button>
                <button
                  disabled={!reason}
                  onClick={() => setStep("confirm")}
                  className="flex-[2] py-3 rounded-full bg-ink text-cream text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 2 — confirm + strike preview */}
          {step === "confirm" && (
            <>
              <div className="w-12 h-1 rounded-full bg-ink/15 mx-auto mb-4" />
              <h2 className="font-display text-2xl text-ink">
                {wouldBan ? "This will ban your account" : "Before you cancel…"}
              </h2>

              {/* Strike-count info card */}
              <div
                className={`mt-4 p-4 rounded-2xl border ${
                  wouldBan
                    ? "bg-coral/10 border-coral/30"
                    : timing === "far"
                    ? "bg-stripe-white border-ink/10"
                    : "bg-wine/8 border-wine/20"
                }`}
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-mid mb-1.5">
                  Timing
                </p>
                <p className="text-ink text-sm leading-relaxed">{timingCopy}</p>

                {timing !== "far" && (
                  <>
                    <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-mid mt-4 mb-1.5">
                      Your record (last {STRIKE_WINDOW_DAYS} days)
                    </p>
                    <p className="text-ink text-sm">
                      <span className="font-medium">{currentCount + 1} of {threshold}</span> {timing.replace("_", "-")} cancellations.
                      {wouldBan ? (
                        <span className="block mt-1 text-coral font-medium">
                          One more = permanent ban.
                        </span>
                      ) : (
                        <span className="block mt-1 text-gray">
                          {threshold - currentCount - 1} left before your account is banned.
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-3 p-3 rounded-xl bg-coral/10 text-coral text-sm">{error}</div>
              )}

              <div className="mt-6 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-full text-gray text-sm"
                >
                  Never mind
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-[2] py-3 rounded-full text-cream text-sm font-medium ${
                    wouldBan ? "bg-coral" : "bg-wine"
                  }`}
                >
                  {wouldBan ? "Cancel and end my account" : "Yes, cancel"}
                </button>
              </div>
            </>
          )}

          {/* Submitting */}
          {step === "submitting" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-wine/20 border-t-wine animate-spin" />
              <p className="text-ink-mid text-sm">Cancelling your meet…</p>
            </div>
          )}

          {/* Banned outcome */}
          {step === "banned" && (
            <div className="py-6 text-center">
              <p className="text-4xl mb-3">🚫</p>
              <h2 className="font-display text-2xl text-ink">Account suspended</h2>
              <p className="text-ink-mid text-sm mt-2 max-w-xs mx-auto">
                You&apos;ve reached the cancellation limit. BLEND is built on showing up — your account is now permanently banned.
              </p>
              <button
                onClick={() => {
                  onCancelled(true);
                  onClose();
                }}
                className="mt-6 w-full py-3 rounded-full bg-ink text-cream text-sm font-medium"
              >
                Got it
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
