export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-wine text-sm font-medium">← Back to BLEND</a>

        <h1 className="text-4xl font-display text-ink mt-8 mb-2">Terms of Service</h1>
        <p className="text-gray text-sm mb-12">Last updated: March 27, 2026</p>

        <div className="prose-blend space-y-8 text-ink-mid text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-display text-ink mb-3">1. Welcome to BLEND</h2>
            <p>
              BLEND is a dating and social platform that connects people over coffee in Amsterdam. By creating an account, you agree to these terms. If you don&apos;t agree, please don&apos;t use BLEND.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">2. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years old</li>
              <li>You must provide accurate information in your profile</li>
              <li>You may only create one account</li>
              <li>You are responsible for keeping your login credentials secure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">3. How BLEND works</h2>
            <p>
              BLEND provides daily curated profiles. Mutual interest creates a &quot;blend.&quot; BLEND then facilitates scheduling a coffee meet at a selected café. A short chat window opens 2 hours before the meet for logistics.
            </p>
            <p className="mt-2">
              BLEND selects the time and venue based on both users&apos; availability and neighborhoods. You are not obligated to attend any meet, but repeated cancellations or no-shows may result in temporary account restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">4. Your conduct</h2>
            <p>When using BLEND, you agree to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Be respectful and honest in all interactions</li>
              <li>Not use BLEND for commercial purposes, advertising, or solicitation</li>
              <li>Not upload offensive, explicit, or misleading content</li>
              <li>Not harass, threaten, or abuse other users</li>
              <li>Not impersonate another person</li>
              <li>Not attempt to access other users&apos; data or circumvent security measures</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or delete accounts that violate these terms, without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">5. Cancellation policy</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You may cancel a confirmed meet once without penalty</li>
              <li>A second cancellation may result in a 3-day account freeze</li>
              <li>No-shows reported by the other user may result in account restrictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">6. Subscription and payment</h2>
            <p>
              BLEND offers a subscription service at €8.99/month. Subscriptions renew automatically unless cancelled. You can cancel anytime through your account settings. No refunds are provided for partial months.
            </p>
            <p className="mt-2">
              Waitlist members who sign up before launch receive 2 months free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">7. Your content</h2>
            <p>
              You retain ownership of the photos and text you upload to BLEND. By uploading, you grant BLEND a non-exclusive, worldwide license to display your content to other users as part of the service. This license ends when you delete the content or your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">8. Safety and liability</h2>
            <p>
              BLEND facilitates introductions but is not responsible for the behavior of users during or after meets. We recommend meeting in public places (which our café selection ensures) and trusting your instincts.
            </p>
            <p className="mt-2">
              BLEND is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from your use of the platform or interactions with other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">9. Account deletion</h2>
            <p>
              You can delete your account at any time through Profile → Delete account. This will permanently remove your profile, photos, matches, and messages. This action cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">10. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of significant changes. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">11. Governing law</h2>
            <p>
              These terms are governed by the laws of the Netherlands. Any disputes shall be submitted to the competent courts in Amsterdam.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-ink mb-3">12. Contact</h2>
            <p>
              Questions about these terms? Email us at <a href="mailto:privacy@bl-nd.nl" className="text-wine">privacy@bl-nd.nl</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
