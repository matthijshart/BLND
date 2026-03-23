/**
 * Two espresso cups seen from above — inspired by the brand photo.
 * SVG illustration: two white circles (saucers) with brown circles (coffee) inside,
 * on a transparent background.
 */
export function TwoCups({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top cup */}
      <g>
        {/* Shadow */}
        <ellipse cx="108" cy="105" rx="62" ry="16" fill="#00000015" />
        {/* Saucer */}
        <circle cx="100" cy="95" r="60" fill="#fafaf8" />
        <circle cx="100" cy="95" r="56" fill="#f0ebe3" />
        {/* Cup rim */}
        <circle cx="100" cy="95" r="38" fill="#fafaf8" />
        <circle cx="100" cy="95" r="34" fill="#f5f0e8" />
        {/* Coffee */}
        <circle cx="100" cy="95" r="28" fill="#6b3a2a" />
        <circle cx="100" cy="95" r="24" fill="#8b5e3c" />
        {/* Crema highlight */}
        <circle cx="92" cy="88" r="8" fill="#c4956a" opacity="0.5" />
        {/* Handle */}
        <path
          d="M138 85 Q155 85 155 95 Q155 105 138 105"
          stroke="#fafaf8"
          strokeWidth="6"
          fill="none"
        />
        {/* Spoon */}
        <line x1="125" y1="40" x2="80" y2="60" stroke="#c0b8a8" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="128" cy="38" rx="6" ry="4" fill="#d0c8b8" transform="rotate(-25 128 38)" />
      </g>

      {/* Bottom cup */}
      <g>
        {/* Shadow */}
        <ellipse cx="108" cy="275" rx="62" ry="16" fill="#00000015" />
        {/* Saucer */}
        <circle cx="100" cy="265" r="60" fill="#fafaf8" />
        <circle cx="100" cy="265" r="56" fill="#f0ebe3" />
        {/* Cup rim */}
        <circle cx="100" cy="265" r="38" fill="#fafaf8" />
        <circle cx="100" cy="265" r="34" fill="#f5f0e8" />
        {/* Coffee */}
        <circle cx="100" cy="265" r="28" fill="#5a2d1a" />
        <circle cx="100" cy="265" r="24" fill="#7a4830" />
        {/* Crema highlight */}
        <circle cx="93" cy="258" r="6" fill="#b8825a" opacity="0.4" />
        {/* Handle */}
        <path
          d="M62 255 Q45 255 45 265 Q45 275 62 275"
          stroke="#fafaf8"
          strokeWidth="6"
          fill="none"
        />
        {/* Spoon */}
        <line x1="72" y1="305" x2="120" y2="288" stroke="#c0b8a8" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="68" cy="307" rx="6" ry="4" fill="#d0c8b8" transform="rotate(25 68 307)" />
      </g>
    </svg>
  );
}
