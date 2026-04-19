"use client";

/**
 * Subtle film grain overlay. Adds warmth to photos — makes them feel
 * like a Kinfolk magazine shoot instead of a digital upload.
 *
 * Drop it inside a relative container. It fills the container and sits above content.
 *
 * <div className="relative">
 *   <Image ... />
 *   <FilmGrain />
 * </div>
 */

interface FilmGrainProps {
  /** Opacity of grain. Default 0.045 — almost subliminal. */
  opacity?: number;
  /** Grain intensity (turbulence baseFrequency). Higher = finer grain. */
  intensity?: number;
}

export function FilmGrain({ opacity = 0.045, intensity = 0.92 }: FilmGrainProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none mix-blend-multiply"
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" className="w-full h-full">
        <filter id="film-grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency={intensity} numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.7 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain-filter)" />
      </svg>
    </div>
  );
}
