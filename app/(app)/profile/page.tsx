"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateUser } from "@/lib/db";
import { uploadUserPhoto, deleteUserPhoto } from "@/lib/storage";
import { signOut } from "@/lib/auth";
import Image from "next/image";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { CoffeeRing } from "@/components/ui/CoffeeRing";
import { VerificationFlow } from "@/components/verification/VerificationFlow";
import { PromptPicker } from "@/components/prompts/PromptPicker";
import { QuickPromptEdit } from "@/components/prompts/QuickPromptEdit";
import { getProfileNumber, LANGUAGES, formatHeight, HEIGHT_MIN_CM, HEIGHT_MAX_CM } from "@/lib/userHelpers";
import { SpotifyPlayer, isValidSpotifyUrl } from "@/components/ui/SpotifyPlayer";
import { PhotoViewer } from "@/components/ui/PhotoViewer";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ─── Sortable Photo Item ─── */
function SortablePhoto({
  id, url, uploading, onRemove,
}: {
  id: string; url: string; uploading: boolean; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0, opacity: isDragging ? 0.7 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="aspect-square rounded-xl overflow-hidden relative">
      <div {...attributes} {...listeners} className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing" />
      <Image src={url} alt="" fill className="object-cover pointer-events-none" />
      {uploading && (
        <div className="absolute inset-0 bg-wine/60 flex items-center justify-center z-20">
          <div className="w-5 h-5 rounded-full border-2 border-cream border-t-transparent animate-spin" />
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/50 backdrop-blur-sm text-white flex items-center justify-center z-20">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}

/* ─── Photo Grid Editor ─── */
function PhotoGridEditor({ photos, uploading, onRemove, onReorder, onAddClick }: {
  photos: string[]; uploading: number | null; onRemove: (i: number) => void; onReorder: (p: string[]) => void; onAddClick: (s: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );
  const filled = photos.filter(Boolean);
  const ids = filled.map((_, i) => `photo-${i}`);
  const empty = 6 - filled.length;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    const arr = [...filled];
    const [moved] = arr.splice(oldIdx, 1);
    arr.splice(newIdx, 0, moved);
    onReorder(arr);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-2">
          {filled.map((url, i) => (
            <SortablePhoto key={ids[i]} id={ids[i]} url={url} uploading={uploading === i} onRemove={() => onRemove(i)} />
          ))}
          {Array.from({ length: empty }).map((_, i) => (
            <button key={`e-${i}`} onClick={() => onAddClick(filled.length + i)} className="aspect-square rounded-xl border border-dashed border-ink/15 bg-cream flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/20"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

const NEIGHBORHOODS = [
  "Centrum", "Jordaan", "De Pijp", "Oost", "West", "Noord", "Zuid",
  "Oud-West", "Oud-Zuid", "Amstel", "Westerpark", "Bos en Lommer",
  "Rivierenbuurt", "Zuidas", "IJburg",
];

const INTERESTS = [
  "specialty coffee", "cycling", "art", "vinyl", "reading", "yoga",
  "cooking", "live music", "running", "photography", "design", "travel",
  "natural wine", "cinema", "museums", "climbing", "festivals", "podcasts",
  "sports", "tennis", "padel", "football", "surfing", "skating",
];

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, profile, refreshProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // YYYY-MM-DD
  const [bio, setBio] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  // Rick: separate "lives in" (neighborhood) from "comes from" (hometown).
  const [hometown, setHometown] = useState("");
  const [heightCm, setHeightCm] = useState<string>(""); // string so empty input is allowed
  const [languages, setLanguages] = useState<string[]>([]);
  // Optional career fields per Rick
  const [work, setWork] = useState("");
  const [company, setCompany] = useState("");
  const [education, setEducation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profileSong, setProfileSong] = useState("");
  const [coffeeOrder, setCoffeeOrder] = useState("");
  const [prompts, setPrompts] = useState<{ question: string; answer: string }[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  // Quick-edit a single prompt from view mode (Matthijs: "tap → swap")
  const [quickEditIdx, setQuickEditIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setAge(profile.age?.toString() || "");
      setDateOfBirth(profile.dateOfBirth || "");
      setBio(profile.bio || "");
      setNeighborhood(profile.neighborhood || "");
      setHometown(profile.hometown || "");
      setHeightCm(profile.heightCm ? String(profile.heightCm) : "");
      setLanguages(profile.languages || []);
      setWork(profile.work || "");
      setCompany(profile.company || "");
      setEducation(profile.education || "");
      setInterests(profile.interests || []);
      setLookingFor(profile.lookingFor || "");
      setGender(profile.gender || "");
      setGenderPreference(profile.genderPreference || []);
      setPhotos(profile.photos || []);
      setProfileSong(profile.profileSong || "");
      setCoffeeOrder(profile.coffeeOrder || "");
      setPrompts(profile.prompts || []);
      setAgeRange(profile.ageRange || [18, 99]);
    }
  }, [profile]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !firebaseUser) return;
    setUploadError(null);
    const newPhotos = [...photos];
    let slot = activeSlot;
    const { uploadUserPhoto: upload, validatePhotoFile, PhotoUploadError } = await import("@/lib/storage");

    for (let i = 0; i < files.length && slot < 6; i++) {
      while (slot < 6 && newPhotos[slot]) slot++;
      if (slot >= 6) break;

      // Pre-validate before upload — fail fast with user-friendly message
      try {
        validatePhotoFile(files[i]);
      } catch (err) {
        if (err instanceof PhotoUploadError) {
          setUploadError(err.message);
          setTimeout(() => setUploadError(null), 5000);
        }
        continue;
      }

      setUploading(slot);
      try {
        const url = await upload(firebaseUser.uid, files[i], slot);
        newPhotos[slot] = url;
        setPhotos([...newPhotos]);
        // Persist incrementally — if something fails later, we still save what worked
        await updateUser(firebaseUser.uid, { photos: newPhotos.filter(Boolean) });
      } catch (err) {
        if (err instanceof PhotoUploadError) {
          setUploadError(err.message);
        } else {
          setUploadError("Upload failed. Check your connection and try again.");
        }
        setTimeout(() => setUploadError(null), 5000);
        setUploading(null);
        // Stop the loop on upload failure — user can retry
        break;
      }
      slot++;
    }
    setUploading(null);
    await refreshProfile();
    e.target.value = "";
  }

  async function removePhoto(index: number) {
    if (!firebaseUser) return;
    try {
      await deleteUserPhoto(firebaseUser.uid, index);
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      await updateUser(firebaseUser.uid, { photos: newPhotos });
      await refreshProfile();
    } catch (err) { console.error(err); }
  }

  async function saveAll() {
    if (!firebaseUser) return;
    // Guardrails — block save on known invalid states
    // Rick: prompts blijven optioneel — geen minimum-validatie meer.
    if (profileSong && !isValidSpotifyUrl(profileSong)) {
      setUploadError("Your Spotify link isn't valid. Remove it or fix it first.");
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    // Required-field guardrails per Rick: age, height, languages
    const heightNum = parseInt(heightCm);
    if (!age || parseInt(age) < 18) {
      setUploadError("Age is required (18+).");
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    if (!heightNum || heightNum < HEIGHT_MIN_CM || heightNum > HEIGHT_MAX_CM) {
      setUploadError(`Height is required (${HEIGHT_MIN_CM}–${HEIGHT_MAX_CM} cm).`);
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    if (languages.length === 0) {
      setUploadError("Pick at least one language you speak.");
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        displayName, age: parseInt(age) || 25, bio: bio || "", neighborhood, interests,
        lookingFor: lookingFor as "dating" | "friends" | "open", gender, genderPreference,
        coffeeOrder: coffeeOrder || "",
        ageRange,
        heightCm: heightNum,
        languages,
      };
      if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
      if (hometown) updates.hometown = hometown;
      if (work) updates.work = work;
      if (company) updates.company = company;
      if (education) updates.education = education;
      if (profileSong) updates.profileSong = profileSong;
      if (prompts.length > 0) updates.prompts = prompts;
      await updateUser(firebaseUser.uid, updates);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setIsEditMode(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (!profile) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="aspect-[4/5] rounded-2xl bg-stripe-white animate-pulse mb-4" />
      </div>
    );
  }

  const validPhotos = photos.filter(Boolean);

  // ─── EDIT MODE ───
  if (isEditMode) {
    return (
      <div className="max-w-sm mx-auto pb-28 bg-cream min-h-dvh">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-wine/5" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center justify-between px-5 py-3">
            <button onClick={() => setIsEditMode(false)} className="text-gray text-sm">Cancel</button>
            <h2 className="font-display text-ink text-sm">Edit Profile</h2>
            <button onClick={saveAll} className="text-wine text-sm font-medium">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />

        {/* Photos */}
        <section className="px-5 py-5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Photos</h3>
          <PhotoGridEditor
            photos={photos}
            uploading={uploading}
            onRemove={removePhoto}
            onReorder={async (newPhotos) => {
              setPhotos(newPhotos);
              if (firebaseUser) {
                await updateUser(firebaseUser.uid, { photos: newPhotos.filter(Boolean) });
                await refreshProfile();
              }
            }}
            onAddClick={(slot) => { setActiveSlot(slot); fileInputRef.current?.click(); }}
          />
          {uploadError && (
            <div className="mt-3 bg-coral/10 border border-coral/30 rounded-xl px-4 py-2.5 text-coral text-xs">
              {uploadError}
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine/60">
              <polyline points="5 9 2 12 5 15" />
              <polyline points="9 5 12 2 15 5" />
              <polyline points="15 19 12 22 9 19" />
              <polyline points="19 9 22 12 19 15" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
            <p className="text-[11px] text-wine/70 font-medium">Hold and drag to reorder</p>
          </div>
        </section>

        {/* Basics — name, DOB-derived age, height, lives in, comes from */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Basics</h3>
          <div className="space-y-3">
            <Field label="First name *">
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="First name" className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
            </Field>
            <Field label="Date of birth *">
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  // Auto-derive age — Rick: leeftijd past zich automatisch aan
                  if (e.target.value) {
                    const dob = new Date(e.target.value);
                    const diff = Date.now() - dob.getTime();
                    const ageNum = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
                    setAge(String(ageNum));
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-white text-ink focus:outline-none focus:ring-1 focus:ring-wine/20"
              />
              {age && <p className="text-gray-light text-[11px] mt-1">Age: {age}</p>}
            </Field>
            <Field label="Height (cm) *">
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                min={HEIGHT_MIN_CM}
                max={HEIGHT_MAX_CM}
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20"
              />
              {heightCm && Number(heightCm) >= HEIGHT_MIN_CM && Number(heightCm) <= HEIGHT_MAX_CM && (
                <p className="text-gray-light text-[11px] mt-1">{formatHeight(Number(heightCm))}</p>
              )}
            </Field>
            <Field label="Lives in *">
              <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white text-ink focus:outline-none focus:ring-1 focus:ring-wine/20 appearance-none">
                {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Comes from">
              <input
                type="text"
                value={hometown}
                onChange={(e) => setHometown(e.target.value.slice(0, 60))}
                placeholder="Cape Town, Milan, Utrecht…"
                className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20"
              />
            </Field>
          </div>
        </section>

        {/* Languages — required */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Languages spoken *</h3>
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
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    active ? "bg-wine text-cream font-medium" : "bg-white text-gray hover:bg-stripe-white"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          {languages.length > 0 && (
            <p className="text-gray-light text-[11px] mt-2">{languages.length} selected</p>
          )}
        </section>

        {/* Work & Education — optional */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Work & Education</h3>
          <p className="text-gray-light text-[11px] mb-3">Optional — leave blank if you&apos;d rather not say.</p>
          <div className="space-y-3">
            <Field label="What you do">
              <input type="text" value={work} onChange={(e) => setWork(e.target.value.slice(0, 60))} placeholder="Product designer, chef, founder…" className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
            </Field>
            <Field label="Company">
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value.slice(0, 60))} placeholder="ING, Booking, freelance…" className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
            </Field>
            <Field label="Education">
              <input type="text" value={education} onChange={(e) => setEducation(e.target.value.slice(0, 60))} placeholder="University of Amsterdam, TU Delft…" className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
            </Field>
          </div>
        </section>

        {/* Bio */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">About</h3>
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 300))} rows={3} placeholder="Write something about yourself..." className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20 resize-none" />
          <p className="text-gray-light text-[10px] text-right mt-1">{bio.length}/300</p>
        </section>

        {/* Coffee order */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Coffee Order</h3>
          <input type="text" value={coffeeOrder} onChange={(e) => setCoffeeOrder(e.target.value.slice(0, 50))} placeholder="Oat flat white, espresso, chai latte..." className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
        </section>

        {/* Interests */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button key={i} onClick={() => {
                setInterests((prev) => prev.includes(i) ? prev.filter((v) => v !== i) : [...prev, i]);
              }} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${interests.includes(i) ? "bg-wine text-cream font-medium" : "bg-white text-gray hover:bg-stripe-white"}`}>
                {i}
              </button>
            ))}
          </div>
        </section>

        {/* Prompts */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Prompts</h3>
          <PromptPicker existingPrompts={prompts} onSave={(p) => setPrompts(p)} />
        </section>

        {/* Profile song */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Your Song</h3>
          <input
            type="url"
            value={profileSong}
            onChange={(e) => setProfileSong(e.target.value)}
            placeholder="Paste a Spotify song link"
            aria-label="Spotify song URL"
            className={`w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 ${
              profileSong && !isValidSpotifyUrl(profileSong)
                ? "ring-1 ring-coral/40 focus:ring-coral/40"
                : "focus:ring-wine/20"
            }`}
          />
          {profileSong && !isValidSpotifyUrl(profileSong) ? (
            <p className="text-coral text-[11px] mt-1.5">
              That doesn&apos;t look like a Spotify track link. Copy the share URL from Spotify.
            </p>
          ) : (
            <p className="text-gray-light text-[10px] mt-1">open.spotify.com/track/...</p>
          )}
        </section>

        {/* Preferences moved to /preferences — Rick: dedicated page */}
        <section className="px-5 py-4 border-t border-wine/5">
          <button
            type="button"
            onClick={() => router.push("/preferences")}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white hover:bg-stripe-white transition-colors text-left"
          >
            <div>
              <p className="text-ink font-medium text-sm">Preferences</p>
              <p className="text-gray-light text-[11px] mt-0.5">Who you&apos;d like to meet, age range, dating or friends mode</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-wine">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </section>

        {/* Sign out */}
        <section className="px-5 py-6 border-t border-wine/5">
          <button onClick={handleSignOut} className="w-full py-3 rounded-full border border-ink/10 text-gray text-sm hover:bg-stripe-white transition-colors">
            Sign out
          </button>
        </section>
      </div>
    );
  }

  // ─── VIEW MODE (default) — your own BLEND home ───
  // Personal identity page. NOT a preview of your photos — tap the hero to
  // see them all in the viewer. Editorial, BLEND-themed, warm.
  const profileNumber = firebaseUser ? getProfileNumber(firebaseUser.uid) : "";
  const memberSince = profile.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "";

  function openViewerAt(idx: number) {
    setPhotoIndex(idx);
    setPhotoViewerOpen(true);
  }

  return (
    <div className="max-w-sm mx-auto pb-28 bg-cream relative">
      {/* ───── Hero photo ───── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stripe-white">
        {validPhotos.length > 0 ? (
          <>
            <ShimmerImage
              src={validPhotos[0]}
              alt={profile.displayName}
              fill
              className="object-cover select-none"
              priority
              draggable={false}
            />

            <button
              type="button"
              className="absolute inset-0 z-10"
              onClick={() => openViewerAt(0)}
              aria-label="View photo fullscreen"
              style={{ WebkitTapHighlightColor: "transparent" }}
            />

            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent z-10 pointer-events-none" />

            <div className="absolute bottom-0 inset-x-0 p-6 pb-7 z-10 pointer-events-none">
              <h1 className="text-[2rem] font-display text-white leading-tight flex items-center gap-2 flex-wrap">
                <span>{profile.displayName}, {profile.age}</span>
                {profile.verificationStatus === "verified" && (
                  <VerifiedBadge size="lg" />
                )}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/65">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-white/65 text-sm">{profile.neighborhood}</span>
              </div>
            </div>

            {/* Subtle "tap to view photos" hint — only if >1 photo */}
            {validPhotos.length > 1 && (
              <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full bg-ink/35 backdrop-blur-md text-white text-[10px] font-medium pointer-events-none">
                ☕ {validPhotos.length} photos
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-wine/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-wine">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <button onClick={() => setIsEditMode(true)} className="text-wine text-sm font-medium">
              Add your first photo
            </button>
          </div>
        )}

        <button
          onClick={() => setIsEditMode(true)}
          className="absolute right-4 z-30 bg-white/95 backdrop-blur-md text-wine px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg uppercase tracking-wider active:scale-95 transition-transform"
          style={{ top: "max(1.75rem, calc(env(safe-area-inset-top) + 1.25rem))" }}
        >
          Edit
        </button>
      </div>

      {/* Photo viewer — portaled */}
      <AnimatePresence>
        {photoViewerOpen && validPhotos.length > 0 && (
          <PhotoViewer
            photos={validPhotos}
            initialIndex={photoIndex}
            onClose={() => setPhotoViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ───── BLEND member card — signature BLEND moment ─────
          A "membership" card feel. Wine on cream, two-tone logo dots,
          profile number on the right, joined date underneath. Tells the
          user: you are part of something curated. */}
      <div className="px-5 pt-6 relative">
        <CoffeeRing variant="ring" className="-top-2 -right-3 w-24 h-24" opacity={0.05} rotate={18} />
        <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Top stripe: BLEND wordmark + profile number */}
          <div className="bg-wine text-cream px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Two overlapping circles — the BLEND logo, condensed */}
              <svg width="22" height="14" viewBox="0 0 80 60" aria-hidden="true">
                <circle cx="28" cy="30" r="22" fill="#e8dfd1" opacity="0.85" />
                <circle cx="52" cy="30" r="22" fill="#e8dfd1" opacity="0.55" />
              </svg>
              <span className="font-display text-base tracking-wide">BLEND</span>
            </div>
            <span className="font-mono text-[11px] tracking-[0.2em] text-cream/80">
              {profileNumber}
            </span>
          </div>
          {/* Body — vitals in a clean grid */}
          <div className="px-5 py-5 grid grid-cols-2 gap-x-4 gap-y-4">
            {profile.hometown && <Vital label="From" value={profile.hometown} />}
            {profile.heightCm && <Vital label="Height" value={formatHeight(profile.heightCm)} />}
            {profile.work && <Vital label="Work" value={profile.work + (profile.company ? ` @ ${profile.company}` : "")} />}
            {profile.education && <Vital label="Education" value={profile.education} />}
            {memberSince && <Vital label="Joined" value={memberSince} />}
            {/* Languages on their own full-width row — they're typically long
                and Matthijs flagged the truncation as a visible bug. */}
            {profile.languages && profile.languages.length > 0 && (
              <Vital
                label="Languages"
                value={profile.languages.join(" · ")}
                fullWidth
              />
            )}
          </div>
        </div>
      </div>

      {/* ───── Coffee order — signature element on its own ───── */}
      {profile.coffeeOrder && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm">
            <div className="w-10 h-10 rounded-full bg-wine/8 flex items-center justify-center shrink-0">
              <span className="text-lg">☕</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">Go-to coffee</p>
              <p className="text-ink font-medium text-[15px]" dir="auto">{profile.coffeeOrder}</p>
            </div>
          </div>
        </div>
      )}

      {/* ───── Bio — clean editorial block with left wine accent ───── */}
      {profile.bio && (
        <div className="px-5 pt-6">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-[10px] text-gray uppercase tracking-[0.25em] font-semibold mb-2">
              About
            </p>
            <div className="relative pl-4 border-l-2 border-wine/30">
              <p
                className="text-ink text-[16px] leading-[1.7] whitespace-pre-wrap break-words font-body"
                dir="auto"
              >
                {profile.bio}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ───── Prompts — tap any card to quick-edit it ───── */}
      {profile.prompts && profile.prompts.length > 0 && (
        <div className="px-5 pt-6">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] text-gray uppercase tracking-[0.25em] font-semibold">
              Prompts
            </p>
            <p className="text-[10px] text-gray-light tracking-wide">tap to edit</p>
          </div>
          <div className="space-y-3">
            {profile.prompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuickEditIdx(i)}
                className="block w-full text-left bg-white rounded-2xl shadow-sm px-5 py-4 active:scale-[0.99] hover:shadow-md transition-all"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-wine/85 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5">
                      {p.question}
                    </p>
                    <p className="text-ink text-[16px] leading-snug break-words font-display" dir="auto">
                      {p.answer}
                    </p>
                  </div>
                  {/* Pencil icon — tells the user this is editable */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-wine/40 shrink-0 mt-1"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick-edit prompt modal */}
      {profile.prompts && quickEditIdx !== null && (
        <QuickPromptEdit
          open={quickEditIdx !== null}
          current={profile.prompts[quickEditIdx]}
          allPrompts={profile.prompts}
          onSave={async (next) => {
            if (!firebaseUser) return;
            const updated = [...(profile.prompts || [])];
            updated[quickEditIdx] = next;
            await updateUser(firebaseUser.uid, { prompts: updated });
            await refreshProfile();
          }}
          onClose={() => setQuickEditIdx(null)}
        />
      )}

      {/* ───── Profile song — wine card statement ───── */}
      {profile.profileSong && (
        <div className="px-5 pt-5">
          <div className="bg-wine rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-burgundy/30" />
            <div className="relative">
              <p className="text-cream/50 text-[10px] font-semibold uppercase tracking-[0.25em] mb-3">My song</p>
              <SpotifyPlayer trackUrl={profile.profileSong} />
            </div>
          </div>
        </div>
      )}

      {/* ───── Interests — tag row with a label ───── */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="px-5 pt-6">
          <p className="text-[10px] text-gray uppercase tracking-[0.25em] font-semibold mb-3">Interests</p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="px-3.5 py-1.5 rounded-full bg-wine/8 text-ink text-[13px] font-medium border border-wine/10">{interest}</span>
            ))}
          </div>
        </div>
      )}

      {/* ───── Editorial tagline — BLEND signature close ───── */}
      <div className="px-5 pt-10 pb-2 relative">
        <CoffeeRing variant="drip" className="-bottom-4 -left-3 w-20 h-20" opacity={0.05} rotate={-12} />
        <div className="relative text-center">
          <p className="text-[10px] text-gray uppercase tracking-[0.35em] font-mono mb-2">
            ☕  ☕
          </p>
          <p className="text-ink font-display text-lg leading-snug max-w-[260px] mx-auto">
            Less swiping.
            <br />
            More sipping.
          </p>
        </div>
      </div>

      {/* Share + actions */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={async () => {
            const url = `https://bl-nd.nl/p/${firebaseUser?.uid}`;
            // Prefer native share sheet (iOS/Android)
            if (typeof navigator !== "undefined" && "share" in navigator) {
              try {
                await navigator.share({
                  title: `${profile.displayName} on BLEND`,
                  text: "Check out my profile on BLEND ☕",
                  url,
                });
                return;
              } catch (err) {
                // User cancelled share sheet — that's fine, don't fall back
                if ((err as Error)?.name === "AbortError") return;
              }
            }
            // Clipboard fallback
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
              try {
                await navigator.clipboard.writeText(url);
                setSavedMessage("Link copied ✓");
                setSaved(true);
                setTimeout(() => { setSaved(false); setSavedMessage(null); }, 2000);
                return;
              } catch {
                // Clipboard denied
              }
            }
            // Last-resort: show the URL in a prompt for manual copy
            if (typeof window !== "undefined") {
              window.prompt("Copy your profile link:", url);
            }
          }}
          className="w-full py-4 rounded-full bg-wine text-cream text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share profile
        </button>
      </div>

      {/* Verification CTA — different state per status */}
      <div className="px-5 pt-1 pb-3">
        {profile.verificationStatus === "verified" ? (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-stripe-white">
            <VerifiedBadge size="md" />
            <div className="flex-1">
              <p className="text-ink text-sm font-medium">Verified profile</p>
              <p className="text-gray-light text-xs">Other users see your blue checkmark</p>
            </div>
          </div>
        ) : profile.verificationStatus === "pending" ? (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-stripe-white">
            <div className="w-5 h-5 rounded-full border-2 border-wine/30 border-t-wine animate-spin" />
            <div className="flex-1">
              <p className="text-ink text-sm font-medium">Verification under review</p>
              <p className="text-gray-light text-xs">We&apos;ll let you know within 24 hours</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowVerification(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-wine/[0.06] hover:bg-wine/[0.09] transition-colors text-left"
          >
            <VerifiedBadge size="md" />
            <div className="flex-1">
              <p className="text-ink text-sm font-medium">
                {profile.verificationStatus === "rejected"
                  ? "Verification didn't match — try again"
                  : "Get a verified checkmark"}
              </p>
              <p className="text-gray-light text-xs">30-second selfie · builds trust before meets</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-wine">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Verification modal */}
      {showVerification && firebaseUser && (
        <VerificationFlow
          uid={firebaseUser.uid}
          onClose={() => {
            setShowVerification(false);
            refreshProfile();
          }}
        />
      )}

      {/* About + How it works + Sign out */}
      <div className="px-5 pb-6 pt-2 space-y-2">
        <a
          href="https://bl-nd.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-3 px-4 rounded-xl bg-stripe-white"
        >
          <div className="flex items-center gap-3">
            <svg width="18" height="14" viewBox="0 0 80 60">
              <circle cx="28" cy="30" r="22" fill="#722F37" opacity="0.6" />
              <circle cx="52" cy="30" r="22" fill="#722F37" opacity="0.6" />
            </svg>
            <span className="text-ink text-sm font-medium">About BLEND</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
        <button
          onClick={() => {
            localStorage.removeItem("blend_welcomed");
            window.location.reload();
          }}
          className="flex items-center justify-between py-3 px-4 rounded-xl bg-stripe-white w-full"
        >
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#722F37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="text-ink text-sm font-medium">How BLEND works</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button onClick={handleSignOut} className="w-full py-3 text-gray-light text-xs mt-2">Sign out</button>
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 text-red/50 text-xs mt-1">Delete account</button>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-display text-xl text-ink mb-2">Delete your account?</h3>
              <p className="text-gray text-sm leading-relaxed mb-6">
                This will permanently delete your profile, photos, blends, meets, and all messages. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-full border border-ink/10 text-ink text-sm font-medium"
                >
                  Keep account
                </button>
                <button
                  onClick={async () => {
                    if (!firebaseUser) return;
                    setDeleting(true);
                    try {
                      const { deleteAccount } = await import("@/lib/deleteAccount");
                      await deleteAccount(firebaseUser.uid);
                      router.push("/");
                    } catch (err) {
                      console.error("Delete error:", err);
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-full bg-red text-white text-sm font-medium disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete forever"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 inset-x-0 flex justify-center z-50 pointer-events-none"
          >
            <div className="bg-ink text-cream px-5 py-2.5 rounded-full text-sm font-medium shadow-lg">
              {savedMessage || "Saved ✓"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact labelled-field helper for the edit form
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gray mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// Vitals item — lives-in, from, height, etc. on profile view.
// Long values wrap to multiple lines rather than truncating (Matthijs:
// "Spanish, English, Dutch" was getting cut to "Spanis…"). Pass
// `fullWidth` for items that need the whole row, e.g. languages.
function Vital({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">{label}</p>
      <p className="text-ink text-[14px] mt-0.5 leading-snug break-words" title={value}>
        {value}
      </p>
    </div>
  );
}
