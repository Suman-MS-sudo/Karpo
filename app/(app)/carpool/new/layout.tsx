import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Offer a Ride",
  description: "Post your daily commute route and let fellow members book a seat to split the cost of your ride.",
}

export default function NewCarpoolLayout({ children }: { children: React.ReactNode }) {
  return children
}
