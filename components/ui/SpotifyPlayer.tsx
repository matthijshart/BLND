"use client";

interface SpotifyPlayerProps {
  trackUrl: string;
  autoplay?: boolean;
}

function extractTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function SpotifyPlayer({ trackUrl, autoplay = false }: SpotifyPlayerProps) {
  const trackId = extractTrackId(trackUrl);
  if (!trackId) return null;

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
