"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateUser } from "@/lib/db";
import { uploadUserPhoto, deleteUserPhoto } from "@/lib/storage";
import { signOut } from "@/lib/auth";
import Image from "next/image";

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

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  // Load profile data
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
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    setUploading(activeSlot);
    try {
      const url = await uploadUserPhoto(firebaseUser.uid, file, activeSlot);
      const newPhotos = [...photos];
      newPhotos[activeSlot] = url;
      setPhotos(newPhotos);
      await updateUser(firebaseUser.uid, { photos: newPhotos });
      await refreshProfile();
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(null);
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
        <div className="h-32 rounded-2xl bg-stripe-white animate-pulse mb-4" />
        <div className="h-8 w-32 rounded-full bg-stripe-white animate-pulse mb-3" />
        <div className="h-20 rounded-2xl bg-stripe-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto pb-28">
      {/* Header */}
      <div className="px-4 pt-8 mb-6">
        <h1 className="text-2xl font-display text-ink">Profile</h1>
        <p className="text-gray text-sm mt-1">This is how others see you.</p>
      </div>

      {/* Photos grid */}
      <div className="px-4 mb-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
                className={`aspect-square rounded-2xl overflow-hidden relative transition-all ${
                  index === 0 ? "col-span-2 row-span-2" : ""
                } ${
                  photoUrl
                    ? "shadow-sm"
                    : "border-2 border-dashed border-ink/10 hover:border-ink/20 bg-stripe-white"
                }`}
              >
                {photoUrl ? (
                  <>
                    <Image
                      src={photoUrl}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {uploading === index && (
                      <div className="absolute inset-0 bg-wine/60 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-cream border-t-transparent animate-spin" />
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/60 text-white flex items-center justify-center text-xs backdrop-blur-sm">
                      ×
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-ink/20 text-2xl">+</span>
                    {index === 0 && (
                      <span className="text-ink/20 text-[10px] mt-0.5">main photo</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name & Age */}
      <section className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Basics</h2>
            {editing === "basics" ? (
              <button
                onClick={() =>
                  saveField("displayName", displayName).then(() =>
                    saveField("age", parseInt(age))
                  )
                }
                className="text-sm font-medium text-coral"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing("basics")}
                className="text-sm text-gray"
              >
                Edit
              </button>
            )}
          </div>

          {editing === "basics" ? (
            <div className="space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream text-ink placeholder:text-gray-light focus:outline-none focus:border-coral/30"
              />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                min={18}
                max={99}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream text-ink placeholder:text-gray-light focus:outline-none focus:border-coral/30"
              />
            </div>
          ) : (
            <div>
              <p className="text-ink text-lg font-medium">
                {profile.displayName}, {profile.age}
              </p>
              <p className="text-gray text-sm capitalize">{profile.gender}</p>
            </div>
          )}
        </div>
      </section>

      {/* Bio */}
      <section className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Bio</h2>
            {editing === "bio" ? (
              <button
                onClick={() => saveField("bio", bio)}
                className="text-sm font-medium text-coral"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing("bio")}
                className="text-sm text-gray"
              >
                Edit
              </button>
            )}
          </div>

          {editing === "bio" ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream text-ink placeholder:text-gray-light focus:outline-none focus:border-coral/30 resize-none"
              />
              <p className="text-gray-light text-xs text-right mt-1">{bio.length}/300</p>
            </div>
          ) : (
            <p className="text-ink-mid leading-relaxed">
              {profile.bio || "No bio yet. Tap edit to add one."}
            </p>
          )}
        </div>
      </section>

      {/* Neighborhood */}
      <section className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Neighborhood</h2>
            {editing === "neighborhood" ? (
              <button
                onClick={() => saveField("neighborhood", neighborhood)}
                className="text-sm font-medium text-coral"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing("neighborhood")}
                className="text-sm text-gray"
              >
                Edit
              </button>
            )}
          </div>

          {editing === "neighborhood" ? (
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream text-ink focus:outline-none focus:border-coral/30 appearance-none"
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <p className="text-ink-mid">{profile.neighborhood}</p>
          )}
        </div>
      </section>

      {/* Interests */}
      <section className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Interests</h2>
            {editing === "interests" ? (
              <button
                onClick={() => saveField("interests", interests)}
                className="text-sm font-medium text-coral"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing("interests")}
                className="text-sm text-gray"
              >
                Edit
              </button>
            )}
          </div>

          {editing === "interests" ? (
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    interests.includes(i)
                      ? "bg-wine text-cream font-medium"
                      : "border border-ink/10 text-gray hover:bg-cream"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.interests || []).map((i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-stripe-white text-ink-mid text-sm"
                >
                  {i}
                </span>
              ))}
              {(!profile.interests || profile.interests.length === 0) && (
                <p className="text-gray text-sm">No interests added yet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Preferences */}
      <section className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Preferences</h2>
            {editing === "preferences" ? (
              <button
                onClick={async () => {
                  await saveField("lookingFor", lookingFor);
                  await saveField("genderPreference", genderPreference);
                }}
                className="text-sm font-medium text-coral"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing("preferences")}
                className="text-sm text-gray"
              >
                Edit
              </button>
            )}
          </div>

          {editing === "preferences" ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray text-sm mb-2">Interested in</p>
                <div className="flex gap-2">
                  {["Men", "Women", "Everyone"].map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGenderPref(g.toLowerCase())}
                      className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        genderPreference.includes(g.toLowerCase())
                          ? "bg-wine text-cream"
                          : "border border-ink/10 text-gray hover:bg-cream"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray text-sm mb-2">Looking for</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Relationship", "Casual", "Friends", "Open to anything"].map((l) => {
                    const val = l === "Open to anything" ? "open" : l.toLowerCase();
                    return (
                      <button
                        key={l}
                        onClick={() => setLookingFor(val)}
                        className={`py-2.5 rounded-full text-sm font-medium transition-colors ${
                          lookingFor === val
                            ? "bg-wine text-cream"
                            : "border border-ink/10 text-gray hover:bg-cream"
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
            <div className="space-y-2">
              <p className="text-ink-mid text-sm">
                <span className="text-gray">Interested in:</span>{" "}
                {(profile.genderPreference || []).join(", ")}
              </p>
              <p className="text-ink-mid text-sm">
                <span className="text-gray">Looking for:</span>{" "}
                <span className="capitalize">{profile.lookingFor}</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Save feedback */}
      {saved && (
        <div className="fixed top-6 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-ink text-cream px-5 py-2.5 rounded-full text-sm font-medium shadow-lg">
            Saved ✓
          </div>
        </div>
      )}

      {/* Sign out */}
      <section className="px-4 mb-8">
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl border border-ink/10 text-gray font-medium hover:bg-stripe-white transition-colors"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
