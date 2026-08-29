import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Post a Rental / Flatmate",
  description: "List a rental property, room, PG, or flatmate opening on Korpo.",
}

export default function NewRentalLayout({ children }: { children: React.ReactNode }) {
  return children
}
