"use client";

import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: write to Firebase waitlist
    setSubmitted(true);
  }

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      {/* ─── HERO: Full-screen crimson with big typography ─── */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center bg-wine text-cream px-6 overflow-hidden">
        {/* Decorative circle — inspired by the red circle on cream photo, inverted */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-burgundy opacity-40" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-burgundy opacity-30" />

        <div className="relative z-10 text-center max-w-2xl">
          <p className="font-mono text-sm tracking-[0.3em] uppercase text-cream/60 mb-6">
            Amsterdam
          </p>
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-display tracking-tight leading-[0.85]">
            Blend
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-cream/80 max-w-md mx-auto leading-relaxed">
            Skip the chat.<br />
            Meet for real.
          </p>

          {/* Two dots — like the two espresso cups seen from above */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <div className="w-3 h-3 rounded-full bg-cream/90" />
            <div className="w-px h-6 bg-cream/30" />
            <div className="w-3 h-3 rounded-full bg-cream/90" />
          </div>

          <p className="mt-6 text-cream/50 text-sm max-w-xs mx-auto">
            Every day we pick a few people for you. Mutual like? We book the café. You just show up.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-cream/40 text-xs font-mono tracking-wider">scroll</span>
          <div className="w-px h-8 bg-cream/20" />
        </div>
      </section>

      {/* ─── STATEMENT: Big typographic hook with coffee cups ─── */}
      <section className="bg-cream py-20 sm:py-28 px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-ink leading-[0.95] text-center">
            Less swiping.
          </h2>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-wine leading-[0.95] mt-2 text-center">
            More sipping.
          </h2>
        </div>
      </section>

      {/* ─── MANIFESTO: The problem ─── */}
      <section className="bg-stripe-white py-24 sm:py-32 px-6">
        <div className="max-w-xl mx-auto">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-gray mb-8">
            The problem
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-ink leading-tight">
            Your grandmother didn&apos;t need an algorithm.
          </h2>
          <p className="mt-4 text-3xl sm:text-4xl md:text-5xl font-display text-gray-light leading-tight">
            But here we are.
          </p>
          <div className="mt-10 space-y-5 text-ink-mid text-lg leading-relaxed">
            <p>
              Weeks of chatting that go nowhere. Infinite swiping that leads to decision fatigue.
              Alcohol-fueled evenings where nobody is really themselves.
            </p>
            <p>
              Blend does one thing: gets two people to sit down for coffee.
              30 minutes, daytime, at a café we pick. That&apos;s it.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS: Deep red section with steps ─── */}
      <section className="bg-wine text-cream py-24 sm:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-burgundy opacity-20 translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-xl mx-auto relative z-10">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-cream/50 mb-8">
            How it works
          </p>
          <div className="space-y-12">
            {[
              {
                num: "01",
                title: "Daily profiles at 11:00",
                desc: "Not 7pm. This is coffee, not cocktails. 8–12 curated profiles every morning.",
              },
              {
                num: "02",
                title: "Like or pass",
                desc: "No infinite swiping. Today's selection is today's selection.",
              },
              {
                num: "03",
                title: "Match → We plan",
                desc: "Mutual like? No chat opens. You both pick time slots, we find the overlap.",
              },
              {
                num: "04",
                title: "We pick the café",
                desc: "Based on both your neighborhoods. Specialty coffee, obviously.",
              },
              {
                num: "05",
                title: "Show up",
                desc: "30 minutes. One coffee. See if there's a vibe. Done.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-6 items-baseline">
                <span className="font-mono text-sm text-cream/40 shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-display">
                    {step.title}
                  </h3>
                  <p className="text-cream/60 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAITLIST: Deep red, big CTA ─── */}
      <section className="bg-wine text-cream py-24 sm:py-32 px-6 relative overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-burgundy opacity-25" />

        <div className="max-w-md mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-display leading-tight">
            Where dates<br />begin.
          </h2>
          <p className="mt-4 text-cream/60">
            Launching in Amsterdam. Be the first to know.
          </p>

          {submitted ? (
            <div className="mt-10">
              <div className="w-4 h-4 rounded-full bg-cream mx-auto mb-4" />
              <p className="text-xl font-display">You&apos;re in.</p>
              <p className="text-cream/60 text-sm mt-2">
                We&apos;ll reach out when it&apos;s your turn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-6 py-4 rounded-full bg-cream/10 text-cream border border-cream/20 placeholder:text-cream/30 focus:outline-none focus:border-cream/50 text-center text-lg transition-colors"
              />
              <button
                type="submit"
                className="w-full px-6 py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-white transition-colors"
              >
                Join the waitlist
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ─── FOOTER: Minimal ─── */}
      <footer className="bg-ink py-8 px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="font-display text-cream/80 text-lg">Blend</span>
          <span className="text-cream/30 text-xs font-mono">
            Amsterdam, 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
