export const COOKIE_POLICY_LAST_UPDATED = "September 2026"

export const COOKIE_POLICY_SECTIONS = [
  { id: "what-are-cookies",  title: "1. What are cookies" },
  { id: "cookies-we-use",    title: "2. Cookies we currently use" },
  { id: "no-third-party",    title: "3. Third-party trackers & analytics" },
  { id: "managing-cookies",  title: "4. Managing cookies" },
  { id: "future-changes",    title: "5. Future changes" },
  { id: "contact",           title: "6. Contact" },
]

export function CookiePolicyContent() {
  return (
    <>
      <p>
        This Cookie Policy explains how Korpo (&quot;<strong>Korpo</strong>&quot;, &quot;<strong>we</strong>&quot;,
        &quot;<strong>us</strong>&quot;) uses cookies and similar storage technologies on korpo.in and its
        subdomains (the &quot;<strong>Platform</strong>&quot;). It should be read alongside our{" "}
        <a href="/terms">Terms and Conditions</a> and <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2 id="what-are-cookies">1. What are cookies</h2>
      <p>
        Cookies are small text files placed on your device by a website. They can be used to remember your
        preferences, keep you signed in, or measure how a site is used. &quot;Similar technologies&quot; includes
        browser local storage and session storage, which the Platform also uses for the same limited purposes
        described below.
      </p>

      <h2 id="cookies-we-use">2. Cookies we currently use</h2>
      <p>
        As of the date of this policy, Korpo uses only <strong>strictly necessary</strong> cookies and local
        storage required for the Platform to function, including:
      </p>
      <ul>
        <li>Session/authentication cookies that keep you signed in (set by our authentication provider, NextAuth);</li>
        <li>A cookie or local-storage flag remembering your light/dark theme preference;</li>
        <li>CSRF-protection and similar security cookies required to safely process form submissions.</li>
      </ul>
      <p>
        These are essential to sign-in and core functionality and cannot be switched off without breaking the
        Platform. Korpo does not currently set analytics, advertising or cross-site tracking cookies.
      </p>

      <h2 id="no-third-party">3. Third-party trackers &amp; analytics</h2>
      <p>
        The Platform does not currently embed third-party analytics, advertising or social-media tracking
        scripts (such as Google Analytics or Meta Pixel). If we sign in via a third-party identity provider you
        choose to use (for example, LinkedIn), that provider may set its own cookies on its own domain during
        the sign-in redirect, governed by that provider&apos;s own cookie policy — Korpo does not control these.
      </p>

      <h2 id="managing-cookies">4. Managing cookies</h2>
      <p>
        Most browsers let you block or delete cookies through their settings. Because the Platform currently
        relies only on strictly necessary cookies for sign-in and security, blocking them will likely prevent
        you from signing in or using the Platform normally.
      </p>

      <h2 id="future-changes">5. Future changes</h2>
      <p>
        If Korpo introduces analytics, advertising, or other non-essential cookies or trackers in the future, we
        will update this Cookie Policy, identify each such cookie/tracker and its purpose, and implement an
        appropriate consent or opt-out mechanism before those cookies are set, in line with applicable law.
      </p>

      <h2 id="contact">6. Contact</h2>
      <p>
        Questions about this Cookie Policy can be sent to{" "}
        <a href="mailto:grievance@korpo.in">grievance@korpo.in</a>.
      </p>
    </>
  )
}
