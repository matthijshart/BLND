"use client";

import { useState, useMemo } from "react";
import { generateAvailableSlots } from "@/lib/scheduling";

interface SlotPickerProps {
  onSubmit: (slots: string[]) => void;
  submitting?: boolean;
  existingSlots?: string[];
}

export function SlotPicker({ onSubmit, submitting, existingSlots }: SlotPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(existingSlots || [])
  );

  const slots = useMemo(() => generateAvailableSlots(), []);

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const slot of slots) {
      const date = new Date(slot);
      const dayKey = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(slot);
    }
    return grouped;
  }, [slots]);

  function toggleSlot(slot: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    <div>
      <div className="space-y-4">
        {Object.entries(slotsByDay).map(([day, daySlots]) => (
          <div key={day}>
            <p className="text-sm font-medium text-ink mb-2">{day}</p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const isSelected = selected.has(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-wine text-cream shadow-sm"
                        : "bg-stripe-white text-ink-mid hover:bg-cream"
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-gray text-xs mb-3 text-center">
          {selected.size === 0
            ? "Select your available time slots"
            : `${selected.size} slot${selected.size > 1 ? "s" : ""} selected`}
        </p>
        <button
          onClick={() => onSubmit(Array.from(selected))}
          disabled={selected.size === 0 || submitting}
          className="w-full py-4 rounded-full bg-wine text-cream font-medium text-lg hover:bg-burgundy transition-colors disabled:opacity-30"
        >
          {submitting ? "Submitting..." : "Submit availability"}
        </button>
      </div>
    </div>
  );
}
