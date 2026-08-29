import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Event",
  description: "Create and publish a new event for your professional community — treks, meetups, workshops, and more.",
}

export default function NewEventLayout({ children }: { children: React.ReactNode }) {
  return children
}
