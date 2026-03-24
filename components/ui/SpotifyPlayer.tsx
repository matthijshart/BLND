"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpotifyPlayerProps {
  trackUrl: string;
  autoplay?: boolean;
}

function extractTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function SpotifyPlayer({ trackUrl, autoplay = false }: SpotifyPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<unknown>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const trackId = extractTrackId(trackUrl);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !trackId || controllerRef.current) return;

    const win = window as unknown as Record<string, unknown>;
    const IFrameAPI = win.SpotifyIframeApi as {
      createController: (
        el: HTMLElement,
        options: Record<string, unknown>,
        callback: (ctrl: unknown) => void
      ) => void;
    } | undefined;

    if (!IFrameAPI) {
      setUseFallback(true);
      return;
    }

    try {
      IFrameAPI.createController(
        containerRef.current,
        {
          uri: `spotify:track:${trackId}`,
          width: "100%",
          height: 80,
        },
        (ctrl) => {
          controllerRef.current = ctrl;
          setLoaded(true);

          // Listen for playback changes
          const controller = ctrl as { addListener: (event: string, cb: (data: { isPaused: boolean }) => void) => void; play: () => void; togglePlay: () => void };
          controller.addListener("playback_update", (data) => {
            setIsPlaying(!data.isPaused);
          });

          if (autoplay) {
            // Small delay to let embed initialize
            setTimeout(() => {
              controller.play();
            }, 500);
          }
        }
      );
    } catch {
      setUseFallback(true);
    }
  }, [trackId, autoplay]);

  useEffect(() => {
    if (!trackId) return;

    const win = window as unknown as Record<string, unknown>;

    // Check if API is already loaded
    if (win.SpotifyIframeApi) {
      initPlayer();
      return;
    }

    // Set up callback for when API loads
    win.onSpotifyIframeApiReady = () => {
      initPlayer();
    };

    // Load the script if not already present
    if (!document.querySelector('script[src*="spotify.com/embed"]')) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.onerror = () => setUseFallback(true);
      document.body.appendChild(script);
    }

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!controllerRef.current) {
        setUseFallback(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [trackId, initPlayer]);

  function handlePlayPause() {
    const controller = controllerRef.current as { togglePlay: () => void } | null;
    if (controller) {
      controller.togglePlay();
    }
  }

  function handleReplay() {
    const controller = controllerRef.current as { play: () => void } | null;
    if (controller) {
      controller.play();
    }
  }

  if (!trackId) return null;

  // Fallback: regular iframe embed — always use this for reliability
  if (useFallback) {
    return (
      <div className="rounded-xl overflow-hidden">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?theme=0&autoplay=${autoplay ? 1 : 0}`}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl border-0"
        />
      </div>
    );
  }

  return (
    <div>
      {/* Spotify embed container */}
      <div ref={containerRef} className="rounded-xl overflow-hidden" />

      {/* Custom controls */}
      {loaded && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wine/10 text-wine text-xs font-medium hover:bg-wine/20 transition-colors"
          >
            {isPlaying ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Play
              </>
            )}
          </button>
          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wine/10 text-wine text-xs font-medium hover:bg-wine/20 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Replay
          </button>
        </div>
      )}
    </div>
  );
}
