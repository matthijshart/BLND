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
import { PromptPicker } from "@/components/prompts/PromptPicker";
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
  const [bio, setBio] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
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
  const [deleting, setDeleting] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setAge(profile.age?.toString() || "");
      setBio(profile.bio || "");
      setNeighborhood(profile.neighborhood || "");
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
    if (prompts.length < 3) {
      setUploadError("Pick at least 3 prompts before saving.");
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    if (profileSong && !isValidSpotifyUrl(profileSong)) {
      setUploadError("Your Spotify link isn't valid. Remove it or fix it first.");
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
      };
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
          <p className="text-[10px] text-gray-light text-center mt-2">Drag to reorder</p>
        </section>

        {/* Name & Age */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Basics</h3>
          <div className="space-y-3">
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="First name" className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" min={18} max={99} className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
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

        {/* Neighborhood */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Neighborhood</h3>
          <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white text-ink focus:outline-none focus:ring-1 focus:ring-wine/20 appearance-none">
            {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
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

        {/* Preferences */}
        <section className="px-5 py-4 border-t border-wine/5">
          <h3 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Preferences</h3>

          <p className="text-gray text-xs mb-2">Interested in</p>
          <div className="flex gap-2 mb-4">
            {["Men", "Women", "Everyone"].map((g) => (
              <button key={g} onClick={() => {
                setGenderPreference((prev) => prev.includes(g.toLowerCase()) ? prev.filter((v) => v !== g.toLowerCase()) : [...prev, g.toLowerCase()]);
              }} className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${genderPreference.includes(g.toLowerCase()) ? "bg-wine text-cream" : "bg-white text-gray"}`}>
                {g}
              </button>
            ))}
          </div>

          <p className="text-gray text-xs mb-2">Age range</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={ageRange[0]}
              onChange={(e) => {
                const n = parseInt(e.target.value) || 18;
                const newMin = Math.max(18, Math.min(99, n));
                // If min goes above max, push max up too
                const newMax = Math.max(newMin, ageRange[1]);
                setAgeRange([newMin, newMax]);
              }}
              onBlur={(e) => {
                const n = parseInt(e.target.value) || 18;
                if (n < 18 || n > 99) setAgeRange([18, ageRange[1]]);
              }}
              min={18}
              max={99}
              className="w-20 px-3 py-2 rounded-xl bg-white text-ink text-center focus:outline-none focus:ring-1 focus:ring-wine/20"
              aria-label="Minimum age"
            />
            <span className="text-gray">—</span>
            <input
              type="number"
              value={ageRange[1]}
              onChange={(e) => {
                const n = parseInt(e.target.value) || 99;
                const newMax = Math.max(18, Math.min(99, n));
                // If max goes below min, pull min down too
                const newMin = Math.min(newMax, ageRange[0]);
                setAgeRange([newMin, newMax]);
              }}
              onBlur={(e) => {
                const n = parseInt(e.target.value) || 99;
                if (n < 18 || n > 99) setAgeRange([ageRange[0], 99]);
              }}
              min={18}
              max={99}
              className="w-20 px-3 py-2 rounded-xl bg-white text-ink text-center focus:outline-none focus:ring-1 focus:ring-wine/20"
              aria-label="Maximum age"
            />
          </div>
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

  // ─── VIEW MODE (default) — looks like how others see you ───
  return (
    <div className="max-w-sm mx-auto pb-28">
      {/* Photo hero — premium swipeable gallery */}
      <motion.div
        className="relative aspect-[4/5] overflow-hidden bg-stripe-white"
        drag={validPhotos.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragDirectionLock
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 || info.velocity.x < -350) {
            setPhotoIndex(Math.min(validPhotos.length - 1, photoIndex + 1));
          } else if (info.offset.x > 60 || info.velocity.x > 350) {
            setPhotoIndex(Math.max(0, photoIndex - 1));
          }
        }}
      >
        {validPhotos.length > 0 ? (
          <>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={photoIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0"
              >
                <ShimmerImage
                  src={validPhotos[photoIndex]}
                  alt={profile.displayName}
                  fill
                  className="object-cover pointer-events-none select-none"
                  priority
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Photo progress bars — Instagram style */}
            {validPhotos.length > 1 && (
              <div
                className="absolute inset-x-0 flex gap-1 px-3 z-20 pointer-events-none"
                style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
              >
                {validPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
                    className="flex-1 h-[2.5px] rounded-full overflow-hidden bg-white/25 pointer-events-auto"
                  >
                    <div className={`h-full bg-white rounded-full transition-all duration-500 ${i <= photoIndex ? "w-full" : "w-0"}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Prominent nav arrows — always visible when multiple photos */}
            {validPhotos.length > 1 && (
              <>
                {photoIndex > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex - 1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center z-30 shadow-md active:scale-95 transition-transform"
                    aria-label="Previous photo"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b1520" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                {photoIndex < validPhotos.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex + 1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center z-30 shadow-md active:scale-95 transition-transform"
                    aria-label="Next photo"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b1520" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                )}
              </>
            )}

            {/* Center tap zone for fullscreen — NOT covering edges so drag/arrows still work */}
            {validPhotos.length > 1 ? (
              <button
                className="absolute left-[25%] top-[25%] w-1/2 h-1/2 z-10"
                onClick={(e) => { e.stopPropagation(); setPhotoViewerOpen(true); }}
                aria-label="View fullscreen"
              />
            ) : (
              <button
                className="absolute inset-0 z-10"
                onClick={() => validPhotos.length > 0 && setPhotoViewerOpen(true)}
                aria-label="View fullscreen"
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent z-10 pointer-events-none" />

            {/* Name + neighborhood overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 pb-7 z-10 pointer-events-none">
              <h1 className="text-[2rem] font-display text-white leading-tight">
                {profile.displayName}, {profile.age}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/65">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-white/65 text-sm">{profile.neighborhood}</span>
              </div>
            </div>
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

        {/* Edit button — floating, positioned below safe area */}
        <button
          onClick={() => setIsEditMode(true)}
          className="absolute right-4 z-30 bg-white/95 backdrop-blur-md text-wine px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg uppercase tracking-wider"
          style={{ top: "max(1.75rem, calc(env(safe-area-inset-top) + 1.25rem))" }}
        >
          Edit
        </button>
      </motion.div>

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {photoViewerOpen && validPhotos.length > 0 && (
          <PhotoViewer
            photos={validPhotos}
            initialIndex={photoIndex}
            onClose={() => setPhotoViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Coffee order — signature element, edge to edge */}
      {profile.coffeeOrder && (
        <div className="flex items-center gap-4 px-6 py-5 bg-white border-b border-cream">
          <div className="w-11 h-11 rounded-full bg-wine/8 flex items-center justify-center shrink-0">
            <span className="text-lg">☕</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">Go-to coffee</p>
            <p className="text-ink font-medium text-[15px] mt-0.5" dir="auto">{profile.coffeeOrder}</p>
          </div>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className="px-6 py-6">
          <p className="text-ink-mid text-[15px] leading-[1.65] whitespace-pre-wrap break-words" dir="auto">{profile.bio}</p>
        </div>
      )}

      {/* Prompts — premium cards */}
      {profile.prompts && profile.prompts.length > 0 && (
        <div className="px-5 pb-5 space-y-3">
          {profile.prompts.map((p, i) => (
            <div key={i} className="bg-stripe-white rounded-2xl px-5 py-4">
              <p className="text-wine text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5">{p.question}</p>
              <p className="text-ink text-[15px] leading-snug font-display break-words" dir="auto">{p.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* Profile song — premium player */}
      {profile.profileSong && (
        <div className="px-5 pb-5">
          <div className="bg-wine rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-burgundy/30" />
            <div className="relative">
              <p className="text-cream/50 text-[10px] font-semibold uppercase tracking-[0.25em] mb-3">My song</p>
              <SpotifyPlayer trackUrl={profile.profileSong} />
            </div>
          </div>
        </div>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-[10px] text-gray uppercase tracking-[0.25em] font-semibold mb-3">Interests</p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="px-3.5 py-1.5 rounded-full bg-wine/8 text-ink text-[13px] font-medium border border-wine/10">{interest}</span>
            ))}
          </div>
        </div>
      )}

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
          className="flex-1 py-4 rounded-full bg-wine text-cream text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share profile
        </button>
        <button
          onClick={() => setIsEditMode(true)}
          className="py-4 px-6 rounded-full border border-ink/10 text-ink text-sm font-medium active:scale-[0.98] transition-transform"
        >
          Edit
        </button>
      </div>

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
