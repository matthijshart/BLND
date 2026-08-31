"use client";

import { useState } from "react";
import { updateUser } from "@/lib/db";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { triggerHaptic } from "@/lib/sounds";

type Mode = "dating" | "friends" | "open";

const MODES: { value: Mode; label: string; desc: string }[] = [
  { value: "dating", label: "Open to romance", desc: "If the hour goes that way, good." },
  { value: "friends", label: "Friends", desc: "New people in your city, no agenda." },
  { value: "open", label: "Either", desc: "See what the hour turns into." },
];

// The stored values are "men" / "women" / "everyone". lib/daily.ts maps the
// first two onto the gender field and drops the filter entirely for
// "everyone", so these three are genuinely exclusive — the old multi-select
// let you pick "Men" AND "Everyone", which silently just meant everyone.
const SHOW_ME: { value: string; label: string }[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "everyone", label: "Everyone" },
];

/**
 * Preferences, editable in place on the profile screen.
 *
 * Everything saves the moment you tap it — there is no Save button to forget,
 * and the current state is legible without opening anything.
 */
export function PreferencesCard() {
  const { firebaseUser, profile, refreshProfile } = useAuthContext();

  const [mode, setMode] = useState<Mode>("open");
  const [showMe, setShowMe] = useState<string>("everyone");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Sync from the stored profile during render rather than in an effect —
  // an effect here fires a second render pass on every profile refresh, and
  // refreshProfile() runs after every save.
  const storedPref = profile?.genderPreference || [];
  const storedKey = [
    profile?.lookingFor ?? "",
    storedPref.join(","),
    (profile?.ageRange || []).join("-"),
  ].join("|");
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (profile && storedKey !== syncedKey) {
    setSyncedKey(storedKey);
    setMode((profile.lookingFor as Mode) || "open");
    setShowMe(
      storedPref.includes("everyone") || storedPref.length === 0
        ? "everyone"
        : storedPref[0]
    );
    setAgeRange(profile.ageRange || [18, 99]);
  }

  async function persist(next: {
    lookingFor?: Mode;
    genderPreference?: string[];
    ageRange?: [number, number];
  }) {
    if (!firebaseUser) return;
    setStatus("saving");
    try {
      await updateUser(firebaseUser.uid, next);
      await refreshProfile();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1600);
    } catch {
      // Never leave the user believing a preference stuck when it did not.
      setStatus("error");
    }
  }

  function pickMode(value: Mode) {
    triggerHaptic();
    setMode(value);
    persist({ lookingFor: value });
  }

  function pickShowMe(value: string) {
    triggerHaptic();
    setShowMe(value);
    persist({ genderPreference: [value] });
  }

  function commitAge(min: number, max: number) {
    const lo = Math.max(18, Math.min(99, min));
    const hi = Math.max(lo, Math.min(99, max));
    setAgeRange([lo, hi]);
    persist({ ageRange: [lo, hi] });
  }

  if (!profile) return null;

  const modeLabel = MODES.find((m) => m.value === mode)?.label ?? "Either";
  const showMeLabel = SHOW_ME.find((g) => g.value === showMe)?.label ?? "Everyone";

  return (
    <section className="px-5 py-4 border-t border-wine/5">
      {/* Summary — the whole point: your settings readable at a glance */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray">
            You&apos;re here for
          </p>
          <p className="text-ink font-display text-lg mt-1 truncate">
            {modeLabel}
          </p>
          <p className="text-gray text-xs mt-0.5">
            {showMeLabel} · {ageRange[0]}–{ageRange[1]}
          </p>
        </div>
        <span className="shrink-0 flex items-center gap-2">
          {status === "saving" && <span className="text-gray-light text-[11px]">Saving…</span>}
          {status === "saved" && <span className="text-wine text-[11px]">Saved ✓</span>}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-wine transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {status === "error" && (
        <p className="text-coral text-[11px] mt-2">
          Couldn&apos;t save that. Check your connection and tap again.
        </p>
      )}

      {expanded && (
        <div className="mt-5 space-y-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray mb-2">
              I&apos;m here for
            </p>
            <div className="space-y-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => pickMode(m.value)}
                  aria-pressed={mode === m.value}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    mode === m.value
                      ? "bg-wine text-cream border-wine"
                      : "bg-white text-ink border-transparent"
                  }`}
                >
                  <p className="font-display text-base leading-none">{m.label}</p>
                  <p className={`text-xs mt-1 ${mode === m.value ? "text-cream/75" : "text-gray"}`}>
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray mb-2">
              Show me
            </p>
            <div className="flex gap-2">
              {SHOW_ME.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => pickShowMe(g.value)}
                  aria-pressed={showMe === g.value}
                  className={`flex-1 py-3 rounded-full text-sm font-medium transition-colors ${
                    showMe === g.value ? "bg-wine text-cream" : "bg-white text-ink"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray mb-2">
              Age range
            </p>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3">
              <input
                type="number"
                inputMode="numeric"
                value={ageRange[0]}
                min={18}
                max={99}
                aria-label="Minimum age"
                onChange={(e) => setAgeRange([parseInt(e.target.value) || 18, ageRange[1]])}
                onBlur={(e) => commitAge(parseInt(e.target.value) || 18, ageRange[1])}
                className="w-20 px-3 py-2 rounded-lg bg-stripe-white text-ink text-center font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-wine/20"
              />
              <span className="text-gray flex-1 text-center text-sm">to</span>
              <input
                type="number"
                inputMode="numeric"
                value={ageRange[1]}
                min={18}
                max={99}
                aria-label="Maximum age"
                onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value) || 99])}
                onBlur={(e) => commitAge(ageRange[0], parseInt(e.target.value) || 99)}
                className="w-20 px-3 py-2 rounded-lg bg-stripe-white text-ink text-center font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-wine/20"
              />
            </div>
          </div>

          <p className="text-gray-light text-[11px] text-center">
            Changes save as you tap. Tomorrow&apos;s 11:00 batch uses them.
          </p>
        </div>
      )}
    </section>
  );
}
