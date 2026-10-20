export const GRIEVANCE_LAST_UPDATED = "20 October 2026"

export const GRIEVANCE_SECTIONS = [
  { id: "who-this-is-for", title: "1. Who this is for" },
  { id: "how-to-file",     title: "2. How to file a grievance" },
  { id: "officer",         title: "3. Grievance Officer" },
  { id: "timelines",       title: "4. Timelines" },
  { id: "government",      title: "5. Government / law-enforcement requests" },
  { id: "ip",              title: "6. Intellectual-property complaints" },
  { id: "employer",        title: "7. Employer & domain objections" },
  { id: "takedown",        title: "8. How we handle takedowns" },
]

export function GrievanceContent() {
  return (
    <>
      <p>
        Korpo maintains a grievance-redressal mechanism in accordance with the Information Technology Act, 2000,
        and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, for
        complaints relating to any Content on the Platform, or any grievance about the Platform&apos;s operation.
      </p>

      <h2 id="who-this-is-for">1. Who this is for</h2>
      <p>Use this channel to raise:</p>
      <ul>
        <li>A complaint about a specific listing, message, profile, or other Content on the Platform;</li>
        <li>A report of impersonation, fraud, harassment, or a Terms/Prohibited-Content-Policy violation;</li>
        <li>A request to remove Content that infringes your intellectual property or discloses your personal information without consent;</li>
        <li>A general grievance about the Platform&apos;s functioning.</li>
      </ul>
      <p>
        If you&apos;re signed in, you can also raise most of these directly from the app via the &quot;Report&quot;
        option on a listing/profile, or through the in-app grievance form under your dashboard.
      </p>

      <h2 id="how-to-file">2. How to file a grievance</h2>
      <p>
        Write to our Grievance Officer at the email address below with a description of the issue, the URL or
        listing/user identifier involved, and any supporting evidence (screenshots, links). If you are signed
        in, please also mention the email address associated with your Korpo account so we can locate your
        report faster.
      </p>

      <h2 id="officer">3. Grievance Officer</h2>
      <ul>
        <li><strong>Grievance Officer:</strong> R. Chandrasekar</li>
        <li><strong>Email:</strong> <a href="mailto:grievance@korpo.in">grievance@korpo.in</a></li>
        <li><strong>Address:</strong> Korpo, Chennai, Tamil Nadu, India</li>
      </ul>

      <h2 id="timelines">4. Timelines</h2>
      <p>
        We acknowledge complaints within 24 (twenty-four) hours of receipt and endeavour to resolve them within
        15 (fifteen) days, in accordance with applicable law. Complex matters — for example those requiring
        verification with a third party or legal review — may take longer; we will keep you informed of status
        in that case.
      </p>

      <h2 id="government">5. Government / law-enforcement requests</h2>
      <p>
        Authorised government or law-enforcement agencies seeking information or assistance in connection with
        identity verification, the prevention, detection, investigation or prosecution of an offence, or a
        cybersecurity incident, may contact us at the email address above. Requests should be in writing,
        identify the requesting officer and the legal provision relied on, and state the information or
        assistance sought. We verify each request and respond in accordance with applicable law.
      </p>

      <h2 id="ip">6. Intellectual-property complaints</h2>
      <p>
        If you believe Content on Korpo infringes your copyright, trademark or other intellectual property,
        write to <a href="mailto:legal@korpo.in">legal@korpo.in</a> or the Grievance Officer with: your name
        and contact details; the work or mark concerned and evidence of your rights; the link to or identifier
        of the Content; and a statement that the information is accurate and that you are the rights-holder or
        authorised to act for them. We may remove or disable the Content and notify the User who posted it.
      </p>

      <h2 id="employer">7. Employer &amp; domain objections</h2>
      <p>
        Korpo uses corporate email domains only to check that a member can access a mailbox on that domain.
        It does not display employer logos or represent any employer as a partner or endorser without
        authorisation, and employers have no access to member activity. An organisation that objects to its
        domain being used for verification, or to any representation about it on the Platform, can write to the
        Grievance Officer from an official address. We will review the objection and, where appropriate,
        remove the domain from the list of eligible domains or correct the representation.
      </p>

      <h2 id="takedown">8. How we handle takedowns</h2>
      <p>
        Every report, grievance, court order or Government notice we receive follows the same steps: receipt
        and logging in our complaint register → verification of the complaint or order → review against our
        Terms, the Prohibited Content Policy and applicable law → action (removing or disabling the Content,
        or suspending the account) → notifying the complainant and, where appropriate, the User concerned →
        preserving the removed Content and associated records for at least 180 days, or longer where required
        by law. We act on valid court orders and Government notices within the timelines prescribed by law.
      </p>
    </>
  )
}
