import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ──────────────────────────────────────────────────────────────────────────
// App Check — anti-abuse for the public Web API key.
//
// Even with strict Firestore rules, an attacker with valid auth could still
// hammer your DB or scrape allowed reads. App Check requires every request
// to carry a token proving it came from your real bl-nd.nl domain.
//
// Setup: Firebase Console → App Check → Register Web app → reCAPTCHA v3 →
// copy the site key into NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY in .env
// (and Vercel env vars for production).
//
// In local dev, set NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN to a debug token from
// the Firebase Console (App Check → Apps → ⋮ → Manage debug tokens).
// ──────────────────────────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  const debugToken = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;

  if (debugToken) {
    // Tells the App Check SDK to use a debug token instead of reCAPTCHA.
    // Only set this in dev — never expose in production builds.
    (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  if (siteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      // Initialization runs once per app; subsequent HMR reloads throw.
      // Safe to swallow — the existing instance keeps working.
      if (process.env.NODE_ENV === "development") {
        console.warn("[App Check] init skipped:", err);
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    // Loud warning in prod — going live without App Check leaves the
    // public API key wide open to abuse.
    console.warn(
      "[App Check] NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY is not set. " +
      "Configure App Check in Firebase Console before launching publicly."
    );
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
