"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMatchWithProfile } from "@/lib/matching";
import { submitAvailability, confirmDate } from "@/lib/scheduling";
import { getUser } from "@/lib/db";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { SlotPicker } from "@/components/match/SlotPicker";
import type { Match, User } from "@/types";
import { SpotifyPlayer } from "@/components/ui/SpotifyPlayer";
import { PhotoViewer } from "@/components/ui/PhotoViewer";
import { ReportSheet } from "@/components/ui/ReportSheet";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatHeight } from "@/lib/userHelpers";
import { triggerHaptic } from "@/lib/sounds";
import { AnimatePresence } from "framer-motion";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser, profile } = useAuthContext();
  const [match, setMatch] = useState<Match | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Real-time match subscription
  useEffect(() => {
    if (!params.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "matches", params.id as string),
      async (snap) => {
        if (!snap.exists() || !firebaseUser) return;
        const matchData = { id: snap.id, ...snap.data() } as Match;
        setMatch(matchData);

        const otherUid = matchData.users.find((u) => u !== firebaseUser.uid);
        if (otherUid && !otherUser) {
          const user = await getUser(otherUid);
          if (user) setOtherUser(user);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseUser, params.id]);

  async function handleSubmitAvailability(slots: string[]) {
    if (!firebaseUser || !match) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await submitAvailability(match.id, firebaseUser.uid, slots);
      triggerHaptic();
      setShowSlotPicker(false);
      // Result state (date proposed / waiting / no overlap) flows in
      // through the onSnapshot subscription — no local state needed.
    } catch (err) {
      console.error("Submit availability error:", err);
      setActionError("Couldn't save your times. Check your connection and try again.");
    }
    setSubmitting(false);
  }

  async function handleConfirm() {
    if (!firebaseUser || !match || !profile || !otherUser) return;
    setConfirming(true);
    setActionError(null);
    triggerHaptic();
    try {
      const result = await confirmDate(
        match.id,
        firebaseUser.uid,
        profile.neighborhood,
        otherUser.neighborhood
      );
      if (result.fullyConfirmed && result.dateId) {
        router.push(`/dates/${result.dateId}`);
      }
    } catch (err) {
      console.error("Confirm date error:", err);
      setActionError("Couldn't confirm the meet. Check your connection and try again.");
    }
    setConfirming(false);
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="aspect-[3/4] rounded-2xl bg-stripe-white animate-pulse" />
      </div>
    );
  }

  if (!match || !otherUser) {
    return (
      <div className="px-4 pt-8 text-center">
        <p className="text-gray">Blend not found.</p>
        <button
          onClick={() => router.push("/matches")}
          className="mt-4 text-wine font-medium"
        >
          Back to blends
        </button>
      </div>
    );
  }

  // Compute overlaps
  const sharedInterests = new Set(
    (profile?.interests || []).filter((i: string) => (otherUser?.interests || []).includes(i))
  );
  const myPromptMap = new Map(
    (profile?.prompts || []).map((p: { question: string; answer: string }) => [p.question, p.answer])
  );
  const sharedQuestions = new Set<string>();
  const sameAnswers = new Set<string>();
  for (const p of otherUser?.prompts || []) {
    if (myPromptMap.has(p.question)) {
      sharedQuestions.add(p.question);
      if (myPromptMap.get(p.question) === p.answer) sameAnswers.add(p.question);
    }
  }
  const sameCoffee = !!(profile?.coffeeOrder && otherUser?.coffeeOrder &&
    profile.coffeeOrder.toLowerCase() === otherUser.coffeeOrder.toLowerCase());

  const myAvailability = firebaseUser
    ? match.availability?.[firebaseUser.uid]
    : null;
  const otherAvailability = otherUser
    ? match.availability?.[otherUser.uid]
    : null;
  const iConfirmed = firebaseUser
    ? (match.confirmedBy || []).includes(firebaseUser.uid)
    : false;
  // Both submitted availability but status never advanced to date_proposed:
  // that means zero overlapping slots. Without this check, both users see
  // "Waiting on <name>" forever — a dead-end. Derived, not stored.
  const bothSubmittedNoOverlap =
    match.status === "scheduling" &&
    !!myAvailability?.length &&
    !!otherAvailability?.length;

  return (
    <div className="max-w-sm mx-auto pb-28">
      {/* Back + menu */}
      <div className="px-4 pt-6 mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/matches")}
          className="text-gray text-sm"
        >
          ← Back
        </button>
        <button
          onClick={() => setReportOpen(true)}
          aria-label="Report or block this person"
          className="w-9 h-9 rounded-full bg-stripe-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Main photo — tap to open fullscreen viewer */}
      <button
        onClick={() => setPhotoViewerOpen(true)}
        className="relative aspect-[3/4] mx-4 rounded-2xl overflow-hidden shadow-lg block w-[calc(100%-2rem)]"
      >
        <ShimmerImage
          src={otherUser.photos[0] || "/images/sipping.png"}
          alt={otherUser.displayName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6 text-left">
          <h2 className="text-3xl font-display text-white flex items-center gap-2 flex-wrap">
            <span>{otherUser.displayName}, {otherUser.age}</span>
            {otherUser.verificationStatus === "verified" && (
              <VerifiedBadge size="md" className="shrink-0" />
            )}
          </h2>
          <p className="text-white/70 text-sm mt-1">{otherUser.neighborhood}</p>
        </div>
        {/* Photo count badge */}
        {otherUser.photos.length > 1 && (
          <div className="absolute top-4 right-4 bg-ink/40 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full">
            1/{otherUser.photos.length}
          </div>
        )}
      </button>

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {photoViewerOpen && (
          <PhotoViewer
            photos={otherUser.photos.length > 0 ? otherUser.photos : ["/images/sipping.png"]}
            initialIndex={0}
            onClose={() => setPhotoViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bio */}
      <div className="px-6 mt-6">
        <p className="text-ink-mid leading-relaxed whitespace-pre-wrap break-words" dir="auto">{otherUser.bio}</p>

        {/* Vitals — same fields as the redesigned profile view */}
        {(otherUser.hometown || otherUser.heightCm || otherUser.languages?.length || otherUser.work || otherUser.education) && (
          <div className="mt-4 bg-white rounded-xl shadow-sm p-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {otherUser.hometown && (
              <div>
                <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">From</p>
                <p className="text-ink text-[14px] mt-0.5 break-words">{otherUser.hometown}</p>
              </div>
            )}
            {otherUser.heightCm && (
              <div>
                <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">Height</p>
                <p className="text-ink text-[14px] mt-0.5">{formatHeight(otherUser.heightCm)}</p>
              </div>
            )}
            {otherUser.work && (
              <div>
                <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">Work</p>
                <p className="text-ink text-[14px] mt-0.5 break-words">
                  {otherUser.work}{otherUser.company ? ` @ ${otherUser.company}` : ""}
                </p>
              </div>
            )}
            {otherUser.education && (
              <div>
                <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">Education</p>
                <p className="text-ink text-[14px] mt-0.5 break-words">{otherUser.education}</p>
              </div>
            )}
            {otherUser.languages && otherUser.languages.length > 0 && (
              <div className="col-span-2">
                <p className="text-[9px] text-gray uppercase tracking-[0.25em] font-medium">Languages</p>
                <p className="text-ink text-[14px] mt-0.5 leading-snug break-words">
                  {otherUser.languages.join(" · ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Coffee order */}
        {otherUser.coffeeOrder && (
          <div className={`mt-4 flex items-center gap-3 rounded-xl px-4 py-3 ${sameCoffee ? "bg-wine/10 border border-wine/20" : "bg-cream"}`}>
            <span className="text-xl">☕</span>
            <div className="flex-1">
              <p className="text-[10px] text-gray uppercase tracking-wider">Go-to coffee</p>
              <p className="text-ink text-[15px] font-medium" dir="auto">{otherUser.coffeeOrder}</p>
            </div>
            {sameCoffee && (
              <span className="text-[10px] text-wine font-medium bg-wine/15 px-2 py-0.5 rounded-full">Same!</span>
            )}
          </div>
        )}

        {/* Prompts — with overlap highlights */}
        {otherUser.prompts && otherUser.prompts.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {otherUser.prompts.map((p, i) => {
              const isSameQ = sharedQuestions.has(p.question);
              const isSameA = sameAnswers.has(p.question);
              return (
                <div key={i} className={`rounded-xl px-4 py-3.5 ${isSameA ? "bg-wine/10 border border-wine/20" : isSameQ ? "bg-wine/5 border border-wine/10" : "bg-cream"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-wine text-[10px] font-medium uppercase tracking-wider mb-1">{p.question}</p>
                    {isSameA && (
                      <span className="text-[9px] text-wine font-medium bg-wine/15 px-2 py-0.5 rounded-full">Same answer!</span>
                    )}
                    {isSameQ && !isSameA && (
                      <span className="text-[9px] text-wine/70 font-medium">You too</span>
                    )}
                  </div>
                  <p className="text-ink text-[15px] leading-snug break-words" dir="auto">{p.answer}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Profile song — autoplay */}
        {otherUser.profileSong && (
          <div className="mt-4">
            <p className="text-xs text-gray uppercase tracking-wider font-medium mb-2">Their song</p>
            <SpotifyPlayer trackUrl={otherUser.profileSong} autoplay />
          </div>
        )}

        {otherUser.interests && otherUser.interests.length > 0 && (
          <div className="mt-5">
          <p className="text-[10px] text-gray uppercase tracking-[0.25em] font-semibold mb-2.5">Interests</p>
          <div className="flex flex-wrap gap-2">
            {[...otherUser.interests]
              .sort((a, b) => (sharedInterests.has(a) ? 0 : 1) - (sharedInterests.has(b) ? 0 : 1))
              .map((interest) => {
                const isShared = sharedInterests.has(interest);
                return (
                  <span
                    key={interest}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${
                      isShared ? "bg-wine text-cream" : "bg-wine/8 text-ink border border-wine/10"
                    }`}
                  >
                    {interest}{isShared ? " ✓" : ""}
                  </span>
                );
              })}
          </div>
          </div>
        )}
      </div>



      {/* Date Planning Section */}
      <div className="px-4 mt-8">
        {/* Inline action error — visible, dismisses on retry */}
        {actionError && (
          <div className="mb-3 bg-coral/10 border border-coral/30 rounded-2xl px-4 py-3">
            <p className="text-coral text-sm">{actionError}</p>
          </div>
        )}
        {/* Status: scheduling — no one submitted yet */}
        {match.status === "scheduling" && !myAvailability && !showSlotPicker && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-xl text-ink mb-2">Plan your date</h3>
            <p className="text-gray text-sm mb-5">
              Select when you&apos;re free this week. When both of you submit, we&apos;ll find the best time.
            </p>
            <button
              onClick={() => setShowSlotPicker(true)}
              className="w-full py-4 rounded-full bg-wine text-cream font-medium text-lg hover:bg-burgundy transition-colors"
            >
              ☕ Pick your times
            </button>
          </div>
        )}

        {/* Slot picker open */}
        {showSlotPicker && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-xl text-ink mb-1">When are you free?</h3>
            <p className="text-gray text-sm mb-5">
              Pick as many slots as you can — more flexibility = faster match.
            </p>
            <SlotPicker
              onSubmit={handleSubmitAvailability}
              submitting={submitting}
              existingSlots={myAvailability || undefined}
            />
          </div>
        )}

        {/* Both submitted, zero overlap — needs action, NOT a waiting state */}
        {bothSubmittedNoOverlap && !showSlotPicker && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center border border-coral/20">
            <div className="w-12 h-12 rounded-full bg-coral/10 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🗓️</span>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">No overlap yet</h3>
            <p className="text-gray text-sm mb-5">
              You both picked times, but none of them line up. Add a few more slots — {otherUser.displayName} will see the update instantly.
            </p>
            <button
              onClick={() => {
                triggerHaptic();
                setShowSlotPicker(true);
              }}
              className="w-full py-4 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors active:scale-[0.98]"
            >
              Pick more times
            </button>
          </div>
        )}

        {/* Submitted, genuinely waiting for other person */}
        {match.status === "scheduling" && myAvailability && !otherAvailability?.length && !showSlotPicker && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-stripe-white mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">Waiting on {otherUser.displayName}</h3>
            <p className="text-gray text-sm mb-4">
              You&apos;ve picked {myAvailability.length} time slot{myAvailability.length > 1 ? "s" : ""}. We&apos;ll notify you when they&apos;ve picked theirs.
            </p>
            <button
              onClick={() => setShowSlotPicker(true)}
              className="text-sm text-wine font-medium"
            >
              Update your availability
            </button>
          </div>
        )}

        {/* Date proposed — needs confirmation */}
        {match.status === "date_proposed" && match.proposedSlot && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-xl text-ink mb-2">Date found!</h3>
            <p className="text-gray text-sm mb-5">
              You both have time. Confirm to lock it in.
            </p>

            <div className="bg-cream rounded-xl p-4 mb-5">
              <p className="font-display text-lg text-ink">
                {new Date(match.proposedSlot.toDate()).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-ink-mid text-sm mt-1">
                {new Date(match.proposedSlot.toDate()).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: false,
                })}
                {" — "}
                {new Date(
                  match.proposedSlot.toDate().getTime() + 45 * 60 * 1000
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
              <p className="text-gray text-xs mt-2">
                Café will be assigned after you both confirm
              </p>
            </div>

            {iConfirmed ? (
              <div className="text-center">
                <p className="text-gray text-sm">
                  ✓ You confirmed — waiting on {otherUser.displayName}
                </p>
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full py-4 rounded-full bg-wine text-cream font-medium text-lg hover:bg-burgundy transition-colors disabled:opacity-50"
              >
                {confirming ? "Confirming..." : "☕ Confirm date"}
              </button>
            )}
          </div>
        )}

        {/* Date confirmed */}
        {match.status === "date_confirmed" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-wine/10 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">☕</span>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">Meet confirmed!</h3>
            <p className="text-gray text-sm mb-4">
              Check the Meets tab for details and your spot.
            </p>
            <button
              onClick={() => router.push("/dates")}
              className="text-wine font-medium"
            >
              View your meets →
            </button>
          </div>
        )}

      </div>

      {/* Report / block bottom sheet */}
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetUid={otherUser.uid}
        targetName={otherUser.displayName}
        context="blend"
        onBlocked={() => {
          // User is removed from match automatically by blockUser; go back to list
          setTimeout(() => router.push("/matches"), 600);
        }}
      />
    </div>
  );
}
