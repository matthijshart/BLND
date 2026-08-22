"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Page fade-in transition.
 *
 * CRITICAL: this component must NOT apply any CSS transform to its root
 * element. A `transform` creates a containing block for `fixed`-positioned
 * descendants, which silently breaks every modal in the app (PhotoViewer,
 * CancelMeetModal, VerificationFlow). We use opacity-only animation and
 * `willChange: opacity` (NOT transform) to keep the GPU hint without
 * accidentally creating a containing block.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
}
