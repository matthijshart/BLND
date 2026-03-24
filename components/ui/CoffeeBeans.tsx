"use client";

import { motion } from "framer-motion";

const BEANS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 1.2,
  duration: 3 + Math.random() * 2.5,
  rotation: Math.random() * 540 - 270,
  size: 24 + Math.random() * 18,
  drift: (Math.random() - 0.5) * 50,
}));

/**
 * Falling coffee beans animation — plays once on mount.
 * Used when "It's a blend!" is triggered.
 */
export function CoffeeBeans() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {BEANS.map((bean) => (
        <motion.div
          key={bean.id}
          initial={{
            top: "-8%",
            left: `${bean.x}%`,
            opacity: 0,
            rotate: 0,
            scale: 0.3,
          }}
          animate={{
            top: "110%",
            left: `${bean.x + bean.drift}%`,
            opacity: [0, 1, 1, 1, 0.6, 0],
            rotate: bean.rotation,
            scale: [0.3, 1.1, 1, 1, 0.9],
          }}
          transition={{
            duration: bean.duration,
            delay: bean.delay,
            ease: [0.15, 0.6, 0.4, 0.95],
          }}
          className="absolute"
          style={{ fontSize: bean.size }}
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
          >
            <ellipse
              cx="12"
              cy="12"
              rx="7"
              ry="10"
              fill="#5C3D2E"
              opacity="0.9"
            />
            <path
              d="M12 3C10 7 10 17 12 21"
              stroke="#3E2417"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse
              cx="9.5"
              cy="9"
              rx="2"
              ry="3"
              fill="#7A5340"
              opacity="0.4"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
