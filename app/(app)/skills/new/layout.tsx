import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "List a Skill",
  description: "Create a new skill listing to offer freelance work, coaching, or consulting services to clients on Korpo.",
}

export default function SkillsNewLayout({ children }: { children: React.ReactNode }) {
  return children
}
