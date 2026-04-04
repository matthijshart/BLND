"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * A wrapper around next/image that shows a cream shimmer animation
 * until the image has loaded.
 */
export function ShimmerImage(props: ImageProps) {
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
    </>
  );
}
