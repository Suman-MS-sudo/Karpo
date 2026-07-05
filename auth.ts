import NextAuth from "next-auth"
import type { Provider } from "next-auth/providers"
import Credentials from "next-auth/providers/credentials"
import LinkedIn from "next-auth/providers/linkedin"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { provisionUser } from "@/lib/auth-provision"

function isAdminEmail(email: string) {
  const adminEmails = (process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email)
}

// LinkedIn is a fully independent, revocable auth method: unset
// LINKEDIN_CLIENT_ID/LINKEDIN_CLIENT_SECRET (env-only, no code change) to disable
// it instantly — the provider is simply omitted and OTP sign-in is unaffected.
const linkedinEnabled = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)

const providers: Provider[] = [
    Credentials({
      credentials: {
        email: { type: "email" },
        otp: { type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const otp   = credentials?.otp as string | undefined

        if (!email || !otp) return null

        const isAdmin = isAdminEmail(email)

        // Domain guard (defence-in-depth — send-otp also validates); admin bypasses
        if (!isAdmin && isDomainBlocked(email).blocked) return null

        // Validate OTP against VerificationToken
        const token = await prisma.verificationToken.findFirst({
          where: {
            identifier: email,
            token: otp,
            expires: { gt: new Date() },
          },
        })
        if (!token) return null

        // Consume the token immediately
        await prisma.verificationToken.deleteMany({ where: { identifier: email } })

        const { dbUser } = await provisionUser(email, { isAdmin })

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image ?? dbUser.avatarUrl,
        }
      },
    }),

]

if (linkedinEnabled) {
  providers.push(
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      // Safe to auto-link by email: LinkedIn's OIDC profile only reports
      // email_verified accounts, and users already prove domain ownership via OTP.
      allowDangerousEmailAccountLinking: true,
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,

  callbacks: {
    async signIn({ user, account }) {
      // Credentials flow already validates domain + provisions the user in authorize()
      if (account?.provider !== "linkedin") return true

      const email = user.email?.trim().toLowerCase()
      if (!email) return false

      const isAdmin = isAdminEmail(email)
      // LinkedIn identity trust lets us allow personal inboxes (Gmail, Outlook, …)
      // through — only still-abusive disposable/throwaway domains stay blocked.
      if (!isAdmin && isDomainBlocked(email).reason === "temp") {
        return "/auth/signin?error=domain_blocked"
      }

      // Adapter has already created the User row for a first-time OAuth sign-in;
      // provisionUser upserts on email so it works for both new and returning users.
      // isVerified stays false until the user confirms an OTP sent to this email —
      // see /auth/verify-linkedin, enforced by app/(app)/layout.tsx.
      await provisionUser(email, { isAdmin, name: user.name, verifyImmediately: isAdmin })
      return true
    },

    async jwt({ token, user, trigger }) {
      if (user?.id || trigger === "update") {
        const id = user?.id ?? (token.sub as string)
        const dbUser = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            role: true,
            isVerified: true,
            companyId: true,
            city: true,
            avatarUrl: true,
            membership: { select: { plan: true } },
            company: { select: { name: true, logo: true, domain: true } },
          },
        })
        if (dbUser) {
          token.sub          = dbUser.id
          token.name         = dbUser.name
          token.role         = dbUser.role
          token.isVerified   = dbUser.isVerified
          token.companyId    = dbUser.companyId ?? undefined
          token.city         = dbUser.city ?? undefined
          token.avatarUrl    = dbUser.avatarUrl ?? undefined
          token.membershipPlan = dbUser.membership?.plan ?? "FREE"
          token.company      = dbUser.company ?? undefined
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id             = token.sub as string
        session.user.role           = token.role as string | undefined
        session.user.isVerified     = token.isVerified as boolean | undefined
        session.user.companyId      = token.companyId as string | undefined
        session.user.city           = token.city as string | undefined
        session.user.avatarUrl      = token.avatarUrl as string | undefined
        session.user.membershipPlan = token.membershipPlan as string | undefined
        session.user.company        = token.company as typeof session.user.company
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/signin",
  },
})
