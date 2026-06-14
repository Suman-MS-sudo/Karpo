import { redirect } from "next/navigation"

// ServicePost model is too limited for a useful creation form.
// Route users to the richer SkillListing form instead.
export default function NewServicePage() {
  redirect("/skills/new")
}
