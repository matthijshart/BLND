"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateUser } from "@/lib/db";
import { uploadUserPhoto, deleteUserPhoto } from "@/lib/storage";
import { signOut } from "@/lib/auth";
import Image from "next/image";
import { PromptPicker } from "@/components/prompts/PromptPicker";

const NEIGHBORHOODS = [
  "Centrum", "Jordaan", "De Pijp", "Oost", "West", "Noord", "Zuid",
  "Oud-West", "Oud-Zuid", "Amstel", "Westerpark", "Bos en Lommer",
  "Rivierenbuurt", "Zuidas", "IJburg",
];

const INTERESTS = [
  "specialty coffee", "cycling", "art", "vinyl", "reading", "yoga",
  "cooking", "live music", "running", "photography", "design", "travel",
  "natural wine", "cinema", "museums", "climbing", "festivals", "podcasts",
];

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, profile, refreshProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState(0);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profilePrompt, setProfilePrompt] = useState("");
  const [profileSong, setProfileSong] = useState("");
  const [coffeeOrder, setCoffeeOrder] = useState("");
  const [prompts, setPrompts] = useState<{ question: string; answer: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

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
      setProfilePrompt(profile.profilePrompt || "");
      setProfileSong(profile.profileSong || "");
      setCoffeeOrder(profile.coffeeOrder || "");
      setPrompts(profile.prompts || []);
    }
  }, [profile]);

  function toggleInterest(val: string) {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  function toggleGenderPref(val: string) {
    setGenderPreference((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !firebaseUser) return;

    const newPhotos = [...photos];
    let slotIndex = activeSlot;

    for (let i = 0; i < files.length && slotIndex < 6; i++) {
      // Find next empty slot
      while (slotIndex < 6 && newPhotos[slotIndex]) {
        slotIndex++;
      }
      if (slotIndex >= 6) break;

      setUploading(slotIndex);
      try {
        const url = await uploadUserPhoto(firebaseUser.uid, files[i], slotIndex);
        newPhotos[slotIndex] = url;
        setPhotos([...newPhotos]);
      } catch (err) {
        console.error("Upload error:", err);
      }
      slotIndex++;
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
    } catch (err) {
      console.error("Delete photo error:", err);
    }
  }

  async function saveField(field: string, value: unknown) {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateUser(firebaseUser.uid, { [field]: value });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
    setSaving(false);
    setEditing(null);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (!profile) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="aspect-[3/4] rounded-2xl bg-stripe-white animate-pulse mb-4" />
        <div className="h-6 w-40 rounded-full bg-stripe-white animate-pulse mb-2" />
        <div className="h-4 w-24 rounded-full bg-stripe-white animate-pulse" />
      </div>
    );
  }

  const validPhotos = photos.filter(Boolean);

  return (
    <div className="max-w-sm mx-auto pb-28">
      {/* Hero photo with swipeable dots */}
      <div className="relative">
        {validPhotos.length > 0 ? (
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={validPhotos[activePhotoIndex] || validPhotos[0]}
              alt={profile.displayName}
              fill
              className="object-cover"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent" />

            {/* Photo dots */}
            {validPhotos.length > 1 && (
              <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 px-4">
                {validPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`h-0.5 flex-1 rounded-full transition-all ${
                      i === activePhotoIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Arrow navigation */}
            {validPhotos.length > 1 && (
              <>
                {/* Left arrow */}
                {activePhotoIndex > 0 && (
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink/30 backdrop-blur-sm flex items-center justify-center z-10 hover:bg-ink/50 transition-colors"
                    onClick={() => setActivePhotoIndex(activePhotoIndex - 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                {/* Right arrow */}
                {activePhotoIndex < validPhotos.length - 1 && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink/30 backdrop-blur-sm flex items-center justify-center z-10 hover:bg-ink/50 transition-colors"
                    onClick={() => setActivePhotoIndex(activePhotoIndex + 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
                {/* Tap zones (invisible, for mobile) */}
                <button
                  className="absolute inset-y-0 left-0 w-1/3"
                  onClick={() => setActivePhotoIndex(Math.max(0, activePhotoIndex - 1))}
                />
                <button
                  className="absolute inset-y-0 right-0 w-1/3"
                  onClick={() => setActivePhotoIndex(Math.min(validPhotos.length - 1, activePhotoIndex + 1))}
                />
              </>
            )}

            {/* Name overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6">
              <h1 className="text-3xl font-display text-white leading-tight">
                {profile.displayName}, {profile.age}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-white/60 text-sm">{profile.neighborhood}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[3/4] bg-stripe-white flex items-center justify-center">
            <button
              onClick={() => { setActiveSlot(0); fileInputRef.current?.click(); }}
              className="flex flex-col items-center gap-2 text-gray"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-sm">Add your first photo</span>
            </button>
          </div>
        )}

        {/* Edit photos button */}
        <button
          onClick={() => setEditing(editing === "photos" ? null : "photos")}
          className="absolute top-4 right-4 bg-ink/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium z-10"
        >
          {editing === "photos" ? "Done" : "Edit photos"}
        </button>
      </div>

      {/* Photo grid editor */}
      {editing === "photos" && (
        <div className="px-4 py-4 bg-white">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const photoUrl = photos[index];
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (photoUrl) {
                      removePhoto(index);
                    } else {
                      setActiveSlot(index);
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`aspect-square rounded-xl overflow-hidden relative ${
                    photoUrl
                      ? ""
                      : "border border-dashed border-ink/15 bg-cream"
                  }`}
                >
                  {photoUrl ? (
                    <>
                      <Image src={photoUrl} alt="" fill className="object-cover" />
                      {uploading === index && (
                        <div className="absolute inset-0 bg-wine/60 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-cream border-t-transparent animate-spin" />
                        </div>
                      )}
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/50 backdrop-blur-sm text-white flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/20">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-light text-center mt-2">Tap a photo to remove, tap + to add</p>
        </div>
      )}

      {/* Stats row — like Instagram */}
      <div className="flex items-center justify-around py-4 bg-cream/50 border-b border-wine/5">
        <div className="text-center">
          <p className="text-lg font-display text-ink">{validPhotos.length}</p>
          <p className="text-[10px] text-gray uppercase tracking-wider">Photos</p>
        </div>
        <div className="w-px h-8 bg-cream" />
        <div className="text-center">
          <p className="text-lg font-display text-ink">{(profile.interests || []).length}</p>
          <p className="text-[10px] text-gray uppercase tracking-wider">Interests</p>
        </div>
        <div className="w-px h-8 bg-cream" />
        <div className="text-center">
          <p className="text-lg font-display text-ink capitalize">{profile.lookingFor}</p>
          <p className="text-[10px] text-gray uppercase tracking-wider">Looking for</p>
        </div>
      </div>

      {/* Bio section */}
      <section className="px-5 py-5 bg-cream/50 border-b border-wine/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray uppercase tracking-wider font-medium">About</h2>
          {editing === "bio" ? (
            <button onClick={() => saveField("bio", bio)} className="text-xs font-medium text-wine">
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button onClick={() => setEditing("bio")} className="text-xs text-wine font-medium">
              Edit
            </button>
          )}
        </div>
        {editing === "bio" ? (
          <div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              rows={3}
              className="w-full px-0 py-0 text-ink text-[15px] leading-relaxed bg-transparent border-none focus:outline-none resize-none placeholder:text-gray-light"
              placeholder="Write something about yourself..."
            />
            <p className="text-gray-light text-[10px] text-right">{bio.length}/300</p>
          </div>
        ) : (
          <p className="text-ink text-[15px] leading-relaxed">
            {profile.bio || <span className="text-gray-light italic">No bio yet...</span>}
          </p>
        )}
      </section>

      {/* Coffee order */}
      <section className="px-5 py-5 bg-cream/50 border-b border-wine/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray uppercase tracking-wider font-medium">Coffee Order</h2>
          {editing === "coffee" ? (
            <button onClick={() => saveField("coffeeOrder", coffeeOrder)} className="text-xs font-medium text-wine">
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button onClick={() => setEditing("coffee")} className="text-xs text-wine font-medium">
              Edit
            </button>
          )}
        </div>
        {editing === "coffee" ? (
          <input
            type="text"
            value={coffeeOrder}
            onChange={(e) => setCoffeeOrder(e.target.value.slice(0, 50))}
            placeholder="Oat flat white, espresso, chai latte..."
            className="w-full px-0 py-0 text-ink text-[15px] bg-transparent border-none focus:outline-none placeholder:text-gray-light"
          />
        ) : (
          <p className="text-ink text-[15px]">
            {profile.coffeeOrder || <span className="text-gray-light italic">No order yet...</span>}
          </p>
        )}
      </section>

      {/* Prompts */}
      <section className="px-5 py-5 bg-cream/50 border-b border-wine/5">
        <h2 className="text-xs text-gray uppercase tracking-wider font-medium mb-3">Prompts</h2>
        <PromptPicker
          existingPrompts={prompts}
          onSave={async (p) => {
            setPrompts(p);
            await saveField("prompts", p);
          }}
          saving={saving}
        />
      </section>

      {/* Profile song */}
      <section className="px-5 py-5 bg-cream/50 border-b border-wine/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray uppercase tracking-wider font-medium">My Song</h2>
          {editing === "song" ? (
            <button onClick={() => saveField("profileSong", profileSong)} className="text-xs font-medium text-wine">
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button onClick={() => setEditing("song")} className="text-xs text-wine font-medium">
              Edit
            </button>
          )}
        </div>
        {editing === "song" ? (
          <div>
            <input
              type="url"
              value={profileSong}
              onChange={(e) => setProfileSong(e.target.value)}
              placeholder="Paste a Spotify song link"
              className="w-full px-0 py-0 text-ink text-[15px] bg-transparent border-none focus:outline-none placeholder:text-gray-light"
            />
            <p className="text-gray-light text-[10px] mt-1">open.spotify.com/track/...</p>
          </div>
        ) : profile.profileSong ? (
          <iframe
            src={`https://open.spotify.com/embed/track/${profile.profileSong.split("/track/")[1]?.split("?")[0]}?theme=0`}
            width="100%"
            height="80"
            allow="encrypted-media"
            className="rounded-xl border-0"
          />
        ) : (
          <p className="text-gray-light text-[15px] italic">No song yet...</p>
        )}
      </section>

      {/* Interests */}
      <section className="px-5 py-5 bg-cream/50 border-b border-wine/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-gray uppercase tracking-wider font-medium">Interests</h2>
          {editing === "interests" ? (
            <button onClick={() => saveField("interests", interests)} className="text-xs font-medium text-wine">
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button onClick={() => setEditing("interests")} className="text-xs text-wine font-medium">
              Edit
            </button>
          )}
        </div>
        {editing === "interests" ? (
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  interests.includes(i)
                    ? "bg-wine text-cream"
                    : "bg-cream text-ink-mid hover:bg-stripe-white"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(profile.interests || []).map((i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-cream text-ink-mid text-xs">
                {i}
              </span>
            ))}
            {(!profile.interests || profile.interests.length === 0) && (
              <span className="text-gray-light text-xs italic">No interests yet...</span>
            )}
          </div>
        )}
      </section>

      {/* Details */}
      <section className="px-5 py-5 bg-cream/50 border-b border-wine/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-gray uppercase tracking-wider font-medium">Details</h2>
          {editing === "details" ? (
            <button
              onClick={async () => {
                await saveField("neighborhood", neighborhood);
                await saveField("lookingFor", lookingFor);
                await saveField("genderPreference", genderPreference);
              }}
              className="text-xs font-medium text-wine"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button onClick={() => setEditing("details")} className="text-xs text-wine font-medium">
              Edit
            </button>
          )}
        </div>
        {editing === "details" ? (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-gray uppercase tracking-wider mb-1.5">Neighborhood</p>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cream text-ink text-sm border-none focus:outline-none appearance-none"
              >
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray uppercase tracking-wider mb-1.5">Interested in</p>
              <div className="flex gap-1.5">
                {["Men", "Women", "Everyone"].map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenderPref(g.toLowerCase())}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      genderPreference.includes(g.toLowerCase())
                        ? "bg-wine text-cream"
                        : "bg-cream text-ink-mid"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray uppercase tracking-wider mb-1.5">Looking for</p>
              <div className="grid grid-cols-2 gap-1.5">
                {["Dating", "Friends", "Open to anything"].map((l) => {
                  const val = l === "Open to anything" ? "open" : l.toLowerCase();
                  return (
                    <button
                      key={l}
                      onClick={() => setLookingFor(val)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        lookingFor === val
                          ? "bg-wine text-cream"
                          : "bg-cream text-ink-mid"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-light shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-ink text-sm">{profile.neighborhood}</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-light shrink-0">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <span className="text-ink text-sm capitalize">{(profile.genderPreference || []).join(", ")}</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-light shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <span className="text-ink text-sm capitalize">{profile.lookingFor}</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-light shrink-0">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 10-16 0" />
              </svg>
              <span className="text-ink text-sm capitalize">{profile.gender}</span>
            </div>
          </div>
        )}
      </section>

      {/* Sign out */}
      <section className="px-5 py-6 bg-cream/50">
        <button
          onClick={handleSignOut}
          className="w-full text-center text-sm text-gray-light hover:text-gray transition-colors"
        >
          Sign out
        </button>
      </section>

      {/* Save feedback toast */}
      {saved && (
        <div className="fixed top-6 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-ink text-cream px-4 py-2 rounded-full text-xs font-medium shadow-lg">
            Saved
          </div>
        </div>
      )}
    </div>
  );
}
