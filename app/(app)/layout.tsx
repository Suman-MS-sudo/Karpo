import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const isAdmin = session.user.role === "ADMIN"

  // If user has no company (unknown domain), redirect to verify — admin is exempt
  if (!isAdmin && !session.user.companyId && session.user.email) {
    redirect("/auth/verify?status=unknown_company")
  }

  // If user hasn't completed onboarding (no city set), redirect — admin is exempt
  if (!isAdmin && !session.user.city && session.user.email) {
    redirect("/auth/onboard")
  }

  return <AppShell>{children}</AppShell>
}
