/**
 * Blue verified checkmark — shown on profiles that have completed selfie
 * verification. The single most-trusted UI element in any social app.
 *
 * Use the `size` prop to scale: "sm" (next to names in lists), "md"
 * (default, on profile cards), "lg" (hero on profile detail).
 */
export function VerifiedBadge({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  return (
    <span
      className={`inline-flex items-center justify-center align-middle ${className}`}
      title="Photo-verified"
      aria-label="Photo-verified"
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft blue, less saturated than Twitter blue — fits BLEND palette */}
        <path
          d="M12 1l2.4 2.5 3.4-.4 1.3 3.2 3 1.7-.7 3.4L23 13l-2.5 2.4.4 3.4-3.2 1.3-1.7 3-3.4-.7L9.6 23l-2.4-2.5-3.4.4-1.3-3.2-3-1.7.7-3.4L1 11l2.5-2.4-.4-3.4 3.2-1.3 1.7-3 3.4.7L12 1z"
          fill="#5b8cb0"
        />
        <path
          d="M9.5 12.5l2 2 4-4.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
