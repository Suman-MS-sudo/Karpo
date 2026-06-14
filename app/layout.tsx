import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: { default: "Korpo — Your work ID. Your pass to everything else.", template: "%s | Korpo" },
  description: "India's first verified corporate employee marketplace. Buy/sell, find flatmates, get referrals, share rides and more — exclusively for IT, MNC and banking professionals.",
  keywords: ["corporate marketplace", "employee benefits", "verified professionals", "IT professionals", "job referrals", "corporate carpool"],
  authors: [{ name: "Korpo" }],
  creator: "Korpo",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
