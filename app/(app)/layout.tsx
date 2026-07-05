import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const isAdmin = session.user.role === "ADMIN"

  // LinkedIn logins can carry a personal email, so we separately collect and
  // validate a corporate email for company-matching — admin is exempt.
  if (!isAdmin) {
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workEmail: true, accounts: { where: { provider: "linkedin" }, select: { id: true } } },
    })
    if (account && account.accounts.length > 0 && !account.workEmail) {
      redirect("/auth/corp-email")
    }
  }

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
