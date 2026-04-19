"use client";

import { useMemo } from "react";

interface Props {
  /** Value as YYYY-MM-DD string (or empty). */
  value: string;
  onChange: (value: string) => void;
  /** "dark" = cream-on-wine styling (onboarding), "light" = ink-on-cream (profile edit). */
  theme?: "dark" | "light";
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseDate(value: string): { day: string; month: string; year: string } {
  if (!value) return { day: "", month: "", year: "" };
  const [y, m, d] = value.split("-");
  return { year: y || "", month: m || "", day: d || "" };
}

function formatDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function DateOfBirthInput({ value, onChange, theme = "dark" }: Props) {
  const { day, month, year } = parseDate(value);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    // Range: 18 years ago back to 100 years ago
    const min = currentYear - 100;
    const max = currentYear - 18;
    const arr: number[] = [];
    for (let y = max; y >= min; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const daysInMonth = useMemo(() => {
    const m = parseInt(month || "1");
    const y = parseInt(year || "2000");
    if (!m || !y) return 31;
    return new Date(y, m, 0).getDate();
  }, [month, year]);

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) arr.push(String(d));
    return arr;
  }, [daysInMonth]);

  function update(newDay: string, newMonth: string, newYear: string) {
    // Clamp day to month's max days
    const maxDay = new Date(parseInt(newYear || "2000"), parseInt(newMonth || "1"), 0).getDate();
    const clampedDay = newDay ? String(Math.min(parseInt(newDay), maxDay)) : newDay;
    onChange(formatDate(clampedDay, newMonth, newYear));
  }

  const baseClass =
    theme === "dark"
      ? "bg-cream/10 text-cream border-cream/20 focus:border-cream/50 [&>option]:text-ink"
      : "bg-white text-ink border-cream focus:border-wine/30";

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={day}
        onChange={(e) => update(e.target.value, month, year)}
        aria-label="Day"
        className={`w-full px-4 py-4 rounded-2xl border appearance-none text-center focus:outline-none transition-colors ${baseClass}`}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => update(day, e.target.value, year)}
        aria-label="Month"
        className={`w-full px-4 py-4 rounded-2xl border appearance-none text-center focus:outline-none transition-colors ${baseClass}`}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1)}>{name}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => update(day, month, e.target.value)}
        aria-label="Year"
        className={`w-full px-4 py-4 rounded-2xl border appearance-none text-center focus:outline-none transition-colors ${baseClass}`}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}
