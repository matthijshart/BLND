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
            <h2 className="text-xl font-display text-ink mb-3">5. BLEND Etiquette Code</h2>
            <p>
              BLEND only works if people actually show up. We don&apos;t reward swiping — we reward meeting. To protect everyone&apos;s time, the following rules apply to all confirmed meets.
            </p>

            <h3 className="font-display text-ink mt-5 mb-2">5.1 Cancellations</h3>
            <p>
              When you cancel a confirmed meet, the cancellation is recorded as a strike against your account. Strikes are weighted by how close to the meet time you cancel:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>More than 24 hours before:</strong> light strike. No immediate consequence.</li>
              <li><strong>Between 2 and 24 hours before:</strong> medium strike. Three within 60 days = ban.</li>
              <li><strong>Less than 2 hours before:</strong> heavy strike. Two within 60 days = ban.</li>
            </ul>

            <h3 className="font-display text-ink mt-5 mb-2">5.2 No-shows</h3>
            <p>
              Not showing up to a confirmed meet without warning is the most serious breach of BLEND etiquette. <strong>One reported no-show results in an immediate, permanent ban.</strong> The report must come from the other user attending the meet.
            </p>

            <h3 className="font-display text-ink mt-5 mb-2">5.3 Bans</h3>
            <p>
              When your account is banned under this Etiquette Code:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You lose access to BLEND immediately and permanently.</li>
              <li>All your active matches and upcoming meets are cancelled, so the other parties are not left waiting.</li>
              <li>Your account record (UID, email) is retained to prevent re-registration. Creating a new account with the same identity is a separate breach of these terms.</li>
              <li>You may appeal a ban by emailing <a href="mailto:hello@bl-nd.nl" className="text-wine">hello@bl-nd.nl</a>. We review every appeal personally and reverse bans in cases of genuine emergency (hospitalisation, bereavement, etc.).</li>
            </ul>

            <h3 className="font-display text-ink mt-5 mb-2">5.4 Why this is strict</h3>
            <p>
              Other dating apps tolerate flaking because it doesn&apos;t hurt their growth metrics. BLEND can&apos;t be that app. Our entire model depends on the assumption that when two people agree to coffee, they show up. If that breaks, BLEND breaks. So we hold the line — politely, transparently, but firmly.
            </p>
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
