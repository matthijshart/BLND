export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-wine text-sm font-medium">← Back to BLEND</a>

        <h1 className="text-4xl font-display text-ink mt-8 mb-2">Privacy Policy</h1>
        <p className="text-gray text-sm mb-12">Last updated: March 27, 2026</p>

        <div className="prose-blend space-y-8 text-ink-mid text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-display text-ink mb-3">1. Who we are</h2>
            <p>
              BLEND (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a dating and social platform operated from Amsterdam, the Netherlands. We are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR).
            </p>
            <p className="mt-2">
              Contact: <a href="mailto:privacy@bl-nd.nl" className="text-wine">privacy@bl-nd.nl</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">2. What data we collect</h2>
            <p>When you use BLEND, we collect:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account data:</strong> email address, password (encrypted), authentication provider</li>
              <li><strong>Profile data:</strong> name, age, gender, neighborhood, bio, interests, photos, coffee order, profile song, prompt answers</li>
              <li><strong>Usage data:</strong> likes, passes, matches, date scheduling, chat messages</li>
              <li><strong>Waitlist data:</strong> email address and city</li>
              <li><strong>Technical data:</strong> device type, browser, IP address (via Firebase Analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">3. Why we collect it</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide the BLEND service (show profiles, create matches, plan meets)</li>
              <li>Select a suitable café based on your and your match&apos;s neighborhoods</li>
              <li>Enable pre-meet chat functionality</li>
              <li>Send service-related notifications (new matches, upcoming meets)</li>
              <li>Improve the platform and user experience</li>
            </ul>
            <p className="mt-2">
              Legal basis: contract performance (Art. 6(1)(b) GDPR) and legitimate interest (Art. 6(1)(f) GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">4. How we store and protect it</h2>
            <p>
              Your data is stored on Google Firebase (Firestore, Storage, Authentication) with servers in the EU. All data is encrypted in transit (TLS) and at rest. Access to your data is restricted through Firebase Security Rules — users can only access their own profile and matches they participate in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">5. Who we share it with</h2>
            <p>
              We do not sell your data. We share limited data with:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Other BLEND users:</strong> your profile information (name, age, photos, bio, interests, prompts, coffee order) is visible to other authenticated users</li>
              <li><strong>Google Firebase:</strong> our infrastructure provider for data storage, authentication, and analytics</li>
              <li><strong>Vercel:</strong> our hosting provider</li>
            </ul>
            <p className="mt-2">We do not share your data with advertisers or other third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">6. Your rights (GDPR)</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Access:</strong> request a copy of your personal data</li>
              <li><strong>Rectification:</strong> correct inaccurate data via your profile settings</li>
              <li><strong>Erasure:</strong> delete your account and all associated data</li>
              <li><strong>Portability:</strong> receive your data in a structured format</li>
              <li><strong>Object:</strong> object to processing based on legitimate interest</li>
              <li><strong>Withdraw consent:</strong> at any time, without affecting prior processing</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, email <a href="mailto:privacy@bl-nd.nl" className="text-wine">privacy@bl-nd.nl</a> or delete your account directly in the app under Profile → Delete account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">7. Data retention</h2>
            <p>
              We retain your data for as long as your account is active. When you delete your account, we permanently delete your profile data, photos, matches, and chat messages within 30 days. Anonymized usage data may be retained for analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">8. Cookies and analytics</h2>
            <p>
              We use Firebase Analytics to understand how the app is used. This may involve cookies or similar technologies. We do not use advertising cookies or trackers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">9. Age requirement</h2>
            <p>
              BLEND is intended for users aged 18 and over. We do not knowingly collect data from anyone under 18. If we learn that a minor has created an account, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes via the app or email. Continued use of BLEND after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">11. Contact</h2>
            <p>
              Questions or complaints? Contact us at <a href="mailto:privacy@bl-nd.nl" className="text-wine">privacy@bl-nd.nl</a>.
            </p>
            <p className="mt-2">
              You also have the right to file a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens) at <a href="https://autoriteitpersoonsgegevens.nl" className="text-wine" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
