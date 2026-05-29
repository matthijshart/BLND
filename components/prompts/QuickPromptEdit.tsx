"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROFILE_PROMPTS, type ProfilePromptConfig } from "@/lib/prompts";
import { Portal } from "@/components/ui/Portal";

/**
 * Quick-edit a single prompt from the profile view.
 *
 * Two-step bottom sheet:
 * 1. Pick a question — current one is preselected, all others available
 * 2. Answer it (open text OR choose between two options)
 *
 * Designed for the "tap → swap → save" flow Matthijs asked for. The full
 * PromptPicker in edit mode stays for the initial 3-prompt set-up; this
 * modal is for when you already have prompts and want to tweak one.
 */
interface Props {
  open: boolean;
  /** The prompt the user tapped on. If `null`, this is "add a new prompt". */
  current: { question: string; answer: string } | null;
  /** All prompts the user has so we don't let them pick a duplicate. */
  allPrompts: { question: string; answer: string }[];
  onSave: (next: { question: string; answer: string }) => Promise<void>;
  onClose: () => void;
}

type Step = "pick" | "answer" | "saving";

export function QuickPromptEdit({ open, current, allPrompts, onSave, onClose }: Props) {
  const initialPrompt = current
    ? PROFILE_PROMPTS.find((p) => p.question === current.question) ?? null
    : null;
  const [step, setStep] = useState<Step>(current ? "answer" : "pick");
  const [picked, setPicked] = useState<ProfilePromptConfig | null>(initialPrompt);
  const [openAnswer, setOpenAnswer] = useState(
    current?.answer && initialPrompt?.type === "open" ? current.answer : ""
  );
  const [choice, setChoice] = useState<string>(
    current?.answer && initialPrompt?.type === "choice"
      ? current.answer.split(" — ")[0]
      : ""
  );
  const [comment, setComment] = useState<string>(
    current?.answer && initialPrompt?.type === "choice"
      ? current.answer.split(" — ")[1] || ""
      : ""
  );

  // UIDs already in use by OTHER prompts — we don't let user pick those
  // (would create a duplicate). The user's CURRENT prompt stays selectable.
  const blockedQuestions = new Set(
    allPrompts
      .filter((p) => p.question !== current?.question)
      .map((p) => p.question)
  );

  function reset() {
    setStep(current ? "answer" : "pick");
    setPicked(initialPrompt);
    setOpenAnswer(current?.answer && initialPrompt?.type === "open" ? current.answer : "");
    setChoice(
      current?.answer && initialPrompt?.type === "choice"
        ? current.answer.split(" — ")[0]
        : ""
    );
    setComment(
      current?.answer && initialPrompt?.type === "choice"
        ? current.answer.split(" — ")[1] || ""
        : ""
    );
  }

  function handleClose() {
    onClose();
    // Reset on next open
    setTimeout(reset, 200);
  }

  function pickQuestion(p: ProfilePromptConfig) {
    setPicked(p);
    // If switching question type, clear previous answer fields
    if (p.type === "open") {
      setChoice("");
      setComment("");
    } else {
      setOpenAnswer("");
    }
    setStep("answer");
  }

  async function handleSave() {
    if (!picked) return;
    let answer = "";
    if (picked.type === "open") {
      answer = openAnswer.trim();
      if (!answer) return;
    } else {
      if (!choice) return;
      answer = comment.trim() ? `${choice} — ${comment.trim()}` : choice;
    }
    setStep("saving");
    try {
      await onSave({ question: picked.question, answer });
      handleClose();
    } catch {
      setStep("answer");
    }
  }

  if (!open) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && step !== "saving") handleClose();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            // Drag lives on the OUTER container only. Without this split,
            // the native scroll of overflow-y-auto would swallow the touch
            // event before Framer Motion's drag handler ever saw it on iOS.
            drag={step === "saving" ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragDirectionLock
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) {
                handleClose();
              }
            }}
            className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90dvh]"
          >
            {/* Drag handle area — large, dedicated, captures the swipe.
                touchAction "none" here ensures the gesture goes to Framer,
                not to any potential parent scroll. */}
            <div
              className="pt-3 pb-2 px-6 flex-none cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
            >
              <div className="w-12 h-1.5 rounded-full bg-ink/25 mx-auto" />
            </div>

            {/* Scrollable content — independent of the drag layer */}
            <div
              className="flex-1 overflow-y-auto px-6 pt-3"
              style={{
                paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))",
                overscrollBehavior: "contain",
              }}
            >

            {/* Step 1: pick a question */}
            {step === "pick" && (
              <>
                <h2 className="font-display text-2xl text-ink">Pick a prompt</h2>
                <p className="text-ink-mid text-sm mt-1">
                  Choose the question you want to answer.
                </p>
                <div className="mt-5 space-y-2">
                  {PROFILE_PROMPTS.map((p) => {
                    const used = blockedQuestions.has(p.question);
                    const isCurrent = current?.question === p.question;
                    return (
                      <button
                        key={p.id}
                        onClick={() => !used && pickQuestion(p)}
                        disabled={used}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                          used
                            ? "bg-stripe-white/40 border-transparent text-gray-light cursor-not-allowed"
                            : isCurrent
                            ? "bg-wine text-cream border-wine"
                            : "bg-white text-ink border-transparent hover:border-wine/20"
                        }`}
                      >
                        <span className="text-[14px]">{p.question}</span>
                        {used && <span className="text-[10px] uppercase tracking-wider shrink-0">In use</span>}
                        {isCurrent && !used && (
                          <span className="text-[10px] uppercase tracking-wider shrink-0">Current</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleClose}
                  className="mt-6 w-full py-3 text-gray text-sm"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 2: answer that question */}
            {step === "answer" && picked && (
              <>
                <button
                  onClick={() => setStep("pick")}
                  className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine flex items-center gap-1 mb-3"
                >
                  ← Change prompt
                </button>

                <h2 className="font-display text-xl text-ink leading-snug">
                  {picked.question}
                </h2>

                {picked.type === "open" ? (
                  <div className="mt-5">
                    <textarea
                      value={openAnswer}
                      onChange={(e) => setOpenAnswer(e.target.value.slice(0, 140))}
                      placeholder="Your answer…"
                      autoFocus
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20 resize-none"
                    />
                    <p className="text-gray-light text-[11px] text-right mt-1">
                      {openAnswer.length}/140
                    </p>
                  </div>
                ) : (
                  <div className="mt-5">
                    {/* Two-option dilemma row */}
                    <div className="grid grid-cols-2 gap-2">
                      {picked.options?.map((opt) => {
                        const active = choice === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => setChoice(opt)}
                            className={`py-3.5 rounded-2xl text-sm font-medium transition-colors ${
                              active
                                ? "bg-wine text-cream"
                                : "bg-white text-ink hover:bg-stripe-white"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {choice && (
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 80))}
                        placeholder="Why? (optional)"
                        className="mt-3 w-full px-4 py-3 rounded-2xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20"
                      />
                    )}
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-full text-gray text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={
                      picked.type === "open"
                        ? !openAnswer.trim()
                        : !choice
                    }
                    className="flex-[2] py-3 rounded-full bg-wine text-cream text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            {step === "saving" && (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-wine/20 border-t-wine animate-spin" />
                <p className="text-ink-mid text-sm">Saving…</p>
              </div>
            )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
