"use client";

/**
 * Decorative coffee ring stains — subtle bordeaux marks that add warmth
 * and signature BLEND-ness to pages. Absolute-positioned, purely aesthetic.
 *
 * Usage: place inside a relative container. Use `variant` for visual variety.
 *
 * <CoffeeRing variant="ring" className="top-10 right-8" />
 */

interface CoffeeRingProps {
  /** Visual variant. `ring` = full circle ring; `double` = two overlapping rings; `drip` = small ring + drop */
  variant?: "ring" | "double" | "drip" | "smudge";
  /** Tailwind positioning + size (e.g. "top-10 right-8 w-24 h-24") */
  className?: string;
  /** Opacity from 0 to 1. Default 0.07 — very subtle. */
  opacity?: number;
  /** Rotation in degrees. */
  rotate?: number;
}

export function CoffeeRing({
  variant = "ring",
  className = "",
  opacity = 0.07,
  rotate = 0,
}: CoffeeRingProps) {
  const color = "#6b1520"; // wine

  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{ opacity, transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {variant === "ring" && (
          <>
            {/* Imperfect ring — slightly uneven stroke to feel hand-stained */}
            <ellipse
              cx="100"
              cy="102"
              rx="78"
              ry="75"
              stroke={color}
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="260 15 200 20 320"
              strokeLinecap="round"
            />
            {/* Inner subtle stain */}
            <ellipse
              cx="100"
              cy="100"
              rx="72"
              ry="70"
              fill={color}
              opacity="0.15"
            />
            {/* Tiny drop nearby */}
            <circle cx="175" cy="38" r="3.5" fill={color} opacity="0.6" />
          </>
        )}

        {variant === "double" && (
          <>
            <ellipse
              cx="75"
              cy="95"
              rx="55"
              ry="53"
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeDasharray="180 12 140"
              strokeLinecap="round"
            />
            <ellipse
              cx="125"
              cy="115"
              rx="58"
              ry="55"
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeDasharray="160 18 180 10"
              strokeLinecap="round"
            />
            <ellipse cx="75" cy="95" rx="50" ry="48" fill={color} opacity="0.12" />
            <ellipse cx="125" cy="115" rx="53" ry="50" fill={color} opacity="0.12" />
          </>
        )}

        {variant === "drip" && (
          <>
            <ellipse
              cx="90"
              cy="95"
              rx="60"
              ry="57"
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeDasharray="200 10 170"
              strokeLinecap="round"
            />
            <ellipse cx="90" cy="93" rx="55" ry="52" fill={color} opacity="0.14" />
            {/* Drops */}
            <circle cx="162" cy="45" r="5" fill={color} opacity="0.55" />
            <circle cx="175" cy="65" r="2.5" fill={color} opacity="0.4" />
            <ellipse cx="30" cy="155" rx="5" ry="4" fill={color} opacity="0.45" transform="rotate(-20 30 155)" />
          </>
        )}

        {variant === "smudge" && (
          <>
            {/* Half-hearted smudge — uneven */}
            <path
              d="M 30 100 Q 60 50, 130 60 T 175 110 Q 150 150, 80 140 T 30 100 Z"
              fill={color}
              opacity="0.18"
            />
            <path
              d="M 50 100 Q 80 70, 125 78 T 160 110"
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}
