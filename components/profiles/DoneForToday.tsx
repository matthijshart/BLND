export function DoneForToday() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-3 h-3 rounded-full bg-wine" />
        <div className="w-px h-6 bg-ink/10" />
        <div className="w-3 h-3 rounded-full bg-wine" />
      </div>

      <h2 className="text-3xl font-display text-ink">
        That&apos;s it for today.
      </h2>
      <p className="text-gray mt-3 max-w-xs leading-relaxed">
        Your daily profiles refresh tomorrow at 11:00.
        Good things take time.
      </p>

      <p className="text-gray-light text-sm mt-8 font-mono tracking-wide">
        See you tomorrow ☕
      </p>
    </div>
  );
}
