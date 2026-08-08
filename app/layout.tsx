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

export const metadata: Metadata = {
  title: { default: "Korpo — Your work ID. Your pass to everything else.", template: "%s | Korpo" },
  description: "India's first verified corporate employee marketplace. Buy/sell, find flatmates, get referrals, share rides and more — exclusively for IT, MNC and banking professionals.",
  keywords: ["corporate marketplace", "employee benefits", "verified professionals", "IT professionals", "job referrals", "corporate carpool"],
  authors: [{ name: "Korpo" }],
  creator: "Korpo",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://korpo.in",
    siteName: "Korpo",
    title: "Korpo — Your work ID. Your pass to everything else.",
    description: "India's first verified corporate employee marketplace",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Korpo" }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
