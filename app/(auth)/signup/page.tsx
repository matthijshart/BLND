"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { getUser } from "@/lib/db";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await signUp(email, password);
      router.push("/onboarding");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Try signing in.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Something went wrong. Try again.");
      }
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-dvh bg-wine flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-burgundy opacity-40" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-burgundy opacity-30" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="text-4xl font-display text-cream">
            BLEND
          </Link>
          <p className="text-cream/60 mt-2">Create your account.</p>
        </div>

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
            placeholder="Password (min. 6 characters)"
            required
            minLength={6}
            className="w-full px-5 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 transition-colors"
          />

          {error && (
            <p className="text-coral text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

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
          Already have an account?{" "}
          <Link href="/login" className="text-cream font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
