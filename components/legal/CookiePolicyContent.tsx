import { CookieSettingsButton } from "@/components/legal/CookieConsentBanner"

export const COOKIE_POLICY_LAST_UPDATED = "20 October 2026"

export const COOKIE_POLICY_SECTIONS = [
  { id: "about",             title: "1. About this policy" },
  { id: "what-are-cookies",  title: "2. What are cookies" },
  { id: "categories",        title: "3. Categories we use" },
  { id: "cookies-we-set",    title: "4. Cookies we set" },
  { id: "storage",           title: "5. Local & session storage" },
  { id: "third-party",       title: "6. Third-party services" },
  { id: "no-tracking",       title: "7. What we do not use" },
  { id: "consent",           title: "8. Your consent & choices" },
  { id: "browser-controls",  title: "9. Browser controls" },
  { id: "retention",         title: "10. How long cookies last" },
  { id: "changes",           title: "11. Changes to this policy" },
  { id: "contact",           title: "12. Contact" },
]

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto my-4 not-prose">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="text-left font-semibold border-b border-gray-200 py-2 pr-4 align-bottom">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className="border-b border-gray-100 py-2 pr-4">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CookiePolicyContent() {
  return (
    <>
      <h2 id="about">1. About this policy</h2>
      <p>
        This Cookie Policy explains how Korpo, operated by Arka India Technology Solutions LLP
        (&quot;<strong>Korpo</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;), uses
        cookies and similar technologies on korpo.in and its subdomains (the &quot;<strong>Platform</strong>&quot;).
        It lists every cookie and browser-storage item the Platform sets, and every third-party service the
        Platform loads that may set its own cookies or receive your device information. It should be read
        together with our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms and Conditions</a>.
        It is issued in line with the Information Technology Act, 2000, the rules made under it, and the Digital
        Personal Data Protection Act, 2023 to the extent in force.
      </p>

      <h2 id="what-are-cookies">2. What are cookies</h2>
      <p>
        Cookies are small text files that a website stores in your browser. They let the site recognise your
        browser on later requests — for example, to keep you signed in. &quot;Similar technologies&quot; means
        browser <em>local storage</em> and <em>session storage</em>, which store small values on your device
        without sending them to our servers on every request. In this policy, &quot;cookies&quot; covers all of
        these unless stated otherwise.
      </p>
      <p>
        <strong>First-party</strong> cookies are set by korpo.in. <strong>Third-party</strong> cookies are set by
        another company&apos;s domain when the Platform loads that company&apos;s content (for example, an
        embedded map).
      </p>

      <h2 id="categories">3. Categories we use</h2>
      <ul>
        <li>
          <strong>Strictly necessary</strong> — required to sign you in, keep your session secure, protect
          forms against cross-site request forgery, and remember your cookie choice. The Platform cannot work
          without them, so they cannot be switched off. They are not used for advertising or tracking.
        </li>
        <li>
          <strong>Preferences</strong> (browser storage only) — remember choices you make in the interface,
          such as light/dark theme or which sidebar items you pinned. They stay on your device and are never
          sent to us. They are part of the service you asked for, so they are treated as necessary.
        </li>
        <li>
          <strong>Functional &amp; third-party embeds</strong> (optional) — content from third parties that
          may set their own cookies, currently Google Maps location previews. These are <strong>off by
          default</strong> and only load after you allow them.
        </li>
      </ul>
      <p>We do not use analytics, advertising, profiling or social-media tracking cookies (see Section 7).</p>

      <h2 id="cookies-we-set">4. Cookies we set</h2>
      <p>
        On the live site, some names carry a <code>__Secure-</code> or <code>__Host-</code> prefix. These
        prefixes tell the browser to send the cookie only over HTTPS.
      </p>
      <Table
        head={["Cookie", "Category", "Purpose", "Duration"]}
        rows={[
          [<code key="a">authjs.session-token</code>, "Strictly necessary", "Keeps you signed in. Holds an encrypted session token, not your password. Renewed while you are active.", "Expires after 15 minutes without activity"],
          [<code key="b">authjs.csrf-token</code>, "Strictly necessary", "Protects sign-in and other forms against cross-site request forgery.", "Session (until browser closes)"],
          [<code key="c">authjs.callback-url</code>, "Strictly necessary", "Remembers which page to return you to after sign-in.", "Session"],
          [<><code>authjs.state</code>, <br />, <code>authjs.pkce.code_verifier</code></>, "Strictly necessary", "Set only while you sign in with LinkedIn, to secure the sign-in redirect.", "15 minutes"],
          [<code key="e">skip_password_setup</code>, "Strictly necessary", "Remembers that you chose to skip the optional password-setup prompt.", "7 days"],
          [<code key="f">korpo_cookie_consent</code>, "Strictly necessary", "Stores your cookie choice, the policy version you answered and when, so we don't ask again on every page.", "180 days"],
        ]}
      />

      <h2 id="storage">5. Local &amp; session storage</h2>
      <p>These values stay in your browser and are never sent to our servers automatically.</p>
      <Table
        head={["Key", "Type", "Purpose", "Duration"]}
        rows={[
          [<code key="a">theme</code>, "Local storage", "Your light / dark / system theme preference.", "Until you clear it"],
          [<code key="b">korpo:pinned-rail</code>, "Local storage", "Services you pinned to the sidebar.", "Until you clear it"],
          [<code key="c">korpo:rail-pane-pinned</code>, "Local storage", "Whether the sidebar panel stays open.", "Until you clear it"],
          [<code key="d">korpo-admin-users-columns-v1</code>, "Local storage", "Column layout of the admin users table (administrators only).", "Until you clear it"],
          [<code key="e">rentals-new-draft</code>, "Session storage", "Saves an unfinished rental listing so a page refresh doesn't lose it.", "Until the tab is closed or the listing is posted"],
        ]}
      />

      <h2 id="third-party">6. Third-party services</h2>
      <p>
        Some features load content from other companies. When they do, your browser connects to that company
        directly, and it receives your IP address and browser details. It may also set its own cookies under its
        own policies, which Korpo does not control.
      </p>
      <Table
        head={["Service", "When it loads", "What it may do", "Category"]}
        rows={[
          [
            "Google Maps (Google LLC)",
            "Map previews on event and skill forms — only after you allow functional cookies",
            <>May set Google cookies (for example <code>NID</code>, <code>AEC</code>, <code>SOCS</code>). <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">Google cookie policy</a></>,
            "Functional (optional)",
          ],
          [
            "Google Maps link",
            "Only if you click “Open in Google Maps” on a rental",
            "Opens Google Maps in a new tab under Google's own policies. Nothing loads until you click.",
            "—",
          ],
          [
            "OpenStreetMap tiles & Nominatim (OpenStreetMap Foundation)",
            "Interactive maps and location search on rentals, carpool, marketplace and events",
            <>Receives your IP address and the area or search text you look up. Sets no cookies. <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OSMF privacy policy</a></>,
            "Strictly necessary for the map feature you use",
          ],
          [
            "unpkg.com (CDN)",
            "Map pages, to load the map library's stylesheet",
            "Receives your IP address. Sets no cookies.",
            "Strictly necessary for the map feature you use",
          ],
          [
            "Razorpay",
            "Only when you start a payment (Premium, listing boost, paid event)",
            <>Razorpay&apos;s checkout sets its own cookies for fraud prevention and payment processing. <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Razorpay privacy policy</a></>,
            "Strictly necessary for the payment you requested",
          ],
          [
            "LinkedIn",
            "Only if you choose “Continue with LinkedIn”",
            <>You are redirected to linkedin.com, which sets its own cookies under its own policy. <a href="https://www.linkedin.com/legal/cookie-policy" target="_blank" rel="noopener noreferrer">LinkedIn cookie policy</a></>,
            "Strictly necessary for the sign-in method you chose",
          ],
        ]}
      />

      <h2 id="no-tracking">7. What we do not use</h2>
      <p>
        Korpo does not use Google Analytics, Meta Pixel, advertising networks, retargeting, fingerprinting,
        cross-site tracking, or social-media &quot;like&quot;/&quot;share&quot; widgets. We do not sell or
        share cookie data with advertisers. If we ever add analytics or other non-essential technologies, we
        will first update this policy, list each cookie and its purpose, and load it only after you consent.
      </p>

      <h2 id="consent">8. Your consent &amp; choices</h2>
      <p>
        On your first visit, a cookie notice asks you to choose between <strong>Accept all</strong>,{" "}
        <strong>Necessary only</strong>, or <strong>Manage preferences</strong>. Strictly necessary cookies
        are always active, because the Platform cannot work without them. Optional categories stay off unless
        you switch them on.
      </p>
      <p>
        We record your choice, the policy version and the time — both in the <code>korpo_cookie_consent</code>{" "}
        cookie and in a consent log on our servers (linked to your account if you are signed in) — as evidence
        of consent. You can change or withdraw your consent at any time; withdrawing does not affect anything
        already loaded with your consent. If this policy changes materially, we will ask you again.
      </p>
      <p>
        <CookieSettingsButton className="font-semibold underline">Change your cookie settings</CookieSettingsButton>
      </p>

      <h2 id="browser-controls">9. Browser controls</h2>
      <p>
        You can also block or delete cookies and site data in your browser&apos;s settings (for example, Chrome:
        Settings → Privacy and security → Cookies; Safari: Settings → Privacy; Firefox: Settings → Privacy &amp;
        Security). If you block strictly necessary cookies, you will not be able to sign in or use most of the
        Platform. Clearing site data also clears your cookie choice, so you will be asked again.
      </p>

      <h2 id="retention">10. How long cookies last</h2>
      <p>
        The tables above give the duration of each cookie and storage item. Your consent choice lasts 180 days,
        after which we ask again. Consent-log records on our servers are kept for as long as needed to show
        that consent was obtained, in line with our <a href="/privacy#retention">data retention practices</a>.
      </p>

      <h2 id="changes">11. Changes to this policy</h2>
      <p>
        We review this policy whenever we add, remove or change a cookie or third-party service. The
        &quot;Last updated&quot; date at the top shows the latest version. If a change adds an optional
        category or changes how we use your data, we will ask for your consent again before it takes effect.
      </p>

      <h2 id="contact">12. Contact</h2>
      <p>
        Questions about this Cookie Policy can be sent to our Grievance Officer at{" "}
        <a href="mailto:grievance@korpo.in">grievance@korpo.in</a>, or see our{" "}
        <a href="/grievance">Grievance Redressal</a> page.
      </p>
    </>
  )
}
