import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Post a Referral",
  description: "Post a job referral for an opening at your company and help someone in the Korpo community get hired.",
}

export default function ReferralsNewLayout({ children }: { children: React.ReactNode }) {
  return children
}
