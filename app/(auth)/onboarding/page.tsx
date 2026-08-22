"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createUser } from "@/lib/db";
import { uploadUserPhoto, validatePhotoFile, PhotoUploadError } from "@/lib/storage";
import { PromptPicker } from "@/components/prompts/PromptPicker";
import { DateOfBirthInput } from "@/components/ui/DateOfBirthInput";
import { LANGUAGES } from "@/lib/userHelpers";

const NEIGHBORHOODS = [
  "Centrum", "Jordaan", "De Pijp", "Oost", "West", "Noord", "Zuid",
  "Oud-West", "Oud-Zuid", "Amstel", "Westerpark", "Bos en Lommer",
  "Rivierenbuurt", "Zuidas", "IJburg",
];

const INTERESTS = [
  "specialty coffee", "cycling", "art", "vinyl", "reading", "yoga",
  "cooking", "live music", "running", "photography", "design", "travel",
  "markets", "cinema", "museums", "climbing", "festivals", "podcasts",
  "sports", "tennis", "padel", "football", "surfing", "skating",
];

const DRAFT_KEY = "blend_onboarding_draft";

interface OnboardingDraft {
  step: number;
  displayName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string;
  genderPreference: string[];
  lookingFor: string;
  bio: string;
  neighborhood: string;
  hometown: string;
  heightCm: string;
  languages: string[];
  work: string;
  company: string;
  education: string;
  interests: string[];
  profilePrompt: string;
  profileSong: string;
  coffeeOrder: string;
  prompts: { question: string; answer: string }[];
}

/** Min photos per Rick: 1 main + 4 extras = 5 total. */
const MIN_PHOTOS = 5;

