"use client";

import { useState } from "react";
import Image from "next/image";
import { addToWaitlist } from "@/lib/db";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

export default function LandingPage() {
  // scroll-restoration: manual in globals.css handles scroll reset
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || isSubmitting) return;
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("That doesn't look like a valid email.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await addToWaitlist(trimmed, "Amsterdam");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden scroll-smooth">
      {/* ─── TOP BANNER: Coming soon ─── */}
      <div className="bg-wine text-cream py-2.5 px-4 text-center text-[11px] font-mono tracking-[0.2em] uppercase flex items-center justify-center gap-2">
        <svg width="10" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        <span>Coming soon to the App Store</span>
      </div>

      {/* ─── NAV: Subtle hamburger menu ─── */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed right-5 z-50 w-10 h-10 rounded-full bg-ink/20 backdrop-blur-md flex flex-col items-center justify-center gap-[5px] transition-all hover:bg-ink/30"
        style={{ top: "max(1.25rem, env(safe-area-inset-top, 1.25rem))" }}
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
            <button
              onClick={() => { setMenuOpen(false); setShowExample(true); }}
              className="text-3xl font-display text-cream/70 hover:text-cream transition-colors"
            >
              Example profile
            </button>
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
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-8"
          >
            Amsterdam
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-8xl sm:text-9xl md:text-[10rem] font-display tracking-tight leading-[0.82]"
          >
            BLEND
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-16 h-px bg-cream/20 mx-auto mt-8 mb-8 origin-center"
          />
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-xl sm:text-2xl text-cream/70 max-w-sm mx-auto leading-relaxed font-light"
          >
            Skip the chat.<br />
            Meet for real.
          </motion.p>

          {/* Two dots — like the two espresso cups seen from above */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="flex items-center justify-center gap-4 mt-12"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cream/80" />
            <div className="w-px h-5 bg-cream/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-cream/80" />
          </motion.div>
        </div>

        {/* Scroll indicator — animated bounce */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-cream/30 text-[10px] font-mono tracking-[0.3em]">scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-cream/15"
          />
        </motion.div>
      </section>

      {/* ─── STATEMENT: Big typographic hook ─── */}
      <section className="bg-cream py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <ScrollReveal variant="blur" duration={0.9}>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-ink leading-[0.92] text-center">
              Less swiping.
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="blur" delay={0.15} duration={0.9}>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-wine leading-[0.92] mt-3 text-center">
              More sipping.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="w-12 h-px bg-wine/30 mx-auto mt-10" />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── PHOTOS: Editorial spread — full bleed ─── */}
      <section className="bg-cream">
        <div className="grid grid-cols-2 gap-[2px]">
          <ScrollReveal variant="scale" duration={1} className="relative aspect-[3/4] overflow-hidden">
            <Image
              src="/images/Photos _ Drinks photography _ Restaurant _ Paris _ Coffee shop _ Cafe _ Latte Art.jpeg"
              alt="Latte art"
              fill
              className="object-cover"
              priority
            />
          </ScrollReveal>
          <ScrollReveal variant="scale" delay={0.15} duration={1} className="relative aspect-[3/4] overflow-hidden">
            <Image
              src="/images/_.jpeg"
              alt="Coffee date"
              fill
              className="object-cover"
              priority
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── QUOTE: One liner ─── */}
      <section className="bg-wine py-16 sm:py-20 px-6">
        <ScrollReveal variant="fade" duration={1.2}>
          <p className="max-w-lg mx-auto text-center text-2xl sm:text-3xl font-display text-cream leading-snug">
            &ldquo;Dating the way it should be: face to face.&rdquo;
          </p>
        </ScrollReveal>
      </section>

      {/* ─── NO ALCOHOL: Subtle sneer ─── */}
      <section className="bg-cream py-14 sm:py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <ScrollReveal variant="fade-up">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray/60 mb-4">
              A conscious choice
            </p>
            <h3 className="text-2xl sm:text-3xl font-display text-ink leading-snug">
              No cocktails. No wine bars.<br />
              <span className="text-wine">No liquid courage needed.</span>
            </h3>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.2}>
            <p className="mt-5 text-ink-mid text-sm leading-relaxed max-w-sm mx-auto">
              Other apps send you to a bar at 9pm. We think you&apos;re interesting enough without three glasses of Chardonnay. Daytime. Coffee. Just you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── MANIFESTO: The problem ─── */}
      <section className="bg-stripe-white py-24 sm:py-32 px-6">
        <div className="max-w-xl mx-auto">
          <ScrollReveal variant="fade-left">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray mb-10">
              The problem
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-ink leading-tight">
              Your grandmother didn&apos;t need an algorithm.
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.25}>
            <p className="mt-3 text-3xl sm:text-4xl md:text-5xl font-display text-gray-light leading-tight">
              But here we are.
            </p>
          </ScrollReveal>
          <StaggerContainer className="mt-12 space-y-6 text-ink-mid text-lg leading-relaxed" staggerDelay={0.15}>
            <StaggerItem>
              <p>
                Dating apps promised connection but gave you a screen to hide behind. BLEND removes everything that gets in the way — the endless texting, the choosing where to go, the overthinking what to say first.
              </p>
            </StaggerItem>
            <StaggerItem>
              <p>
                We pick the spot. We pick the time. Just coffee, during the day, low-key. The only thing left is you, someone worth talking to, and a flat white getting cold.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ─── HOW IT WORKS: Compact timeline ─── */}
      <section id="how" className="bg-wine text-cream py-20 sm:py-24 px-6 relative overflow-hidden scroll-mt-12">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-burgundy opacity-15 translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-lg mx-auto relative z-10">
          <ScrollReveal variant="fade">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-10 text-center">
              How it works
            </p>
          </ScrollReveal>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-cream/15" />

            <StaggerContainer className="space-y-6" staggerDelay={0.12}>
              {[
                { label: "11:00", title: "Profiles drop", desc: "8–12 curated people. Every morning." },
                { label: "Like", title: "Like or pass", desc: "No infinite scroll. Today is today." },
                { label: "Blend", title: "It\u0027s a blend", desc: "You both liked each other. Now pick your free slots — Fri to Sun, daytime." },
                { label: "Spot", title: "We handle the rest", desc: "We match your times, pick a coffee spot between your neighborhoods." },
                { label: "Meet", title: "Show up", desc: "60 min. One coffee. No small talk beforehand. That\u0027s it." },
              ].map((step, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-5">
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
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* ─── FOR EVERYONE: Inclusive positioning ─── */}
      <section id="everyone" className="bg-cream py-24 sm:py-32 px-6 scroll-mt-12">
        <div className="max-w-lg mx-auto text-center">
          <ScrollReveal variant="fade-up">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray mb-10">
              For everyone
            </p>
            <h2 className="text-3xl sm:text-4xl font-display text-ink leading-snug">
              Looking for love, friendship, or just someone to grab coffee with.
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.15}>
            <p className="mt-6 text-ink-mid text-lg leading-relaxed max-w-md mx-auto">
              New to Amsterdam? Looking for your people? We get two humans to sit down, face to face, over good coffee.
            </p>
          </ScrollReveal>

          <StaggerContainer className="flex flex-wrap justify-center gap-2.5 mt-10" staggerDelay={0.08}>
            {["Dating", "Friendship", "New in town", "Expats", "Coffee people"].map((tag) => (
              <StaggerItem key={tag}>
                <span className="px-5 py-2 rounded-full bg-wine/8 text-wine text-sm font-medium border border-wine/10 inline-block">
                  {tag}
                </span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── PRICING: Editorial, subdued, on cream ─── */}
      <section id="pricing" className="bg-cream py-24 sm:py-32 px-6 scroll-mt-12 relative overflow-hidden">
        {/* Subtle decorative circle */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-wine/[0.04] pointer-events-none" />

        <div className="max-w-md mx-auto text-center relative z-10">
          <ScrollReveal variant="fade">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-wine/60 mb-12">
              — The cost of entry —
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.1}>
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-wine mb-4">
              Only
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl sm:text-8xl font-display text-ink tracking-tight">€8,99</span>
              <span className="text-xl text-wine font-light font-display">/month</span>
            </div>
            <div className="w-8 h-px bg-wine/30 mx-auto mt-8" />
            <p className="mt-5 text-ink-mid text-sm italic font-display">
              Cancel every month. No strings attached.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade" delay={0.1}>
            <p className="mt-12 text-2xl sm:text-3xl font-display text-ink leading-snug">
              &ldquo;Your matcha costs more.<br />
              <span className="text-wine">And it never texts back.&rdquo;</span>
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="w-px h-12 bg-ink/8 mx-auto mt-12" />
          </ScrollReveal>

          <ScrollReveal variant="fade-up">
            <p className="mt-12 text-2xl sm:text-3xl font-display text-ink leading-snug">
              Join the waitlist.<br />
              <span className="text-wine">First 2 months free.</span>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── WAITLIST: Deep red CTA ─── */}
      <section id="waitlist" className="bg-wine text-cream py-24 sm:py-32 px-6 relative overflow-hidden scroll-mt-12">
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-burgundy opacity-20" />
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-burgundy opacity-15" />

        <div className="max-w-md mx-auto text-center relative z-10">
          <ScrollReveal variant="blur" duration={1}>
            <h2 className="text-4xl sm:text-5xl font-display leading-tight">
              Where dates<br />begin.
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.2}>
            <p className="mt-5 text-cream/50 max-w-xs mx-auto">
              Launching in Amsterdam. Join the waitlist and get 2 months free.
            </p>
          </ScrollReveal>

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
        <ScrollReveal variant="fade" className="px-6 mb-8">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray text-center">
            A glimpse
          </p>
        </ScrollReveal>

        <div className="flex gap-3 overflow-x-auto pl-6 pr-3 pb-4 snap-x snap-proximity scrollbar-hide">
          {[
            { src: "/images/Surf coffee.jpeg", alt: "Surf coffee", aspect: "aspect-[3/4]", width: "w-48" },
            { src: "/images/date.jpeg", alt: "Coffee date", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/Italian spot.jpeg", alt: "Italian spot", aspect: "aspect-[3/4]", width: "w-48" },
            { src: "/images/koffi3.jpeg", alt: "Coffee moment", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/datemen2.jpeg", alt: "Coffee date", aspect: "aspect-[3/4]", width: "w-48" },
            { src: "/images/hip.jpeg", alt: "Hip café", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/bike.jpeg", alt: "Amsterdam bike", aspect: "aspect-[4/5]", width: "w-44" },
            { src: "/images/boekjelezen.jpeg", alt: "Reading at a café", aspect: "aspect-[3/4]", width: "w-48" },
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
                  loading="lazy"
                  sizes="(max-width: 768px) 192px, 192px"
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
        <ScrollReveal variant="fade" duration={0.8} threshold={0.3}>
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-cream/60 text-lg">BLEND</span>
              <span className="text-cream/20 text-[10px] font-mono tracking-wider">
                Amsterdam, 2026
              </span>
            </div>
            <div className="flex gap-6 text-cream/30 text-xs">
              <a href="/privacy" className="hover:text-cream/60 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-cream/60 transition-colors">Terms of Service</a>
              <a href="mailto:privacy@bl-nd.nl" className="hover:text-cream/60 transition-colors">Contact</a>
            </div>
          </div>
        </ScrollReveal>
      </footer>
      {/* ─── EXAMPLE PROFILE MODAL ─── */}
      <AnimatePresence>
        {showExample && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowExample(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-[240px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setShowExample(false)}
                className="mb-3 text-cream/60 text-xs font-mono tracking-wider hover:text-cream transition-colors"
              >
                ← close
              </button>

              {/* iPhone shell */}
              <div className="rounded-[2.2rem] border-[5px] border-cream/10 bg-ink p-1 shadow-2xl">
                <div className="flex justify-center">
                  <div className="w-16 h-4 bg-ink rounded-b-lg" />
                </div>
                <div className="rounded-[1.8rem] overflow-hidden bg-cream mt-0.5">
                  {/* Photo */}
                  <div className="relative aspect-[3/4]">
                    <Image
                      src="/images/mockup.jpeg"
                      alt="Example profile"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
                    <div className="absolute bottom-2.5 left-3.5">
                      <p className="text-white font-display text-base">Thomas, 27</p>
                      <p className="text-white/60 text-[9px]">Jordaan</p>
                    </div>
                    <div className="absolute top-2.5 inset-x-0 flex gap-0.5 px-2.5">
                      <div className="flex-1 h-[1.5px] rounded-full bg-white/80" />
                      <div className="flex-1 h-[1.5px] rounded-full bg-white/30" />
                      <div className="flex-1 h-[1.5px] rounded-full bg-white/30" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center gap-2 bg-stripe-white rounded-lg px-2.5 py-2">
                      <span className="text-[10px]">☕</span>
                      <p className="text-ink text-[9px] font-medium">Oat flat white, extra shot</p>
                    </div>
                    <div className="bg-wine/5 rounded-lg px-2.5 py-2">
                      <p className="text-wine text-[8px] font-medium italic">Swapfiets or VanMoof?</p>
                      <p className="text-ink text-[9px] mt-0.5">VanMoof — living dangerously</p>
                    </div>
                    <div className="bg-wine/5 rounded-lg px-2.5 py-2">
                      <p className="text-wine text-[8px] font-medium italic">Noord or Zuid?</p>
                      <p className="text-ink text-[9px] mt-0.5">Noord. The ferry is half the charm</p>
                    </div>
                    <div className="flex items-center gap-2 bg-stripe-white rounded-lg px-2.5 py-2">
                      <span className="text-[10px]">🎵</span>
                      <div>
                        <p className="text-ink text-[9px] font-medium">Smalltown Boy</p>
                        <p className="text-gray text-[8px]">Bronski Beat</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center pb-2">
                    <div className="w-10 h-1 rounded-full bg-ink/10" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
