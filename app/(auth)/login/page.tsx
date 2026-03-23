"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle, resetPassword } from "@/lib/auth";
import { getUser } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      router.push("/today");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch {
      setError("Could not send reset email. Check your email address.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      const profile = await getUser(result.user.uid);
      router.push(profile ? "/today" : "/onboarding");
    } catch {
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-wine flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-burgundy opacity-40" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-burgundy opacity-30" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="text-4xl font-display text-cream">
            BLEND
          </Link>
          <p className="text-cream/60 mt-2">Welcome back.</p>
        </div>

        {showReset ? (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-cream/70 text-sm text-center mb-2">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
            />

            {error && (
              <p className="text-coral text-sm text-center">{error}</p>
            )}

            {resetSent ? (
              <div className="text-center space-y-3">
                <p className="text-cream text-sm">
                  ✓ Reset link sent! Check your inbox.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="text-cream/60 text-sm"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setError(""); }}
                  className="w-full text-cream/60 text-sm mt-2"
                >
                  Back to login
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
            />

            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowReset(true); setError(""); }}
                className="text-cream/50 text-sm hover:text-cream/70 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="text-coral text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-cream/20" />
          <span className="text-cream/40 text-xs">or</span>
          <div className="flex-1 h-px bg-cream/20" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-4 rounded-full border border-cream/20 text-cream font-medium hover:bg-cream/10 transition-colors disabled:opacity-50"
        >
          Continue with Google
        </button>

        <p className="text-center text-cream/50 text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-cream font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
