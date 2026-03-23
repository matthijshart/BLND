"use client";

import { useState, useEffect } from "react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function AddToHomescreen() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) return;

    // Don't show if dismissed before
    const wasDismissed = localStorage.getItem("blend-ath-dismissed");
    if (wasDismissed) return;

    // Show after 3 seconds
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("blend-ath-dismissed", "true");
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 px-4 animate-in slide-in-from-bottom">
      <div className="max-w-sm mx-auto bg-ink text-cream rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-wine flex items-center justify-center shrink-0">
            <span className="text-cream font-display text-xs font-bold tracking-wider">B</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cream">
              Add BLEND to your homescreen
            </p>
            {isIOS() ? (
              <p className="text-cream/50 text-xs mt-1 leading-relaxed">
                Tap{" "}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline -mt-0.5 text-cream/70">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                {" "}then &quot;Add to Home Screen&quot;
              </p>
            ) : (
              <p className="text-cream/50 text-xs mt-1 leading-relaxed">
                Open in your browser menu and tap &quot;Add to Home Screen&quot;
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="text-cream/30 hover:text-cream/60 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
