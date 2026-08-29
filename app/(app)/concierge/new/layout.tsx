import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Concierge Request",
  description: "Submit a new request for tax, legal, insurance, or financial planning assistance from Korpo Concierge.",
}

export default function ConciergeNewLayout({ children }: { children: React.ReactNode }) {
  return children
}
