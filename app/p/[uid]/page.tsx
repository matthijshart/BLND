"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/db";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";
import type { User } from "@/types";

export default function PublicProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    async function load() {
      if (!params.uid) return;
      const user = await getUser(params.uid as string);
      setProfile(user);
      setLoading(false);
    }
    load();
  }, [params.uid]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-wine/20 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-display text-ink mb-3">Profile not found</h1>
        <p className="text-gray mb-8">This person might have removed their profile.</p>
        <Link
          href="/"
          className="px-8 py-3 rounded-full bg-wine text-cream font-medium"
        >
          Discover BLEND
        </Link>
      </div>
    );
  }

  const validPhotos = profile.photos?.filter(Boolean) || [];

  return (
    <div className="min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <Link href="/" className="font-display text-xl text-ink tracking-wide">
          BLEND
        </Link>
        <Link
          href="/signup"
          className="px-5 py-2 rounded-full bg-wine text-cream text-sm font-medium"
        >
          Join BLEND
        </Link>
      </div>

      <div className="max-w-sm mx-auto pb-12">
        {/* Photo */}
        {validPhotos.length > 0 && (
          <div className="relative aspect-[3/4] mx-4 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={validPhotos[photoIndex]}
              alt={profile.displayName}
              fill
              className="object-cover"
              priority
            />

            {/* Photo dots */}
            {validPhotos.length > 1 && (
              <div className="absolute top-4 inset-x-0 flex gap-1 px-4 z-10">
                {validPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`flex-1 h-[3px] rounded-full ${
                      i === photoIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap zones */}
            {validPhotos.length > 1 && (
              <>
                <button
                  className="absolute left-0 top-0 w-1/3 h-full z-10"
                  onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))}
                />
                <button
                  className="absolute right-0 top-0 w-1/3 h-full z-10"
                  onClick={() => setPhotoIndex(Math.min(validPhotos.length - 1, photoIndex + 1))}
                />
              </>
            )}

            {/* Gradient + name */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent z-5" />
            <div className="absolute bottom-0 inset-x-0 p-6 z-10">
              <h1 className="text-3xl font-display text-white">
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
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="px-6 mt-6">
            <p className="text-ink-mid leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Coffee order */}
        {profile.coffeeOrder && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
            <span className="text-xl">☕</span>
            <div>
              <p className="text-[10px] text-gray uppercase tracking-wider">Their order</p>
              <p className="text-ink text-[15px] font-medium">{profile.coffeeOrder}</p>
            </div>
          </div>
        )}

        {/* Prompts */}
        {profile.prompts && profile.prompts.length > 0 && (
          <div className="px-6 mt-4 space-y-2">
            {profile.prompts.map((p, i) => (
              <div key={i} className="bg-wine/5 rounded-xl p-4">
                <p className="text-wine text-xs font-medium italic mb-1">{p.question}</p>
                <p className="text-ink text-[15px]">{p.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Profile song */}
        {profile.profileSong && (
          <div className="px-6 mt-4">
            <p className="text-xs text-gray uppercase tracking-wider font-medium mb-2">Their song</p>
            <SpotifyPlayer trackUrl={profile.profileSong} />
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="px-6 mt-4">
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-wine/10 text-wine text-xs font-medium">
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-6 mt-10">
          <div className="bg-wine rounded-2xl p-6 text-center">
            <h2 className="text-2xl font-display text-cream mb-2">
              Want to meet {profile.displayName}?
            </h2>
            <p className="text-cream/60 text-sm mb-5">
              Join BLEND — where dates begin over coffee.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 rounded-full bg-cream text-wine font-medium hover:bg-stripe-white transition-colors"
            >
              Join BLEND
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
