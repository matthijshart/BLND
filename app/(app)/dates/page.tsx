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
        <h1 className="text-2xl font-display text-ink mb-6">Meets</h1>
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
        <h1 className="text-2xl font-display text-ink mb-6">Meets</h1>

        {/* Mood image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
          <Image
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
        <Image
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
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray mb-3">Coming up</p>
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
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray mb-3">Past</p>
            <div className="space-y-3 opacity-60">
              {past.map((date) => (
                <DateCard key={date.id} date={date} />
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-light text-xs mt-8 font-mono tracking-wide text-center">
          Two people. One spot. No small talk beforehand.
        </p>
      </div>
    </div>
  );
}

function generateCalendarUrl(title: string, start: Date, location: string): string {
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 60 min
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:Coffee meet via BLEND ☕`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  return URL.createObjectURL(blob);
}

function DateCard({ date }: { date: ReturnType<typeof useDates>["dates"][number] }) {
  const dateTime = date.dateTime?.toDate?.() || new Date(date.dateTime as unknown as string);
  const caféName = (date as unknown as Record<string, string>).caféName || "TBD";
  const caféVibe = (date as unknown as Record<string, string>).caféVibe || "";
  const isChatOpen = date.status === "chat_open";
  const isPast = dateTime < new Date();

  function addToCalendar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const title = `BLEND ☕ Coffee with ${date.otherUser.displayName}`;
    const location = caféName !== "TBD" ? caféName : "Amsterdam";
    const url = generateCalendarUrl(title, dateTime, location);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blend-meet-${date.otherUser.displayName.toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Link
      href={`/dates/${date.id}`}
      className={`block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${
        isPast ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-wine/10">
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

          <button
            onClick={addToCalendar}
            className="flex items-center gap-1.5 mt-1 group"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-ink-mid text-sm group-hover:text-wine transition-colors">
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
            </span>
            <span className="text-[9px] text-wine font-medium opacity-0 group-hover:opacity-100 transition-opacity">+ Add</span>
          </button>

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
