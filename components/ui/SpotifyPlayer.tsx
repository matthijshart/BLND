"use client";

interface SpotifyPlayerProps {
  trackUrl: string;
  autoplay?: boolean;
  /** If true, show a user-visible error for invalid URLs instead of returning null. */
  showErrorState?: boolean;
}

export function extractTrackId(url: string): string | null {
  if (!url) return null;
  // Accepts: open.spotify.com/track/ID, spotify:track:ID, or embed/track/ID
  const patterns = [
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
    /embed\/track\/([a-zA-Z0-9]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function isValidSpotifyUrl(url: string): boolean {
  return extractTrackId(url) !== null;
}

export function SpotifyPlayer({ trackUrl, autoplay = false, showErrorState }: SpotifyPlayerProps) {
  const trackId = extractTrackId(trackUrl);

  if (!trackId) {
    if (!showErrorState) return null;
    return (
      <div className="rounded-xl px-4 py-3 bg-coral/10 border border-coral/30 text-coral text-xs">
        That doesn&apos;t look like a Spotify track link. Try copying the share URL from Spotify.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden">
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}?theme=0&autoplay=${autoplay ? 1 : 0}`}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="eager"
        className="rounded-xl border-0"
      />
    </div>
  );
}
