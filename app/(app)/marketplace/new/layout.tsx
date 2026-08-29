import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Post an Item",
  description: "List an item for sale on Korpo's corporate marketplace.",
}

export default function NewListingLayout({ children }: { children: React.ReactNode }) {
  return children
}
