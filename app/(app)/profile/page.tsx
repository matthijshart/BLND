"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateUser } from "@/lib/db";
import { uploadUserPhoto, deleteUserPhoto } from "@/lib/storage";
import { signOut } from "@/lib/auth";
import Image from "next/image";
import { PromptPicker } from "@/components/prompts/PromptPicker";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";
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
    const newPhotos = [...photos];
    let slot = activeSlot;
    for (let i = 0; i < files.length && slot < 6; i++) {
      while (slot < 6 && newPhotos[slot]) slot++;
      if (slot >= 6) break;
      setUploading(slot);
      try {
        const { uploadUserPhoto: upload } = await import("@/lib/storage");
        const url = await upload(firebaseUser.uid, files[i], slot);
        newPhotos[slot] = url;
        setPhotos([...newPhotos]);
      } catch (err) { console.error(err); }
      slot++;
    }
    setUploading(null);
    await updateUser(firebaseUser.uid, { photos: newPhotos.filter(Boolean) });
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
    setSaving(true);
    try {
      await updateUser(firebaseUser.uid, {
        displayName, age: parseInt(age), bio, neighborhood, interests,
        lookingFor: lookingFor as "dating" | "friends" | "open", gender, genderPreference, coffeeOrder,
        profileSong: profileSong || undefined,
        prompts: prompts.length > 0 ? prompts : undefined,
        ageRange,
      });
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
          <input type="url" value={profileSong} onChange={(e) => setProfileSong(e.target.value)} placeholder="Paste a Spotify song link" className="w-full px-4 py-3 rounded-xl bg-white text-ink placeholder:text-gray-light focus:outline-none focus:ring-1 focus:ring-wine/20" />
          <p className="text-gray-light text-[10px] mt-1">open.spotify.com/track/...</p>
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
            <input type="number" value={ageRange[0]} onChange={(e) => setAgeRange([parseInt(e.target.value) || 18, ageRange[1]])} min={18} max={99} className="w-20 px-3 py-2 rounded-xl bg-white text-ink text-center focus:outline-none focus:ring-1 focus:ring-wine/20" />
            <span className="text-gray">—</span>
            <input type="number" value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value) || 99])} min={18} max={99} className="w-20 px-3 py-2 rounded-xl bg-white text-ink text-center focus:outline-none focus:ring-1 focus:ring-wine/20" />
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
      {/* Photo hero — fullscreen, edge-to-edge */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {validPhotos.length > 0 ? (
          <>
            <Image
              src={validPhotos[photoIndex]}
              alt={profile.displayName}
              fill
              className="object-cover"
              priority
            />

            {/* Photo progress bars */}
            {validPhotos.length > 1 && (
              <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] inset-x-0 flex gap-1 px-3 z-20">
                {validPhotos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIndex(i)} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/25">
                    <div className={`h-full bg-white rounded-full transition-all duration-300 ${i <= photoIndex ? "w-full" : "w-0"}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Tap zones */}
            {validPhotos.length > 1 && (
              <>
                <button className="absolute left-0 top-0 w-1/3 h-full z-10" onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} />
                <button className="absolute right-0 top-0 w-1/3 h-full z-10" onClick={() => setPhotoIndex(Math.min(validPhotos.length - 1, photoIndex + 1))} />
              </>
            )}

            {/* Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent z-10 pointer-events-none" />

            {/* Name overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 z-10">
              <h1 className="text-3xl font-display text-white">{profile.displayName}, {profile.age}</h1>
              <div className="flex items-center gap-2 mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-white/60 text-sm">{profile.neighborhood}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-stripe-white flex items-center justify-center">
            <button onClick={() => { setIsEditMode(true); }} className="text-gray text-sm">Add your first photo</button>
          </div>
        )}

        {/* Edit button — floating */}
        <button
          onClick={() => setIsEditMode(true)}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-4 bg-ink/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium z-20"
        >
          Edit profile
        </button>
      </div>

      {/* Coffee order — signature element */}
      {profile.coffeeOrder && (
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-cream">
          <span className="text-xl">☕</span>
          <p className="text-ink font-medium">{profile.coffeeOrder}</p>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className="px-6 py-5">
          <p className="text-ink-mid text-[15px] leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Prompts — visual cards */}
      {profile.prompts && profile.prompts.length > 0 && (
        <div className="px-4 space-y-3 pb-4">
          {profile.prompts.map((p, i) => (
            <div key={i} className={`rounded-2xl p-5 ${i % 2 === 0 ? "bg-wine text-cream" : "bg-stripe-white text-ink"}`}>
              <p className={`text-xs font-medium italic mb-2 ${i % 2 === 0 ? "text-cream/60" : "text-wine"}`}>{p.question}</p>
              <p className={`text-lg font-display leading-snug ${i % 2 === 0 ? "text-cream" : "text-ink"}`}>{p.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* Profile song */}
      {profile.profileSong && (
        <div className="px-4 pb-4">
          <div className="bg-wine rounded-2xl p-5">
            <p className="text-cream/60 text-xs font-medium uppercase tracking-wider mb-3">My song</p>
            <SpotifyPlayer trackUrl={profile.profileSong} />
          </div>
        </div>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((interest) => (
              <span key={interest} className="px-3 py-1 rounded-full bg-cream text-ink-mid text-xs">{interest}</span>
            ))}
          </div>
        </div>
      )}

      {/* Share + actions */}
      <div className="px-4 pb-4 flex gap-3">
        <button
          onClick={() => {
            const url = `https://bl-nd.nl/p/${firebaseUser?.uid}`;
            if (navigator.share) {
              navigator.share({ title: `${profile.displayName} on BLEND`, text: "Check out my profile on BLEND ☕", url });
            } else {
              navigator.clipboard.writeText(url);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          }}
          className="flex-1 py-3.5 rounded-full bg-wine text-cream text-sm font-medium flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share profile
        </button>
        <button onClick={() => setIsEditMode(true)} className="py-3.5 px-6 rounded-full border border-ink/10 text-gray text-sm font-medium">
          Edit
        </button>
      </div>

      {/* Sign out — subtle */}
      <div className="px-4 pb-6">
        <button onClick={handleSignOut} className="w-full py-3 text-gray-light text-xs">Sign out</button>
      </div>

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
              {navigator.clipboard ? "Link copied ✓" : "Saved ✓"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
