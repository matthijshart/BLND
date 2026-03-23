"use client";

import { useState } from "react";
import { PROFILE_PROMPTS, type ProfilePromptConfig } from "@/lib/prompts";

interface PromptPickerProps {
  existingPrompts?: { question: string; answer: string }[];
  onSave: (prompts: { question: string; answer: string }[]) => void;
  saving?: boolean;
  /** Dark mode for onboarding (cream text on wine bg) */
  dark?: boolean;
}

export function PromptPicker({ existingPrompts, onSave, saving, dark }: PromptPickerProps) {
  const [answered, setAnswered] = useState<{ question: string; answer: string }[]>(
    existingPrompts || []
  );
  const [browsing, setBrowsing] = useState(false);
  const [activePrompt, setActivePrompt] = useState<ProfilePromptConfig | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [choiceComment, setChoiceComment] = useState("");
  const [pendingChoice, setPendingChoice] = useState<{ prompt: ProfilePromptConfig; choice: string } | null>(null);

  const answeredIds = answered.map((a) => {
    const found = PROFILE_PROMPTS.find((p) => p.question === a.question);
    return found?.id || "";
  });

  const canSave = answered.length >= 3;
  const remaining = 3 - answered.length;

  function selectPrompt(prompt: ProfilePromptConfig) {
    if (prompt.type === "open") {
      setActivePrompt(prompt);
      setOpenAnswer("");
    }
  }

  function startChoice(prompt: ProfilePromptConfig, choice: string) {
    setPendingChoice({ prompt, choice });
    setChoiceComment("");
  }

  function confirmChoice() {
    if (!pendingChoice) return;
    const answer = choiceComment.trim()
      ? `${pendingChoice.choice} — ${choiceComment.trim()}`
      : pendingChoice.choice;
    const newAnswered = [...answered.filter((a) => a.question !== pendingChoice.prompt.question), { question: pendingChoice.prompt.question, answer }];
    setAnswered(newAnswered);
    setPendingChoice(null);
    setChoiceComment("");
  }

  function answerOpen() {
    if (!activePrompt || !openAnswer.trim()) return;
    const newAnswered = [...answered.filter((a) => a.question !== activePrompt.question), { question: activePrompt.question, answer: openAnswer.trim() }];
    setAnswered(newAnswered);
    setActivePrompt(null);
    setOpenAnswer("");
  }

  function removePrompt(question: string) {
    setAnswered(answered.filter((a) => a.question !== question));
  }

  // Theme styles
  const textColor = dark ? "text-cream" : "text-ink";
  const mutedColor = dark ? "text-cream/60" : "text-gray";
  const cardBg = dark ? "bg-cream/10 border-cream/20" : "bg-stripe-white border-cream/50";
  const pillInactive = dark ? "border border-cream/20 text-cream/60 hover:bg-cream/10" : "bg-cream text-ink-mid hover:bg-stripe-white";
  const inputBg = dark ? "bg-cream/10 text-cream border-cream/20 placeholder:text-cream/30" : "bg-white text-ink border-cream placeholder:text-gray-light";

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i < answered.length
                  ? dark ? "bg-cream" : "bg-wine"
                  : dark ? "bg-cream/15" : "bg-cream"
              }`}
            />
          ))}
        </div>
        <p className={`text-xs ${mutedColor}`}>
          {answered.length === 0 && "Pick at least 3 prompts to continue"}
          {answered.length === 1 && "2 more to go"}
          {answered.length === 2 && "1 more to go"}
          {answered.length >= 3 && "All done! Save your answers below."}
        </p>
      </div>

      {/* Pending choice comment */}
      {pendingChoice && (
        <div className={`rounded-xl p-4 border mb-3 ${cardBg}`}>
          <p className={`text-xs font-medium italic mb-1 ${dark ? "text-cream/50" : "text-wine"}`}>
            {pendingChoice.prompt.question}
          </p>
          <p className={`text-[15px] font-medium mb-3 ${textColor}`}>
            {pendingChoice.choice}
          </p>
          <input
            type="text"
            value={choiceComment}
            onChange={(e) => setChoiceComment(e.target.value.slice(0, 80))}
            placeholder="Add a comment... (optional)"
            autoFocus
            className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${inputBg}`}
            onKeyDown={(e) => e.key === "Enter" && confirmChoice()}
          />
          <div className="flex gap-3 mt-3">
            <button onClick={() => setPendingChoice(null)} className={`text-xs ${mutedColor}`}>
              Cancel
            </button>
            <button
              onClick={confirmChoice}
              className={`px-4 py-1.5 rounded-full text-xs font-medium ${dark ? "bg-cream text-wine" : "bg-wine text-cream"}`}
            >
              {choiceComment.trim() ? "Add with comment" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Answered prompts */}
      {answered.length > 0 && !browsing && (
        <div className="space-y-2 mb-4">
          {answered.map((a) => (
            <div key={a.question} className={`rounded-xl p-4 border ${cardBg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={`text-xs font-medium italic ${dark ? "text-cream/50" : "text-wine"}`}>
                    {a.question}
                  </p>
                  <p className={`text-[15px] mt-1 ${textColor}`}>{a.answer}</p>
                </div>
                <button
                  onClick={() => removePrompt(a.question)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    dark ? "bg-cream/10 text-cream/40 hover:bg-cream/20" : "bg-cream text-gray hover:bg-stripe-white"
                  }`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Open answer input */}
      {activePrompt && (
        <div className={`rounded-xl p-4 border mb-3 ${cardBg}`}>
          <p className={`text-xs font-medium italic mb-2 ${dark ? "text-cream/50" : "text-wine"}`}>
            {activePrompt.question}
          </p>
          <input
            type="text"
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value.slice(0, 100))}
            placeholder="Your answer..."
            autoFocus
            className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${inputBg}`}
            onKeyDown={(e) => e.key === "Enter" && answerOpen()}
          />
          <div className="flex gap-3 mt-3">
            <button onClick={() => setActivePrompt(null)} className={`text-xs ${mutedColor}`}>
              Cancel
            </button>
            <button
              onClick={answerOpen}
              disabled={!openAnswer.trim()}
              className={`px-4 py-1.5 rounded-full text-xs font-medium disabled:opacity-30 ${dark ? "bg-cream text-wine" : "bg-wine text-cream"}`}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Browse prompts */}
      {browsing && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs uppercase tracking-wider font-medium ${mutedColor}`}>
              Choose a prompt
            </p>
            <button
              onClick={() => setBrowsing(false)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${dark ? "bg-cream/10 text-cream" : "bg-cream text-ink-mid"}`}
            >
              Back
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {PROFILE_PROMPTS.filter((p) => !answeredIds.includes(p.id)).map((prompt) => (
              <div key={prompt.id} className={`rounded-xl p-3.5 border ${cardBg}`}>
                <p className={`text-sm font-medium ${textColor}`}>{prompt.question}</p>
                {prompt.type === "choice" && prompt.options ? (
                  <div className="flex gap-2 mt-2.5">
                    {prompt.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          startChoice(prompt, opt);
                          setBrowsing(false);
                        }}
                        className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-all ${pillInactive}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      selectPrompt(prompt);
                      setBrowsing(false);
                    }}
                    className={`mt-2 text-xs font-medium ${dark ? "text-cream" : "text-wine"}`}
                  >
                    Answer this →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons — always visible at bottom */}
      {!browsing && !pendingChoice && !activePrompt && (
        <div className="space-y-3">
          {/* Add more prompts button */}
          {answered.length < 3 && (
            <button
              onClick={() => setBrowsing(true)}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all border-2 border-dashed ${
                dark
                  ? "border-cream/20 text-cream/70 hover:border-cream/40 hover:bg-cream/5"
                  : "border-ink/10 text-gray hover:border-ink/20 hover:bg-cream"
              }`}
            >
              + Add prompt ({remaining} more needed)
            </button>
          )}

          {/* Save / Done button — prominent red */}
          {answered.length >= 3 && (
            <button
              onClick={() => onSave(answered)}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-wine text-cream font-medium text-base hover:bg-burgundy transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? "Saving..." : "Done — save prompts"}
            </button>
          )}

          {/* Optional: add more even after 3 */}
          {answered.length >= 3 && answered.length < 5 && (
            <button
              onClick={() => setBrowsing(true)}
              className={`w-full text-center text-xs ${mutedColor}`}
            >
              + Add another prompt (optional)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
