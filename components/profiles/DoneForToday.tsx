import Link from "next/link";

export function DoneForToday() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-20 h-20 rounded-full bg-wine/10 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-wine">
          <path d="M17 8h1a4 4 0 110 8h-1" />
          <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      </div>

      <h2 className="text-3xl font-display text-ink">
        That&apos;s a wrap.
      </h2>
      <p className="text-gray mt-3 max-w-[260px] leading-relaxed">
        New profiles drop tomorrow at 11:00. In the meantime, check if you have any matches waiting.
      </p>

      <Link
        href="/matches"
        className="mt-6 px-6 py-3 rounded-full bg-wine text-cream font-medium text-sm hover:bg-burgundy transition-colors"
      >
        Check matches
      </Link>

      <p className="text-gray-light text-xs mt-8 font-mono tracking-wide">
        Less swiping. More sipping.
      </p>
    </div>
  );
}
