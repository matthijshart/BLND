import type { User } from "@/types";

/**
 * What someone is here for — the one signal that was stored but never shown.
 *
 * Rendered in the SAME position on every surface (own profile, the swipe card
 * in /today, the public share page): on the photo, directly above the name.
 * Reading order becomes intent → name → neighbourhood, so you know what the
 * hour is for before you know whose it is, and the signal costs no vertical
 * space on a screen the founder asked to make shorter.
 *
 * The three labels share one construction on purpose. "Here for friends" must
 * not read as the lesser answer next to "Here for a date" — symmetry is what
 * keeps this a statement of context rather than a rank.
 */

const LABELS: Record<string, string> = {
  dating: "Here for a date",
  friends: "Here for friends",
  open: "Here for either",
};

interface IntentBadgeProps {
  value: User["lookingFor"] | undefined;
  /** "onPhoto" sits over an image; "inline" sits on cream. */
  variant?: "onPhoto" | "inline";
  size?: "sm" | "md";
  className?: string;
}

export function IntentBadge({
  value,
  variant = "onPhoto",
  size = "md",
  className = "",
}: IntentBadgeProps) {
  // Accounts created before this field existed, and any value we don't know,
  // render nothing rather than an empty or wrong pill.
  const label = value ? LABELS[value] : undefined;
  if (!label) return null;

  const sizing =
    size === "sm"
      ? "text-[10px] pl-1.5 pr-2.5 py-1 gap-1.5"
      : "text-[11px] pl-2 pr-3 py-1.5 gap-2";

  const skin =
    variant === "onPhoto"
      ? "bg-white/92 backdrop-blur-md text-ink shadow-sm"
      : "bg-wine/8 text-wine border border-wine/10";

  const dot = size === "sm" ? 5 : 6;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tracking-wide ${sizing} ${skin} ${className}`}
    >
      {/* The two cups, condensed — the BLEND mark, so the badge reads as
          part of the product rather than a generic tag. */}
      <svg
        width={dot * 3}
        height={dot * 2}
        viewBox="0 0 18 12"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="7" cy="6" r="5" className="fill-wine" opacity="0.85" />
        <circle cx="11" cy="6" r="5" className="fill-wine" opacity="0.5" />
      </svg>
      {label}
    </span>
  );
}
