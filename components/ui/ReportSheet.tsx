"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { blockUser, reportUser, REPORT_REASONS } from "@/lib/safety";
import type { ReportReason } from "@/types";

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  targetUid: string;
  targetName: string;
  context: "today" | "blend" | "meet" | "chat" | "profile";
  /** Called after user successfully blocked/reported so parent can navigate away. */
  onBlocked?: () => void;
}

export function ReportSheet({ open, onClose, targetUid, targetName, context, onBlocked }: ReportSheetProps) {
  const { firebaseUser } = useAuthContext();
  const [mode, setMode] = useState<"menu" | "report" | "block" | "done">("menu");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setMode("menu");
    setReason(null);
    setNotes("");
    setError(null);
    onClose();
  }

  async function handleBlock() {
    if (!firebaseUser || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await blockUser(firebaseUser.uid, targetUid);
      setMode("done");
      onBlocked?.();
    } catch (err) {
      console.error("Block error:", err);
      setError("Couldn't block. Try again.");
    }
    setSubmitting(false);
  }

  async function handleSubmitReport() {
    if (!firebaseUser || !reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportUser(firebaseUser.uid, targetUid, reason, context, notes.trim() || undefined);
      setMode("done");
      onBlocked?.();
    } catch (err) {
      console.error("Report error:", err);
      setError("Couldn't submit. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[150] bg-ink/60 backdrop-blur-sm flex items-end justify-center"
          onClick={close}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) close();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-cream rounded-t-3xl shadow-2xl"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-ink/15" />
            </div>

            <div className="px-6 py-4">
              {/* ─── MENU ─── */}
              {mode === "menu" && (
                <>
                  <h3 className="font-display text-xl text-ink">
                    {targetName}
                  </h3>
                  <p className="text-gray text-sm mt-1">
                    What would you like to do?
                  </p>

                  <div className="mt-5 space-y-2">
                    <button
                      onClick={() => setMode("report")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white text-ink active:scale-[0.99] transition-transform"
                    >
                      <span className="w-9 h-9 rounded-full bg-coral/10 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-ink font-medium text-sm">Report {targetName}</p>
                        <p className="text-gray text-xs">We review every report. They won&apos;t know it was you.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setMode("block")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white text-ink active:scale-[0.99] transition-transform"
                    >
                      <span className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-ink font-medium text-sm">Block {targetName}</p>
                        <p className="text-gray text-xs">You won&apos;t see each other again.</p>
                      </div>
                    </button>

                    <button
                      onClick={close}
                      className="w-full py-3 text-gray text-sm mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* ─── REPORT ─── */}
              {mode === "report" && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setMode("menu")} className="text-gray text-sm">← Back</button>
                  </div>
                  <h3 className="font-display text-xl text-ink">Report {targetName}</h3>
                  <p className="text-gray text-sm mt-1">What&apos;s going on?</p>

                  <div className="mt-5 space-y-2">
                    {(Object.keys(REPORT_REASONS) as ReportReason[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                          reason === r
                            ? "bg-wine text-cream font-medium"
                            : "bg-white text-ink active:scale-[0.99]"
                        }`}
                      >
                        {REPORT_REASONS[r]}
                      </button>
                    ))}
                  </div>

                  {reason === "other" && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      placeholder="Tell us what happened..."
                      rows={3}
                      className="w-full mt-3 px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light text-sm focus:outline-none focus:ring-1 focus:ring-wine/20 resize-none"
                    />
                  )}

                  {error && (
                    <p className="text-coral text-sm mt-3">{error}</p>
                  )}

                  <button
                    onClick={handleSubmitReport}
                    disabled={!reason || submitting}
                    className="w-full mt-5 py-4 rounded-full bg-coral text-white font-medium text-lg disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    {submitting && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    {submitting ? "Submitting..." : "Submit report"}
                  </button>
                  <p className="text-gray-light text-[10px] text-center mt-2">
                    Reporting also blocks this person.
                  </p>
                </>
              )}

              {/* ─── BLOCK confirmation ─── */}
              {mode === "block" && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setMode("menu")} className="text-gray text-sm">← Back</button>
                  </div>
                  <h3 className="font-display text-xl text-ink">Block {targetName}?</h3>
                  <p className="text-ink-mid text-sm mt-2 leading-relaxed">
                    You won&apos;t see each other on BLEND anymore. Any active blends or meets between you will be cancelled.
                  </p>
                  <p className="text-gray text-xs mt-2">
                    You can unblock them later from your profile settings.
                  </p>

                  {error && (
                    <p className="text-coral text-sm mt-3">{error}</p>
                  )}

                  <button
                    onClick={handleBlock}
                    disabled={submitting}
                    className="w-full mt-5 py-4 rounded-full bg-ink text-cream font-medium text-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    {submitting && <span className="w-4 h-4 rounded-full border-2 border-cream border-t-transparent animate-spin" />}
                    {submitting ? "Blocking..." : `Yes, block ${targetName}`}
                  </button>
                  <button
                    onClick={() => setMode("menu")}
                    className="w-full py-3 text-gray text-sm mt-2"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* ─── DONE ─── */}
              {mode === "done" && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-wine/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-wine">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl text-ink">Done.</h3>
                  <p className="text-gray text-sm mt-2">
                    You won&apos;t see {targetName} again. Thanks for helping keep BLEND safe.
                  </p>
                  <button
                    onClick={close}
                    className="w-full mt-5 py-4 rounded-full bg-wine text-cream font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
