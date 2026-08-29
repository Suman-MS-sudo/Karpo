import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://korpo.in"

// Nearly everything under this app requires a signed-in session (see
// middleware.ts — only "/", the auth flow, and the static legal/marketing
// pages are reachable without one). An anonymous crawler hitting any other
// path is redirected to /auth/signin, so there is no real content there to
// index — disallow those trees explicitly rather than let crawl budget get
// spent on sign-in redirects.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/contact", "/terms", "/privacy"],
      disallow: ["/api/", "/admin/", "/auth/", "/dashboard", "/messages", "/settings", "/notifications", "/profile/", "/my-"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
