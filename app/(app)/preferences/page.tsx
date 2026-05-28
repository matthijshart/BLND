"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateUser } from "@/lib/db";
import { CoffeeRing } from "@/components/ui/CoffeeRing";

/**
 * Preferences — a dedicated screen, moved out of the Profile page per Rick.
 *
 * Three sections:
 *  1. Mode: Dating / Friends / Open (the new "I'm here for" switch)
 *  2. Interested in: Men / Women / Everyone
 *  3. Age range
 */
export default function PreferencesPage() {
  const { firebaseUser, profile, refreshProfile } = useAuthContext();
  const router = useRouter();

  const [lookingFor, setLookingFor] = useState<"dating" | "friends" | "open">("open");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLookingFor((profile.lookingFor as "dating" | "friends" | "open") || "open");
    setGenderPreference(profile.genderPreference || []);
    setAgeRange(profile.ageRange || [18, 99]);
  }, [profile]);

  async function handleSave() {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateUser(firebaseUser.uid, {
        lookingFor,
        genderPreference,
        ageRange,
      });
      await refreshProfile();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-wine/20 animate-pulse" />
      </div>
    );
  }

  const modes: { value: "dating" | "friends" | "open"; label: string; desc: string }[] = [
    { value: "dating", label: "Dating", desc: "Open to romance, slow burn or otherwise." },
    { value: "friends", label: "Friends", desc: "New people in your city, no agenda." },
    { value: "open", label: "Both", desc: "See what brews. Let coffee decide." },
  ];

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-32 relative">
      <CoffeeRing variant="ring" className="-top-4 -right-2 w-20 h-20" opacity={0.06} rotate={20} />

      <div className="relative z-10">
        <Link
          href="/profile"
          className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine flex items-center gap-1"
        >
          ← Profile
        </Link>
        <h1 className="text-3xl font-display text-ink mt-2">Preferences</h1>
        <p className="text-ink-mid text-sm mt-1">Who you&apos;d like to meet and how.</p>
      </div>

      {/* Mode — Dating / Friends / Both */}
      <section className="mt-8">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray mb-3">
          I&apos;m here for
        </h2>
        <div className="space-y-2">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setLookingFor(m.value)}
              className={`w-full text-left p-4 rounded-2xl transition-colors border ${
                lookingFor === m.value
                  ? "bg-wine text-cream border-wine"
                  : "bg-white text-ink border-transparent hover:border-wine/20"
              }`}
            >
              <p className="font-display text-lg leading-none">{m.label}</p>
              <p className={`text-sm mt-1 ${lookingFor === m.value ? "text-cream/75" : "text-gray"}`}>
                {m.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Interested in */}
      <section className="mt-8">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray mb-3">
          Interested in
        </h2>
        <div className="flex gap-2">
          {["Men", "Women", "Everyone"].map((g) => {
            const key = g.toLowerCase();
            const active = genderPreference.includes(key);
            return (
              <button
                key={g}
                onClick={() => {
                  setGenderPreference((prev) =>
                    prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
                  );
                }}
                className={`flex-1 py-3 rounded-full text-sm font-medium transition-colors ${
                  active ? "bg-wine text-cream" : "bg-white text-ink"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* Age range */}
      <section className="mt-8">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray mb-3">
          Age range
        </h2>
        <div className="flex items-center gap-3 bg-white rounded-2xl p-4">
          <input
            type="number"
            value={ageRange[0]}
            onChange={(e) => {
              const n = parseInt(e.target.value) || 18;
              const newMin = Math.max(18, Math.min(99, n));
              setAgeRange([newMin, Math.max(newMin, ageRange[1])]);
            }}
            min={18}
            max={99}
            className="w-20 px-3 py-2 rounded-xl bg-stripe-white text-ink text-center font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-wine/20"
            aria-label="Minimum age"
          />
          <span className="text-gray flex-1 text-center text-sm">to</span>
          <input
            type="number"
            value={ageRange[1]}
            onChange={(e) => {
              const n = parseInt(e.target.value) || 99;
              const newMax = Math.max(18, Math.min(99, n));
              setAgeRange([Math.min(newMax, ageRange[0]), newMax]);
            }}
            min={18}
            max={99}
            className="w-20 px-3 py-2 rounded-xl bg-stripe-white text-ink text-center font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-wine/20"
            aria-label="Maximum age"
          />
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-10 w-full py-4 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>

      <button
        onClick={() => router.push("/profile")}
        className="mt-3 w-full py-3 text-gray text-sm"
      >
        Back to profile
      </button>

      {savedToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
        >
          <div className="px-4 py-2 rounded-full bg-ink text-cream text-sm shadow-lg">
            Saved ✓
          </div>
        </div>
      )}
    </div>
  );
}
