"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { FilmGrain } from "./FilmGrain";

interface ShimmerImageProps extends ImageProps {
  /** Add a subtle film grain overlay. Default true — set false to disable. */
  grain?: boolean;
}

/**
 * A wrapper around next/image that shows a cream shimmer animation
 * until the image has loaded, and optionally adds a subtle film grain
 * overlay for warmth.
 */
export function ShimmerImage({ grain = true, ...props }: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 shimmer-bg z-[1]" />
      )}
      <Image
        {...props}
        onLoad={(e) => {
          setLoaded(true);
          if (typeof props.onLoad === "function") {
            props.onLoad(e);
          }
        }}
      />
      {grain && loaded && <FilmGrain />}
    </>
  );
}
