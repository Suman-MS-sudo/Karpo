export const PROHIBITED_CONTENT_LAST_UPDATED = "September 2026"

export const PROHIBITED_CONTENT_SECTIONS = [
  { id: "scope",           title: "1. Scope" },
  { id: "prohibited-goods", title: "2. Prohibited goods & services" },
  { id: "prohibited-content", title: "3. Prohibited content & conduct" },
  { id: "category-rules",  title: "4. Category-specific rules" },
  { id: "reporting",       title: "5. Reporting & takedown" },
  { id: "enforcement",     title: "6. Enforcement" },
]

export function ProhibitedContentPolicyContent() {
  return (
    <>
      <p>
        This Prohibited Content, Goods &amp; Services Policy (&quot;<strong>Policy</strong>&quot;) sets out what
        may not be listed, posted or shared on Korpo (&quot;<strong>Platform</strong>&quot;), across every
        service — Marketplace, Rentals, Job Referrals, Skills Marketplace, Carpooling, Events, and messaging.
        It supplements, and forms part of, our <a href="/terms">Terms and Conditions</a>.
      </p>

      <h2 id="scope">1. Scope</h2>
      <p>
        This Policy applies to every listing, message, review, profile field, image or other content a User
        submits anywhere on the Platform. Korpo is an intermediary and does not pre-screen listings before they
        go live; this Policy is enforced through User reporting, admin review and takedown after the fact,
        as described in Section 5.
      </p>

      <h2 id="prohibited-goods">2. Prohibited goods &amp; services</h2>
      <p>You may not list, offer, sell, rent, exchange, or advertise any of the following on the Platform:</p>
      <ul>
        <li>Narcotics, controlled substances, or drug paraphernalia;</li>
        <li>Firearms, ammunition, explosives, or weapons of any kind;</li>
        <li>Stolen, counterfeit, replica, or unauthorised-copy goods, or goods infringing any trademark, copyright, patent or design right;</li>
        <li>Currency, cryptocurrency, lottery tickets, or gambling/betting services;</li>
        <li>Prescription drugs, medical devices, or healthcare services requiring a licence you do not hold;</li>
        <li>Wildlife, wildlife products, or any item prohibited under the Wildlife Protection Act or CITES;</li>
        <li>Any goods or services that are illegal to sell, own, or provide under Indian law, or that require a government licence or authorisation you do not hold;</li>
        <li>Adult content, escort or sexual services;</li>
        <li>Multi-level-marketing, pyramid schemes, or "get rich quick" financial schemes;</li>
        <li>Property you are not authorised to sell, rent, or sublet, or a ride/vehicle you are not legally permitted to operate for the purpose offered;</li>
        <li>Fake, unauthorised or misleading job postings, or postings misrepresenting the identity of the employer.</li>
      </ul>

      <h2 id="prohibited-content">3. Prohibited content &amp; conduct</h2>
      <p>Regardless of category, you may not post, upload, or transmit content that:</p>
      <ul>
        <li>Is unlawful, defamatory, obscene, pornographic, or invasive of another person&apos;s privacy;</li>
        <li>Is harassing, threatening, hateful, or racially, ethnically or otherwise objectionable;</li>
        <li>Impersonates any person or entity, or misrepresents your affiliation with an employer or organisation;</li>
        <li>Is knowingly false or misleading about a product, property, job, service, ride, or event;</li>
        <li>Discloses another person&apos;s private information (phone number, address, financial details) without consent, or attempts to route contact outside the Platform to evade its safety features;</li>
        <li>Discloses your employer&apos;s confidential, proprietary, or trade-secret information, or offers employer-owned assets for sale without authorisation;</li>
        <li>Uses another party&apos;s copyrighted photographs, logos, trademarks, or documents without permission;</li>
        <li>Constitutes spam, unsolicited solicitation, or repetitive/duplicate postings.</li>
      </ul>

      <h2 id="category-rules">4. Category-specific rules</h2>
      <p>
        Some services carry additional rules published within that section of the Platform (for example,
        Carpooling participants must hold a valid driving licence and comply with applicable motor vehicle law,
        and must not use the Platform to operate an unauthorised commercial passenger transport service). Where
        a category-specific rule conflicts with this Policy, the more restrictive rule applies.
      </p>

      <h2 id="reporting">5. Reporting &amp; takedown</h2>
      <p>
        Any User can report a listing, message, or profile that appears to violate this Policy using the
        &quot;Report&quot; option available on that listing or profile, or by writing to{" "}
        <a href="mailto:grievance@korpo.in">grievance@korpo.in</a>. Reports are reviewed by our team, and
        content found in violation is removed or disabled. See our{" "}
        <a href="/grievance">Grievance Redressal</a> page for our complaint-handling process and timelines.
      </p>

      <h2 id="enforcement">6. Enforcement</h2>
      <p>
        Violating this Policy may result in removal of the specific content, suspension or termination of your
        account, and — where the violation may involve a criminal offence — a report to the appropriate
        law-enforcement authority. Korpo preserves removed content and associated records for the period
        required under applicable law.
      </p>
    </>
  )
}
