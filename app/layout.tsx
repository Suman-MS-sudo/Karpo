import type { Metadata } from "next"
// Self-hosted Inter — bundled from node_modules at build time, no runtime
// fetch to fonts.gstatic.com (which was flaking on unreliable networks).
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "@fontsource/outfit/600.css"
import "@fontsource/outfit/700.css"
import "@fontsource/outfit/800.css"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { Providers } from "./providers"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://korpo.in"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Korpo — Your work ID. Your pass to everything else.", template: "%s | Korpo" },
  description: "India's first verified corporate employee marketplace — buy/sell, find flatmates, get referrals and share rides with verified professionals.",
  keywords: ["corporate marketplace", "employee benefits", "verified professionals", "IT professionals", "job referrals", "corporate carpool"],
  authors: [{ name: "Korpo" }],
  creator: "Korpo",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Korpo",
    title: "Korpo — Your work ID. Your pass to everything else.",
    description: "India's first verified corporate employee marketplace",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Korpo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Korpo — Your work ID. Your pass to everything else.",
    description: "India's first verified corporate employee marketplace — buy/sell, find flatmates, get referrals and share rides with verified professionals.",
    images: ["/logo.png"],
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Korpo",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "India's first verified corporate employee marketplace.",
  sameAs: [] as string[],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
