"use client";

import { useDates } from "@/hooks/useDates";
import Image from "next/image";
import Link from "next/link";
import { ShimmerImage } from "@/components/ui/ShimmerImage";

export default function DatesPage() {
  const { dates, loading } = useDates();

  const upcoming = dates.filter((d) =>
    ["upcoming", "chat_open", "second_cup"].includes(d.status)
  );
  const past = dates.filter((d) =>
    ["completed", "cancelled", "no_show"].includes(d.status) && d.status !== "second_cup"
  );

  if (loading) {
    return (
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-display text-ink mb-6">Meets</h1>
        <div className="space-y-4">
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
        <h1 className="text-2xl font-display text-ink mb-6">Meets</h1>

        {/* Mood image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
          <ShimmerImage
            src="/images/chess terrace.jpeg"
            alt="Café terrace"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6">
            <h2 className="text-2xl font-display text-white">No meets yet</h2>
            <p className="text-white/70 text-sm mt-2 max-w-[260px] leading-relaxed">
              Your first coffee meet is one blend away. We pick the spot, you bring the charm.
            </p>
          </div>
        </div>

        <Link
          href="/matches"
          className="block text-center w-full py-4 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors"
        >
          Check your blends
        </Link>

        <p className="text-gray-light text-xs mt-6 font-mono tracking-wide text-center">
          No cocktail bars. No pressure. Just coffee.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero mood image — always visible */}
      <div className="relative aspect-[21/9] overflow-hidden">
        <ShimmerImage
          src="/images/chess terrace.jpeg"
          alt="Café terrace vibes"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 px-5 pb-4">
          <h1 className="text-2xl font-display text-ink">Meets</h1>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Grouped by time proximity */}
        {(() => {
          const now = new Date();
          const startOfToday = new Date(now);
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date(startOfToday);
          endOfToday.setDate(endOfToday.getDate() + 1);

          // "This weekend" = upcoming Friday 00:00 to Sunday 23:59 (or remaining Fri-Sun if we're already in weekend)
          const dayIdx = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
          const fridayOffset = (5 - dayIdx + 7) % 7; // days until next Friday
          const fridayStart = new Date(startOfToday);
          fridayStart.setDate(fridayStart.getDate() + fridayOffset);
          const sundayEnd = new Date(fridayStart);
          sundayEnd.setDate(sundayEnd.getDate() + 3); // Fri 00:00 + 3 = Mon 00:00

          const endOfNextWeek = new Date(startOfToday);
          endOfNextWeek.setDate(endOfNextWeek.getDate() + 14);

          const isInRange = (d: Date, start: Date, end: Date) =>
            d.getTime() >= start.getTime() && d.getTime() < end.getTime();

          const groups: { label: string; dates: typeof upcoming }[] = [
            { label: "Today", dates: [] },
            { label: "This weekend", dates: [] },
            { label: "Later", dates: [] },
          ];

          for (const d of upcoming) {
            const dt = d.dateTime?.toDate?.() || new Date(d.dateTime as unknown as string);
            if (dt < now) {
              // Past chat window but meet still marked upcoming (or second_cup) — put at top
              groups[0].dates.push(d);
            } else if (isInRange(dt, startOfToday, endOfToday)) {
              groups[0].dates.push(d);
            } else if (isInRange(dt, fridayStart, sundayEnd)) {
              groups[1].dates.push(d);
            } else {
              groups[2].dates.push(d);
            }
          }

          const nonEmpty = groups.filter((g) => g.dates.length > 0);
          if (nonEmpty.length === 0 && past.length === 0) return null;

          return (
            <>
              {nonEmpty.map((g) => (
                <div key={g.label} className="mb-6">
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-wine mb-3">{g.label}</p>
                  <div className="space-y-4">
                    {g.dates.map((date) => (
                      <DateCard key={date.id} date={date} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          );
        })()}

        {/* Past — collapsible feel with subtler styling */}
        {past.length > 0 && (
          <div className="mt-8 pt-6 border-t border-ink/5">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-light mb-3">Past</p>
            <div className="space-y-3">
              {past.map((date) => (
                <div key={date.id} className="opacity-70">
                  <DateCard date={date} />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-light text-xs mt-10 font-mono tracking-wide text-center">
          Two people. One spot. Just coffee.
        </p>
      </div>
    </div>
  );
}

function openAppleCalendar(title: string, start: Date, location: string) {
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BLEND//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:Coffee meet via BLEND`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  // Open as webcal: data blob — iOS Safari handles this natively
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Use window.location for iOS — triggers native calendar handler
  window.location.href = url;
}

function DateCard({ date }: { date: ReturnType<typeof useDates>["dates"][number] }) {
  const dateTime = date.dateTime?.toDate?.() || new Date(date.dateTime as unknown as string);
  const caféName = (date as unknown as Record<string, string>).caféName || "Spot being picked...";
  const caféVibe = (date as unknown as Record<string, string>).caféVibe || "";
  const isChatOpen = date.status === "chat_open" || date.status === "second_cup";
  const isSecondCup = date.status === "second_cup";
  const isPast = dateTime < new Date() && !isSecondCup;

  return (
    <Link
      href={`/dates/${date.id}`}
      className={`block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${
        isPast ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-wine/10">
          <ShimmerImage
            src={date.otherUser.photos[0] || "/images/sipping.png"}
            alt={date.otherUser.displayName}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-ink">
            {isSecondCup ? "Second cup" : "Coffee"} with {date.otherUser.displayName}
          </h3>

          {isSecondCup ? (
            <>
              <p className="text-wine text-sm mt-1 font-medium">
                Chat is open — plan your next coffee
              </p>
              <p className="text-gray text-sm mt-0.5">
                First met at {caféName}
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {isSecondCup && (
          <span className="px-2.5 py-1 rounded-full bg-wine/10 text-wine text-xs font-medium shrink-0">
            ☕☕ Second cup
          </span>
        )}
        {isChatOpen && !isSecondCup && (
          <span className="px-2.5 py-1 rounded-full bg-coral/10 text-coral text-xs font-medium shrink-0">
            Chat open
          </span>
        )}
      </div>
    </Link>
  );
}
