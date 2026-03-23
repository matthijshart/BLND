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

  function selectPrompt(prompt: ProfilePromptConfig) {
    if (prompt.type === "open") {
      setActivePrompt(prompt);
      setOpenAnswer("");
    }
    // choice prompts are handled inline
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

  const textColor = dark ? "text-cream" : "text-ink";
  const mutedColor = dark ? "text-cream/60" : "text-gray";
  const cardBg = dark ? "bg-cream/10 border-cream/20" : "bg-white border-cream";
  const pillActive = dark ? "bg-cream text-wine" : "bg-wine text-cream";
  const pillInactive = dark ? "border border-cream/20 text-cream/60 hover:bg-cream/10" : "bg-cream text-ink-mid hover:bg-stripe-white";
  const inputBg = dark ? "bg-cream/10 text-cream border-cream/20 placeholder:text-cream/30" : "bg-cream text-ink border-cream placeholder:text-gray-light";

  return (
    <div>
      {/* Pending choice comment */}
      {pendingChoice && (
        <div className={`rounded-xl p-4 border mb-4 ${cardBg}`}>
          <p className={`text-xs font-medium italic mb-1 ${dark ? "text-cream/50" : "text-wine"}`}>
            {pendingChoice.prompt.question}
          </p>
          <p className={`text-[15px] font-medium mb-2 ${textColor}`}>
            {pendingChoice.choice}
          </p>
          <input
            type="text"
            value={choiceComment}
            onChange={(e) => setChoiceComment(e.target.value.slice(0, 80))}
            placeholder="Add a comment... (optional)"
            autoFocus
            className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${inputBg}`}
            onKeyDown={(e) => e.key === "Enter" && confirmChoice()}
          />
          <div className="flex gap-3 mt-2">
            <button onClick={() => setPendingChoice(null)} className={`text-xs ${mutedColor}`}>
              Cancel
            </button>
            <button onClick={confirmChoice} className={`text-xs font-medium ${dark ? "text-cream" : "text-wine"}`}>
              {choiceComment.trim() ? "Add with comment" : "Add without comment"}
            </button>
          </div>
        </div>
      )}

      {/* Answered prompts */}
      {answered.length > 0 && (
        <div className="space-y-3 mb-4">
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
                  className={`text-xs ${mutedColor} shrink-0`}
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
        <div className={`rounded-xl p-4 border mb-4 ${cardBg}`}>
          <p className={`text-xs font-medium italic mb-2 ${dark ? "text-cream/50" : "text-wine"}`}>
            {activePrompt.question}
          </p>
          <input
            type="text"
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value.slice(0, 100))}
            placeholder="Your answer..."
            autoFocus
            className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${inputBg}`}
            onKeyDown={(e) => e.key === "Enter" && answerOpen()}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setActivePrompt(null)} className={`text-xs ${mutedColor}`}>
              Cancel
            </button>
            <button
              onClick={answerOpen}
              disabled={!openAnswer.trim()}
              className={`text-xs font-medium ${dark ? "text-cream" : "text-wine"} disabled:opacity-30`}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Browse prompts */}
      {browsing ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs uppercase tracking-wider font-medium ${mutedColor}`}>
              Pick a prompt {answered.length >= 3 ? "(max 3)" : ""}
            </p>
            <button onClick={() => setBrowsing(false)} className={`text-xs ${mutedColor}`}>
              Done
            </button>
          </div>
          <div className="space-y-2">
            {PROFILE_PROMPTS.filter((p) => !answeredIds.includes(p.id)).map((prompt) => (
              <div key={prompt.id} className={`rounded-xl p-3 border ${cardBg}`}>
                <p className={`text-sm ${textColor}`}>{prompt.question}</p>
                {prompt.type === "choice" && prompt.options ? (
                  <div className="flex gap-2 mt-2">
                    {prompt.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          startChoice(prompt, opt);
                          setBrowsing(false);
                        }}
                        disabled={answered.length >= 3}
                        className={`flex-1 py-2 rounded-full text-xs font-medium transition-all disabled:opacity-30 ${pillInactive}`}
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
                    disabled={answered.length >= 3}
                    className={`mt-2 text-xs font-medium disabled:opacity-30 ${dark ? "text-cream" : "text-wine"}`}
                  >
                    Answer →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {answered.length < 3 && (
            <button
              onClick={() => setBrowsing(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pillInactive}`}
            >
              + Add prompt {answered.length === 0 ? "" : `(${3 - answered.length} left)`}
            </button>
          )}
          {answered.length > 0 && (
            <button
              onClick={() => onSave(answered)}
              disabled={saving}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pillActive} disabled:opacity-50`}
            >
              {saving ? "Saving..." : "Save prompts"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
