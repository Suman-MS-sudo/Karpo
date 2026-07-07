import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const isAdmin = session.user.role === "ADMIN"

  // Temporary exemption from the password-setup prompt for specific test/demo
  // accounts — remove once no longer needed.
  const PASSWORD_SETUP_EXEMPT = new Set([
    "charan-kumar-baalaje.chandrasekar@capgemini.com",
    "testckb@korpo.com",
    "mssworlz@gmail.com",
  ])
  const skipPasswordSetup = Boolean(session.user.email && PASSWORD_SETUP_EXEMPT.has(session.user.email.toLowerCase()))

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

  // Prompt verified users to set a password so future logins don't require
  // repeating OTP/LinkedIn/ID-card verification — skippable via cookie.
  if (!isAdmin && !skipPasswordSetup && session.user.isVerified && !(await cookies()).get("skip_password_setup")) {
    const pwUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } })
    if (pwUser && !pwUser.passwordHash) {
      redirect("/auth/set-password")
    }
  }

  return <AppShell>{children}</AppShell>
}
