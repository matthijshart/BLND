"use client";

import { useState } from "react";
import Image from "next/image";
import { addToWaitlist } from "@/lib/db";
import { AnimatePresence, motion } from "framer-motion";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await addToWaitlist(email, "Amsterdam");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      {/* ─── NAV: Subtle hamburger menu ─── */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-ink/20 backdrop-blur-md flex flex-col items-center justify-center gap-[5px] transition-all hover:bg-ink/30"
        aria-label="Menu"
      >
        <span className={`block w-4 h-[1.5px] bg-cream/80 transition-all ${menuOpen ? "rotate-45 translate-y-[3.25px]" : ""}`} />
        <span className={`block w-4 h-[1.5px] bg-cream/80 transition-all ${menuOpen ? "-rotate-45 -translate-y-[3.25px]" : ""}`} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-wine/95 backdrop-blur-lg flex flex-col items-center justify-center gap-8"
          >
            {[
              { label: "How it works", href: "#how" },
              { label: "Pricing", href: "#pricing" },
              { label: "For everyone", href: "#everyone" },
              { label: "A glimpse", href: "#glimpse" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-3xl font-display text-cream/70 hover:text-cream transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="w-8 h-px bg-cream/20 mt-2 mb-2" />
            <a
              href="#waitlist"
              onClick={() => setMenuOpen(false)}
              className="px-8 py-3 rounded-full bg-cream/90 text-wine font-medium text-lg hover:bg-cream transition-colors"
            >
              Join and get 2 months free
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO: Full-screen crimson ─── */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center bg-wine text-cream px-6 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-burgundy opacity-30" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-burgundy opacity-20" />

        <div className="relative z-10 text-center max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-8">
            Amsterdam
          </p>
          <h1 className="text-8xl sm:text-9xl md:text-[10rem] font-display tracking-tight leading-[0.82]">
            BLEND
          </h1>
          <div className="w-16 h-px bg-cream/20 mx-auto mt-8 mb-8" />
          <p className="text-xl sm:text-2xl text-cream/70 max-w-sm mx-auto leading-relaxed font-light">
            Skip the chat.<br />
            Meet for real.
          </p>

          {/* Two dots — like the two espresso cups seen from above */}
          <div className="flex items-center justify-center gap-4 mt-12">
            <div className="w-2.5 h-2.5 rounded-full bg-cream/80" />
            <div className="w-px h-5 bg-cream/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-cream/80" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-cream/30 text-[10px] font-mono tracking-[0.3em]">scroll</span>
          <div className="w-px h-8 bg-cream/15" />
        </div>
      </section>

      {/* ─── STATEMENT: Big typographic hook ─── */}
      <section className="bg-cream py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-ink leading-[0.92] text-center">
            Less swiping.
          </h2>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-wine leading-[0.92] mt-3 text-center">
            More sipping.
          </h2>
          <div className="w-12 h-px bg-wine/30 mx-auto mt-10" />
        </div>
      </section>

      {/* ─── PHOTOS: Editorial spread — full bleed ─── */}
      <section className="bg-cream">
        <div className="grid grid-cols-2 gap-[2px]">
          <div className="relative aspect-[3/4]">
            <Image
              src="/images/Photos _ Drinks photography _ Restaurant _ Paris _ Coffee shop _ Cafe _ Latte Art.jpeg"
              alt="Latte art"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative aspect-[3/4]">
            <Image
              src="/images/_.jpeg"
              alt="Coffee date"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* ─── QUOTE: One liner ─── */}
      <section className="bg-wine py-16 sm:py-20 px-6">
        <p className="max-w-lg mx-auto text-center text-2xl sm:text-3xl font-display text-cream leading-snug">
          &ldquo;Dating the way it should be: face to face.&rdquo;
        </p>
      </section>

      {/* ─── NO ALCOHOL: Subtle sneer ─── */}
      <section className="bg-cream py-14 sm:py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray/60 mb-4">
            A conscious choice
          </p>
          <h3 className="text-2xl sm:text-3xl font-display text-ink leading-snug">
            No cocktails. No wine bars.<br />
            <span className="text-wine">No liquid courage needed.</span>
          </h3>
          <p className="mt-5 text-ink-mid text-sm leading-relaxed max-w-sm mx-auto">
            Other apps send you to a bar at 9pm. We think you&apos;re interesting enough without three glasses of Chardonnay. Daytime. Coffee. Just you.
          </p>
        </div>
      </section>

      {/* ─── MANIFESTO: The problem ─── */}
      <section className="bg-stripe-white py-24 sm:py-32 px-6">
        <div className="max-w-xl mx-auto">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray mb-10">
            The problem
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-ink leading-tight">
            Your grandmother didn&apos;t need an algorithm.
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl md:text-5xl font-display text-gray-light leading-tight">
            But here we are.
          </p>
          <div className="mt-12 space-y-6 text-ink-mid text-lg leading-relaxed">
            <p>
              Weeks of chatting that go nowhere. Infinite swiping that leads to decision fatigue.
              Alcohol-fueled evenings where nobody is really themselves.
            </p>
            <p>
              BLEND does one thing: gets two people to sit down for coffee.
              60 minutes, daytime, at a spot we pick. That&apos;s it.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS: Compact timeline ─── */}
      <section id="how" className="bg-wine text-cream py-20 sm:py-24 px-6 relative overflow-hidden scroll-mt-12">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-burgundy opacity-15 translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-lg mx-auto relative z-10">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-10 text-center">
            How it works
          </p>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-cream/15" />

            <div className="space-y-6">
              {[
                { label: "11:00", title: "Profiles drop", desc: "8–12 curated people. Every morning." },
                { label: "Like", title: "Like or pass", desc: "No infinite scroll. Today is today." },
                { label: "Blend", title: "Mutual? We plan", desc: "Pick your slots, we find the overlap." },
                { label: "Spot", title: "We pick the café", desc: "Based on your neighborhoods." },
                { label: "Date", title: "Show up", desc: "60 min. One coffee. That\u0027s it." },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-5">
                  {/* Dot */}
                  <div className="relative shrink-0">
                    <div className={`w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center ${
                      i === 4 ? "border-cream bg-cream" : "border-cream/30 bg-wine"
                    }`}>
                      {i === 4 && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b1520" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="pt-0.5">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] tracking-wider text-cream/30 uppercase">{step.label}</span>
                      <h3 className="text-lg font-display">{step.title}</h3>
                    </div>
                    <p className="text-cream/45 text-sm mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR EVERYONE: Inclusive positioning ─── */}
      <section id="everyone" className="bg-cream py-24 sm:py-32 px-6 scroll-mt-12">
        <div className="max-w-lg mx-auto text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray mb-10">
            For everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-display text-ink leading-snug">
            Looking for love, friendship, or just someone to grab coffee with.
          </h2>
          <p className="mt-6 text-ink-mid text-lg leading-relaxed max-w-md mx-auto">
            New to Amsterdam? Looking for your people? We get two humans to sit down, face to face, over good coffee.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 mt-10">
            {["Dating", "Friendship", "New in town", "Expats", "Coffee people"].map((tag) => (
              <span
                key={tag}
                className="px-5 py-2 rounded-full bg-wine/8 text-wine text-sm font-medium border border-wine/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP PREVIEW: iPhone mockup + feature highlights ─── */}
      <section className="bg-wine py-24 sm:py-32 px-6 relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-burgundy opacity-20" />

        <div className="max-w-3xl mx-auto relative z-10">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-10 text-center">
            Inside the app
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
            {/* iPhone mockup */}
            <div className="shrink-0">
              <div className="w-[220px] rounded-[2.5rem] border-[6px] border-cream/15 bg-ink p-1.5 shadow-2xl">
                {/* Notch */}
                <div className="flex justify-center mb-1">
                  <div className="w-20 h-5 bg-ink rounded-b-xl" />
                </div>
                {/* Screen content — fake profile card */}
                <div className="rounded-[2rem] overflow-hidden bg-cream">
                  {/* Profile photo area */}
                  <div className="relative aspect-[3/4] bg-stripe-white">
                    <Image
                      src="/images/date.jpeg"
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <p className="text-white font-display text-lg">Sophie, 27</p>
                      <p className="text-white/60 text-[10px]">De Pijp</p>
                    </div>
                    {/* Photo dots */}
                    <div className="absolute top-3 inset-x-0 flex gap-1 px-3">
                      <div className="flex-1 h-[2px] rounded-full bg-white/80" />
                      <div className="flex-1 h-[2px] rounded-full bg-white/30" />
                      <div className="flex-1 h-[2px] rounded-full bg-white/30" />
                    </div>
                  </div>
                  {/* Prompts preview */}
                  <div className="p-3 space-y-2">
                    <div className="bg-wine/5 rounded-lg p-2.5">
                      <p className="text-wine text-[8px] font-medium italic">Swapfiets or VanMoof?</p>
                      <p className="text-ink text-[10px] mt-0.5">VanMoof — I like living dangerously</p>
                    </div>
                    <div className="flex items-center gap-2 bg-stripe-white rounded-lg p-2.5">
                      <span className="text-xs">☕</span>
                      <div>
                        <p className="text-[8px] text-gray">Their order</p>
                        <p className="text-[10px] text-ink font-medium">Oat flat white</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-wine/5 rounded-lg p-2.5">
                      <div>
                        <p className="text-[8px] text-gray">Coffee compatibility</p>
                        <p className="text-[11px] text-wine font-display">82% match</p>
                      </div>
                      <span className="text-xs">☕☕</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="flex-1 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center">
                    <span className="text-sm">☕</span>
                  </div>
                  <h3 className="font-display text-xl text-cream">Coffee compatibility</h3>
                </div>
                <p className="text-cream/50 text-sm leading-relaxed pl-11">
                  Both oat flat white people? Perfect match. Espresso vs frappuccino? Opposites attract.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center">
                    <span className="text-sm">⚡</span>
                  </div>
                  <h3 className="font-display text-xl text-cream">Amsterdam dilemmas</h3>
                </div>
                <p className="text-cream/50 text-sm leading-relaxed pl-11">
                  Swapfiets or VanMoof? IJhallen or Negen Straatjes? Noord or Zuid? Your answers say more than a bio ever could.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center">
                    <span className="text-sm">🎵</span>
                  </div>
                  <h3 className="font-display text-xl text-cream">Profile songs</h3>
                </div>
                <p className="text-cream/50 text-sm leading-relaxed pl-11">
                  Pick your date soundtrack. It plays when someone views your profile. First impressions, elevated.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center">
                    <span className="text-sm">📍</span>
                  </div>
                  <h3 className="font-display text-xl text-cream">We pick the spot</h3>
                </div>
                <p className="text-cream/50 text-sm leading-relaxed pl-11">
                  A real Amsterdam café, halfway between your neighborhoods. No planning, no stress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING: Clean and bold ─── */}
      <section id="pricing" className="bg-stripe-white py-24 sm:py-32 px-6 scroll-mt-12">
        <div className="max-w-md mx-auto text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray mb-10">
            Simple pricing
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-7xl sm:text-8xl font-display text-ink">€8,99</span>
            <span className="text-xl text-gray font-light">/month</span>
          </div>
          <p className="mt-8 text-ink-mid text-lg leading-relaxed">
            Daily profiles. Real blends.<br />
            Spot selected for you.
          </p>

          <div className="w-px h-12 bg-ink/8 mx-auto mt-12" />

          <p className="mt-12 text-2xl sm:text-3xl font-display text-ink leading-snug">
            Join the waitlist.<br />
            <span className="text-wine">First 2 months free.</span>
          </p>
          <p className="mt-4 text-gray text-sm tracking-wide">
            No commitment. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ─── WAITLIST: Deep red CTA ─── */}
      <section id="waitlist" className="bg-wine text-cream py-24 sm:py-32 px-6 relative overflow-hidden scroll-mt-12">
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-burgundy opacity-20" />
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-burgundy opacity-15" />

        <div className="max-w-md mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-display leading-tight">
            Where dates<br />begin.
          </h2>
          <p className="mt-5 text-cream/50 max-w-xs mx-auto">
            Launching in Amsterdam. Join the waitlist and get 2 months free.
          </p>

          {submitted ? (
            <div className="mt-12">
              <div className="w-12 h-12 rounded-full border-2 border-cream/40 mx-auto mb-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cream">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-2xl font-display">You&apos;re in.</p>
              <p className="text-cream/50 text-sm mt-3 max-w-xs mx-auto">
                Your first 2 months are on us. We&apos;ll reach out when it&apos;s your turn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-6 py-4 rounded-full bg-cream/8 text-cream border border-cream/15 placeholder:text-cream/25 focus:outline-none focus:border-cream/40 text-center text-lg transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 rounded-full bg-cream text-wine font-medium text-lg hover:bg-stripe-white transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Joining..." : "Join the waitlist — 2 months free"}
              </button>
              {error && (
                <p className="text-coral text-sm mt-2">{error}</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ─── DISCOVER: Horizontal scrollable mood gallery ─── */}
      <section id="glimpse" className="bg-cream py-16 sm:py-20 overflow-hidden scroll-mt-12">
        <div className="px-6 mb-8">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray text-center">
            A glimpse
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pl-6 pr-3 pb-4 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {[
            { src: "/images/Surf coffee.jpeg", alt: "Surf coffee", aspect: "aspect-[3/4]", width: "w-48" },
            { src: "/images/date.jpeg", alt: "Coffee date", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/Italian spot.jpeg", alt: "Italian spot", aspect: "aspect-[3/4]", width: "w-48" },
            { src: "/images/koffi3.jpeg", alt: "Coffee moment", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/datemen2.jpeg", alt: "Coffee date", aspect: "aspect-[3/4]", width: "w-48" },
            { src: "/images/hip.jpeg", alt: "Hip café", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/bike.jpeg", alt: "Amsterdam bike", aspect: "aspect-[4/5]", width: "w-44" },
          ].map((photo, i) => (
            <div
              key={i}
              className={`${photo.width} shrink-0 snap-center`}
            >
              <div className={`relative ${photo.aspect} rounded-2xl overflow-hidden`}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
          <div className="w-3 shrink-0" />
        </div>

        <p className="text-center text-gray text-sm mt-6 px-6">
          Real coffee. Real people. Real Amsterdam.
        </p>
      </section>

      {/* ─── FOOTER: Minimal ─── */}
      <footer className="bg-ink py-10 px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="font-display text-cream/60 text-lg">BLEND</span>
          <span className="text-cream/20 text-[10px] font-mono tracking-wider">
            Amsterdam, 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
