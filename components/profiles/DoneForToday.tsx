import Link from "next/link";
import Image from "next/image";

export function DoneForToday() {
  return (
    <div className="px-4 pt-8">
      {/* Mood image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
        <Image
          src="/images/coffe couple.jpeg"
          alt="Coffee date vibes"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6">
          <h2 className="text-3xl font-display text-white">
            That&apos;s a wrap.
          </h2>
          <p className="text-white/70 text-sm mt-2 max-w-[260px] leading-relaxed">
            New profiles drop tomorrow at 11:00. In the meantime, check your blends.
          </p>
        </div>
      </div>

      <Link
        href="/matches"
        className="block text-center w-full py-4 rounded-full bg-wine text-cream font-medium hover:bg-burgundy transition-colors"
      >
        Check blends
      </Link>

      <p className="text-gray-light text-xs mt-6 font-mono tracking-wide text-center">
        Less swiping. More sipping.
      </p>
    </div>
  );
}
