"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into a portal attached directly to document.body.
 *
 * Use this for any modal/overlay/fullscreen UI. The whole app sits inside
 * a PageTransition wrapper that can apply animations to its root — without
 * a portal, `fixed` positioning would resolve relative to that wrapper
 * instead of the viewport, breaking modals in subtle ways.
 *
 * SSR-safe: render returns null until mounted client-side.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
