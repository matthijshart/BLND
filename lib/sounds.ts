"use client";

/**
 * Play a soft, warm "pling" sound for blend notifications.
 * Uses the Web Audio API — no external files needed.
 */
export function playBlendSound() {
  try {
    const ctx = new AudioContext();

    // Main tone — warm, soft
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmony — subtle warmth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 1.0);

    // Cleanup
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Audio not available — fail silently
  }
}

/**
 * Trigger haptic feedback on supported devices.
 */
export function triggerHaptic() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  } catch {
    // Not supported — fail silently
  }
}
