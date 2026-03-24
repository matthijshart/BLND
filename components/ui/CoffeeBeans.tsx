"use client";

import { motion } from "framer-motion";

const BEANS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100, // % from left
  delay: Math.random() * 0.6,
  duration: 1.5 + Math.random() * 1.5,
  rotation: Math.random() * 720 - 360,
  size: 14 + Math.random() * 10,
  drift: (Math.random() - 0.5) * 60,
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
            top: "-5%",
            left: `${bean.x}%`,
            opacity: 1,
            rotate: 0,
            scale: 0.5,
          }}
          animate={{
            top: "105%",
            left: `${bean.x + bean.drift}%`,
            opacity: [1, 1, 0.8, 0],
            rotate: bean.rotation,
            scale: [0.5, 1, 1, 0.8],
          }}
          transition={{
            duration: bean.duration,
            delay: bean.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
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
            {/* Coffee bean shape */}
            <ellipse
              cx="12"
              cy="12"
              rx="7"
              ry="10"
              fill="#5C3D2E"
              opacity="0.9"
            />
            {/* Bean line */}
            <path
              d="M12 3C10 7 10 17 12 21"
              stroke="#3E2417"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Highlight */}
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
