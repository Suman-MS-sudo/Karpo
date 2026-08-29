import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create a Course",
  description: "Create a new course to teach and enroll students on Korpo's Learning Hub.",
}

export default function LearningNewLayout({ children }: { children: React.ReactNode }) {
  return children
}