/** Calculate age in years from YYYY-MM-DD. */
function calcAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, refreshProfile } = useAuthContext();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // YYYY-MM-DD
  const [heightCm, setHeightCm] = useState(""); // required
  const [hometown, setHometown] = useState(""); // optional
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");

  const derivedAge = calcAge(dateOfBirth);

  // Step 2
  const [bio, setBio] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [languages, setLanguages] = useState<string[]>([]); // required
  const [work, setWork] = useState("");
  const [company, setCompany] = useState("");
  const [education, setEducation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [profilePrompt, setProfilePrompt] = useState("");
  const [profileSong, setProfileSong] = useState("");
  const [coffeeOrder, setCoffeeOrder] = useState("");
  const [prompts, setPrompts] = useState<{ question: string; answer: string }[]>([]);

  // Step 3 (photos are never persisted to localStorage — user reselects)
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState(0);

  // ─── Draft restore on mount ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as OnboardingDraft;
      if (draft.displayName) setDisplayName(draft.displayName);
      if (draft.dateOfBirth) setDateOfBirth(draft.dateOfBirth);
      if (draft.heightCm) setHeightCm(draft.heightCm);
      if (draft.hometown) setHometown(draft.hometown);
      if (draft.gender) setGender(draft.gender);
      if (draft.genderPreference) setGenderPreference(draft.genderPreference);
      if (draft.lookingFor) setLookingFor(draft.lookingFor);
      if (draft.bio) setBio(draft.bio);
      if (draft.neighborhood) setNeighborhood(draft.neighborhood);
      if (draft.languages) setLanguages(draft.languages);
      if (draft.work) setWork(draft.work);
      if (draft.company) setCompany(draft.company);
      if (draft.education) setEducation(draft.education);
      if (draft.interests) setInterests(draft.interests);
      if (draft.profilePrompt) setProfilePrompt(draft.profilePrompt);
      if (draft.profileSong) setProfileSong(draft.profileSong);
      if (draft.coffeeOrder) setCoffeeOrder(draft.coffeeOrder);
      if (draft.prompts) setPrompts(draft.prompts);
      // Don't restore step past 2 — photos need reselection anyway
      if (draft.step && draft.step <= 2) setStep(draft.step);
      setDraftRestored(true);
    } catch {
      // Bad draft data — ignore
    }
  }, []);

  // ─── Auto-save draft on every change ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft: OnboardingDraft = {
      step,
      displayName,
      dateOfBirth,
      heightCm,
      hometown,
      gender,
      genderPreference,
      lookingFor,
      bio,
      neighborhood,
      languages,
      work,
      company,
      education,
      interests,
      profilePrompt,
      profileSong,
      coffeeOrder,
      prompts,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage full — fail silently
    }
  }, [step, displayName, dateOfBirth, heightCm, hometown, gender, genderPreference, lookingFor, bio, neighborhood, languages, work, company, education, interests, profilePrompt, profileSong, coffeeOrder, prompts]);

  // ─── Revoke all preview URLs on unmount to prevent memory leaks ───
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleGenderPref(val: string) {
    setGenderPreference((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function toggleInterest(val: string) {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoError(null);

    const newPhotos = [...photos];
    const newPreviews = [...previews];
    const failed: string[] = [];

    // Find empty slots starting from activeSlot
    let slotIndex = activeSlot;
    for (let i = 0; i < files.length && slotIndex < 6; i++) {
      // Find next empty slot
      while (slotIndex < 6 && newPhotos[slotIndex] !== null) {
        slotIndex++;
      }
      if (slotIndex >= 6) break;

      const file = files[i];

      // Validate file BEFORE setting — prevents invalid data from being tracked
      try {
        validatePhotoFile(file);
      } catch (err) {
        if (err instanceof PhotoUploadError) {
          failed.push(err.message);
        } else {
          failed.push("One photo couldn't be added.");
        }
        continue;
      }

      // Revoke existing preview URL if slot is being replaced
      if (newPreviews[slotIndex]) {
        URL.revokeObjectURL(newPreviews[slotIndex]!);
      }

      newPhotos[slotIndex] = file;
      newPreviews[slotIndex] = URL.createObjectURL(file);
      slotIndex++;
    }

    setPhotos(newPhotos);
    setPreviews(newPreviews);

    if (failed.length > 0) {
      setPhotoError(failed[0]);
      setTimeout(() => setPhotoError(null), 5000);
    }

    // Reset input so same files can be selected again
    e.target.value = "";
  }

  function removePhoto(index: number) {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
    const newPreviews = [...previews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]!);
    newPreviews[index] = null;
    setPreviews(newPreviews);
  }

  function canProceedStep1() {
    const heightNum = parseInt(heightCm);
    return (
      displayName &&
      dateOfBirth &&
      derivedAge >= 18 &&
      derivedAge <= 120 &&
      // Rick: lengte verplicht
      heightNum >= 140 &&
      heightNum <= 220 &&
      gender &&
      genderPreference.length > 0 &&
      lookingFor
    );
  }

  function canProceedStep2() {
    // Rick: alleen wijk + talen zijn verplicht. Bio, interests en prompts
    // blijven optioneel — Rick wil geen onboarding-block op deze velden.
    return neighborhood && languages.length > 0;
  }

  function canFinish() {
    // Rick: minimaal 1 hoofdfoto + 4 extra = 5 total
    return photos.filter(Boolean).length >= MIN_PHOTOS;
  }

  async function handleFinish() {
    if (!firebaseUser || saving) return;
    setSaving(true);
    setError(null);

    try {
      // Upload photos with per-photo error tracking
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo) continue;
        setUploading(i);
        try {
          const url = await uploadUserPhoto(firebaseUser.uid, photo, i);
          photoUrls.push(url);
        } catch (err) {
          setUploading(null);
          if (err instanceof PhotoUploadError) {
            setError(`Photo ${i + 1}: ${err.message}`);
          } else {
            setError(`Photo ${i + 1} couldn't be uploaded. Check your connection and try again.`);
          }
          setSaving(false);
          return;
        }
      }
      setUploading(null);

      const userData: Record<string, unknown> = {
        displayName,
        age: derivedAge,
        dateOfBirth, // authoritative — used for age verification + recalculation on birthday
        heightCm: parseInt(heightCm),
        languages,
        gender,
        genderPreference,
        lookingFor: lookingFor as "dating" | "friends" | "open",
        bio,
        neighborhood,
        interests,
        photos: photoUrls,
      };
      if (hometown) userData.hometown = hometown;
      if (work) userData.work = work;
      if (company) userData.company = company;
      if (education) userData.education = education;
      if (profilePrompt) userData.profilePrompt = profilePrompt;
      if (profileSong) userData.profileSong = profileSong;
      if (coffeeOrder) userData.coffeeOrder = coffeeOrder;
      if (prompts.length > 0) userData.prompts = prompts;

      await createUser(firebaseUser.uid, {
        ...userData,
        ageRange: [18, 99],
      });

      // Clear draft once profile is created
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }

      await refreshProfile();
      router.push("/today");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-wine relative overflow-hidden">
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-burgundy opacity-40" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-burgundy opacity-30" />

      <div className="relative z-10 max-w-sm mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-cream">BLEND</h1>
          <p className="text-cream/60 mt-1 text-sm">Step {step} of 3</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? "bg-cream" : "bg-cream/20"
              }`}
            />
          ))}
        </div>

        {/* Draft restored banner */}
        {draftRestored && (
          <div className="bg-cream/10 border border-cream/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3">
            <p className="text-cream/80 text-xs">Welcome back — we saved your progress.</p>
            <button
              onClick={() => setDraftRestored(false)}
              className="text-cream/50 text-xs hover:text-cream"
              aria-label="Dismiss"
            >
              Got it
            </button>
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-display text-cream">The basics</h2>

            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="First name"
              aria-label="First name"
              autoComplete="given-name"
              className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
            />

            <div>
              <label className="text-cream/60 text-sm mb-2 block">
                Date of birth
              </label>
              <DateOfBirthInput value={dateOfBirth} onChange={setDateOfBirth} theme="dark" />
              {dateOfBirth && derivedAge > 0 && derivedAge < 18 && (
                <p className="text-coral text-xs mt-2">
                  You must be 18 or older to use BLEND.
                </p>
              )}
              {dateOfBirth && derivedAge >= 18 && (
                <p className="text-cream/40 text-xs mt-2">
                  {derivedAge} years old
                </p>
              )}
            </div>

            {/* Height — Rick: verplicht */}
            <div>
              <label className="text-cream/60 text-sm mb-2 block">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                min={140}
                max={220}
                inputMode="numeric"
                className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
              {heightCm && (parseInt(heightCm) < 140 || parseInt(heightCm) > 220) && (
                <p className="text-coral text-xs mt-2">Enter a height between 140 and 220 cm.</p>
              )}
              {heightCm && parseInt(heightCm) >= 140 && parseInt(heightCm) <= 220 && (
                <p className="text-cream/40 text-xs mt-2">{(parseInt(heightCm) / 100).toFixed(2)} m</p>
              )}
            </div>

            {/* Hometown — Rick: optional "Komt uit" — important for expats */}
            <div>
              <label className="text-cream/60 text-sm mb-2 block">Where you&apos;re from <span className="text-cream/30">(optional)</span></label>
              <input
                type="text"
                value={hometown}
                onChange={(e) => setHometown(e.target.value.slice(0, 60))}
                placeholder="Cape Town, Milan, Utrecht…"
                className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
            </div>

            <div>
              <p className="text-cream/60 text-sm mb-2">I am</p>
              <div className="flex gap-2">
                {["Man", "Woman", "Non-binary"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g.toLowerCase())}
                    className={`flex-1 py-3 rounded-full text-sm font-medium transition-colors ${
                      gender === g.toLowerCase()
                        ? "bg-cream text-wine"
                        : "border border-cream/20 text-cream/60 hover:bg-cream/10"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-cream/60 text-sm mb-2">Show me</p>
              <div className="flex gap-2">
                {["Men", "Women", "Everyone"].map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenderPref(g.toLowerCase())}
                    className={`flex-1 py-3 rounded-full text-sm font-medium transition-colors ${
                      genderPreference.includes(g.toLowerCase())
                        ? "bg-cream text-wine"
                        : "border border-cream/20 text-cream/60 hover:bg-cream/10"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-cream/60 text-sm mb-2">Open to</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "dating", label: "Open to romance" },
                  { value: "friends", label: "Friends" },
                  { value: "open", label: "Either" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLookingFor(opt.value)}
                    className={`py-3 rounded-full text-sm font-medium transition-colors ${
                      lookingFor === opt.value
                        ? "bg-cream text-wine"
                        : "border border-cream/20 text-cream/60 hover:bg-cream/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1()}
              className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors disabled:opacity-30 mt-4"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Bio & Interests */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-display text-cream">About you</h2>

            <div>
              <textarea
                value={bio}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > 300) {
                    setBio(v.slice(0, 300));
                    setPhotoError("Bio is limited to 300 characters.");
                    setTimeout(() => setPhotoError(null), 3000);
                  } else {
                    setBio(v);
                  }
                }}
                placeholder="A few lines. Not a CV."
                rows={3}
                aria-label="Short bio, up to 300 characters"
                className="w-full px-5 py-4 rounded-2xl bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors resize-none"
              />
              <p className={`text-xs text-right mt-1 ${bio.length >= 280 ? "text-coral" : "text-cream/30"}`}>
                {bio.length}/300
              </p>
            </div>

            <div>
              <p className="text-cream/60 text-sm mb-2">Neighborhood</p>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 focus:outline-none focus:border-cream/50 transition-colors appearance-none"
              >
                <option value="" className="text-ink">Select your area</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n} className="text-ink">{n}</option>
                ))}
              </select>
            </div>

            {/* Languages — Rick: verplicht */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-cream/60 text-sm">Languages you speak</p>
                <p className={`text-xs ${languages.length > 0 ? "text-cream/40" : "text-cream/70"}`}>
                  {languages.length === 0 ? "Pick at least one" : `${languages.length} picked`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const active = languages.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() =>
                        setLanguages((prev) =>
                          prev.includes(l) ? prev.filter((v) => v !== l) : [...prev, l]
                        )
                      }
                      className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm transition-colors ${
                        active
                          ? "bg-cream text-wine font-medium"
                          : "border border-cream/20 text-cream/60 hover:bg-cream/10"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work & Education — Rick: optional */}
            <div className="space-y-3">
              <p className="text-cream/60 text-sm">Work & Education <span className="text-cream/30">(optional)</span></p>
              <input
                type="text"
                value={work}
                onChange={(e) => setWork(e.target.value.slice(0, 60))}
                placeholder="What you do (Product designer, chef…)"
                className="w-full px-5 py-3 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value.slice(0, 60))}
                placeholder="Company"
                className="w-full px-5 py-3 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value.slice(0, 60))}
                placeholder="Education"
                className="w-full px-5 py-3 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-cream/60 text-sm">Interests</p>
                <p className={`text-xs ${interests.length >= 3 ? "text-cream/40" : "text-cream/70"}`}>
                  {interests.length < 3 ? `Pick ${3 - interests.length} more` : `${interests.length} picked`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm transition-colors ${
                      interests.includes(i)
                        ? "bg-cream text-wine font-medium"
                        : "border border-cream/20 text-cream/60 hover:bg-cream/10"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>

              {/* Custom interests — visible chips */}
              {interests.filter((i) => !INTERESTS.includes(i)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests
                    .filter((i) => !INTERESTS.includes(i))
                    .map((i) => (
                      <button
                        key={i}
                        onClick={() => toggleInterest(i)}
                        className="px-4 py-2.5 min-h-[44px] rounded-full text-sm bg-cream text-wine font-medium flex items-center gap-1.5"
                        aria-label={`Remove ${i}`}
                      >
                        {i}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ))}
                </div>
              )}

              {/* Add custom interest */}
              <OnboardingCustomInterestInput
                onAdd={(value) => {
                  const trimmed = value.trim().toLowerCase();
                  if (!trimmed || trimmed.length > 30) return;
                  if (interests.includes(trimmed)) return;
                  setInterests((prev) => [...prev, trimmed]);
                }}
              />
            </div>

            {/* Coffee order */}
            <div>
              <p className="text-cream/60 text-sm mb-2">Your coffee order</p>
              <input
                type="text"
                value={coffeeOrder}
                onChange={(e) => setCoffeeOrder(e.target.value.slice(0, 50))}
                placeholder="Oat flat white, espresso, chai latte..."
                className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
            </div>

            {/* Profile prompt */}
            <div>
              <p className="text-cream/60 text-sm mb-2">
                A fun fact about you (optional)
              </p>
              <input
                type="text"
                value={profilePrompt}
                onChange={(e) => setProfilePrompt(e.target.value.slice(0, 150))}
                placeholder="Be honest, be weird"
                className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
            </div>

            {/* Fun prompts */}
            <div>
              <p className="text-cream/60 text-sm mb-2">Pick 3 prompts</p>
              <PromptPicker
                existingPrompts={prompts}
                onSave={(p) => setPrompts(p)}
                dark
              />
            </div>

            {/* Profile song */}
            <div>
              <p className="text-cream/60 text-sm mb-2">One song</p>
              <input
                type="url"
                value={profileSong}
                onChange={(e) => setProfileSong(e.target.value)}
                placeholder="Paste a Spotify song link"
                className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
              />
              <p className="text-cream/30 text-xs mt-1">open.spotify.com/track/...</p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-full border border-cream/20 text-cream font-medium hover:bg-cream/10 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2()}
                className="flex-1 py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-display text-cream">Your photos</h2>
            <p className="text-cream/60 text-sm">
              One main photo (top-left) + at least 4 more. {MIN_PHOTOS - photos.filter(Boolean).length > 0
                ? `${MIN_PHOTOS - photos.filter(Boolean).length} to go.`
                : "Looking good ✓"}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <div className="grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (preview) {
                      removePhoto(index);
                    } else {
                      setActiveSlot(index);
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`aspect-square rounded-2xl overflow-hidden relative transition-colors ${
                    preview
                      ? ""
                      : "border-2 border-dashed border-cream/20 hover:border-cream/40 bg-cream/5"
                  }`}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {uploading === index && (
                        <div className="absolute inset-0 bg-wine/60 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full border-2 border-cream border-t-transparent animate-spin" />
                        </div>
                      )}
                      <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-wine/80 text-cream flex items-center justify-center text-xs">
                        x
                      </div>
                      {/* Rick: één duidelijke hoofdfoto die altijd als eerste staat */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-cream text-wine text-[9px] font-semibold uppercase tracking-wider">
                          Main
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-cream/30 text-2xl">+</span>
                      <span className="text-cream/30 text-[10px] mt-1">
                        {index === 0 ? "main" : "add"}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Photo error toast */}
            {photoError && (
              <div className="bg-coral/20 border border-coral/40 rounded-xl px-4 py-3 text-coral text-sm">
                {photoError}
              </div>
            )}

            {/* Upload/save error */}
            {error && (
              <div className="bg-coral/20 border border-coral/40 rounded-xl px-4 py-3 text-coral text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(2)}
                disabled={saving}
                className="flex-1 py-4 rounded-full border border-cream/20 text-cream font-medium hover:bg-cream/10 transition-colors disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={!canFinish() || saving}
                className="flex-1 py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 rounded-full border-2 border-wine border-t-transparent animate-spin" />
                )}
                {saving ? (uploading !== null ? `Uploading photo ${uploading + 1}...` : "Saving profile...") : "Let's go"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom interest input — dark theme variant, sits under the preset
// interest pills in onboarding. Same UX as the profile-edit variant.
function OnboardingCustomInterestInput({ onAdd }: { onAdd: (v: string) => void }) {
  const [value, setValue] = useState("");
  function submit() {
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  }
  return (
    <div className="mt-3 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 30))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Add your own — e.g. vondelpark mornings"
        maxLength={30}
        className="flex-1 px-4 py-2.5 rounded-full bg-cream/10 text-cream text-sm border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        className="px-4 py-2.5 rounded-full bg-cream text-wine text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
      >
        Add
      </button>
    </div>
  );
}
