"use client";

import { useDates } from "@/hooks/useDates";
import Image from "next/image";
import Link from "next/link";

export default function DatesPage() {
  const { dates, loading } = useDates();

  const upcoming = dates.filter((d) =>
    ["upcoming", "chat_open"].includes(d.status)
  );
  const past = dates.filter((d) =>
    ["completed", "cancelled", "no_show"].includes(d.status)
  );

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Dates</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-stripe-white animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Dates</h1>
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
          <div className="w-20 h-20 rounded-full bg-wine/10 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-wine">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="text-2xl font-display text-ink">No dates planned</h2>
          <p className="text-gray mt-3 max-w-[260px] leading-relaxed">
            Your first coffee date is one match away. We pick the café, you bring the charm.
          </p>
          <Link
            href="/matches"
            className="mt-6 px-6 py-3 rounded-full bg-wine text-cream font-medium text-sm hover:bg-burgundy transition-colors"
          >
            Check your matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-24">
      <h1 className="text-2xl font-display text-ink mb-6">Dates</h1>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((date) => (
              <DateCard key={date.id} date={date} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray uppercase tracking-wider mb-3">
            Past
          </h2>
          <div className="space-y-3">
            {past.map((date) => (
              <DateCard key={date.id} date={date} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DateCard({ date }: { date: ReturnType<typeof useDates>["dates"][number] }) {
  const dateTime = date.dateTime?.toDate?.() || new Date(date.dateTime as unknown as string);
  const caféName = (date as unknown as Record<string, string>).caféName || "TBD";
  const caféVibe = (date as unknown as Record<string, string>).caféVibe || "";
  const isChatOpen = date.status === "chat_open";
  const isPast = dateTime < new Date();

  return (
    <Link
      href={`/dates/${date.id}`}
      className={`block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${
        isPast ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
          <Image
            src={date.otherUser.photos[0] || "/images/sipping.png"}
            alt={date.otherUser.displayName}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-ink">
            Coffee with {date.otherUser.displayName}
          </h3>

          <p className="text-ink-mid text-sm mt-1">
            {dateTime.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {" at "}
            {dateTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: false,
            })}
          </p>

          <p className="text-gray text-sm mt-0.5">
            {caféName}
            {caféVibe && (
              <span className="text-gray-light"> · {caféVibe}</span>
            )}
          </p>
        </div>

        {isChatOpen && (
          <span className="px-2.5 py-1 rounded-full bg-coral/10 text-coral text-xs font-medium shrink-0">
            Chat open
          </span>
        )}
      </div>
    </Link>
  );
}
