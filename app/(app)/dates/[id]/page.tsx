"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUser } from "@/lib/db";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { MiniChat } from "@/components/date/MiniChat";
import type { DateRecord, User } from "@/types";

interface DateData extends DateRecord {
  caféName?: string;
  caféAddress?: string;
  caféVibe?: string;
  caféGoogleMapsUrl?: string;
}

export default function DateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuthContext();
  const [dateData, setDateData] = useState<DateData | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  // Real-time date subscription
  useEffect(() => {
    if (!params.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "dates", params.id as string),
      async (snap) => {
        if (!snap.exists() || !firebaseUser) return;
        const data = { id: snap.id, ...snap.data() } as DateData;
        setDateData(data);

        const otherUid = data.users.find((u) => u !== firebaseUser.uid);
        if (otherUid && !otherUser) {
          const user = await getUser(otherUid);
          if (user) setOtherUser(user);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseUser, params.id]);

  // Countdown timer
  useEffect(() => {
    if (!dateData?.dateTime) return;

    function updateCountdown() {
      const dateTime = dateData!.dateTime?.toDate?.()
        || new Date(dateData!.dateTime as unknown as string);
      const now = new Date();
      const diff = dateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Now!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [dateData]);

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="h-48 rounded-2xl bg-stripe-white animate-pulse mb-4" />
        <div className="h-32 rounded-2xl bg-stripe-white animate-pulse" />
      </div>
    );
  }

  if (!dateData || !otherUser) {
    return (
      <div className="px-4 pt-8 text-center">
        <p className="text-gray">Meet not found.</p>
        <button
          onClick={() => router.push("/dates")}
          className="mt-4 text-wine font-medium"
        >
          Back to meets
        </button>
      </div>
    );
  }

  const dateTime = dateData.dateTime?.toDate?.()
    || new Date(dateData.dateTime as unknown as string);
  const chatOpenAt = dateData.chatOpenAt?.toDate?.()
    || new Date(dateData.chatOpenAt as unknown as string);
  const isChatOpen = new Date() >= chatOpenAt;
  const isPast = dateTime < new Date();

  return (
    <div className="max-w-sm mx-auto pb-24">
      {/* Back */}
      <div className="px-4 pt-6 mb-4">
        <button
          onClick={() => router.push("/dates")}
          className="text-gray text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Countdown hero */}
      <div className="mx-4 bg-wine rounded-2xl p-8 text-center mb-6">
        <p className="text-cream/60 text-sm">
          {isPast ? "Date was" : "Date in"}
        </p>
        <p className="text-5xl font-display text-cream mt-2 mb-3">
          {isPast ? "Done" : countdown}
        </p>
        <p className="text-cream/80 text-sm">
          Coffee with {otherUser.displayName}
        </p>
      </div>

      {/* Date & Time */}
      <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-stripe-white flex items-center justify-center shrink-0">
            <span className="text-xl">📅</span>
          </div>
          <div>
            <p className="font-display text-lg text-ink">
              {dateTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-ink-mid text-sm">
              {dateTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })}
              {" — "}
              {new Date(dateTime.getTime() + 45 * 60 * 1000).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: false }
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Café info */}
      <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-stripe-white flex items-center justify-center shrink-0">
            <span className="text-xl">☕</span>
          </div>
          <div className="flex-1">
            <p className="font-display text-lg text-ink">
              {dateData.caféName || "Café TBD"}
            </p>
            {dateData.caféAddress && (
              <p className="text-ink-mid text-sm mt-0.5">{dateData.caféAddress}</p>
            )}
            {dateData.caféVibe && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-stripe-white text-gray text-xs mt-2 capitalize">
                {dateData.caféVibe}
              </span>
            )}
          </div>
        </div>

        {dateData.caféGoogleMapsUrl && (
          <a
            href={dateData.caféGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 py-3 rounded-xl bg-cream text-center text-ink-mid font-medium text-sm hover:bg-stripe-white transition-colors"
          >
            Open in Google Maps →
          </a>
        )}
      </div>

      {/* Your date */}
      <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
            <Image
              src={otherUser.photos[0] || "/images/sipping.png"}
              alt={otherUser.displayName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-display text-lg text-ink">
              {otherUser.displayName}, {otherUser.age}
            </p>
            <p className="text-gray text-sm">{otherUser.neighborhood}</p>
          </div>
        </div>
      </div>

      {/* Chat section */}
      {isChatOpen && !isPast && chatOpen ? (
        /* Full chat view */
        <div className="fixed inset-0 z-50 bg-cream flex flex-col">
          {/* Chat header with back */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stripe-white">
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray text-sm shrink-0"
            >
              ← Back
            </button>
            <div className="flex-1 text-center">
              <p className="font-display text-ink text-sm">
                {otherUser.displayName}
              </p>
            </div>
            <div className="w-12" /> {/* spacer for centering */}
          </div>

          {/* Chat body */}
          <div className="flex-1 overflow-hidden">
            <MiniChat
              dateId={dateData.id}
              otherName={otherUser.displayName}
            />
          </div>
        </div>
      ) : (
        /* Chat status card */
        <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm">
          {isChatOpen && !isPast ? (
            <div className="text-center">
              <p className="text-ink font-medium mb-1">Chat is open</p>
              <p className="text-gray text-sm mb-4">
                Say hi before you meet. Keep it light — logistics only.
              </p>
              <button
                onClick={() => setChatOpen(true)}
                className="w-full py-3 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors"
              >
                Open chat
              </button>
            </div>
          ) : isPast ? (
            <div className="text-center">
              <p className="text-gray text-sm">
                Hope it went well! Rating coming soon.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray text-sm">
                Chat opens 2 hours before your date
                <br />
                <span className="text-ink-mid font-medium">
                  {chatOpenAt.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" at "}
                  {chatOpenAt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
