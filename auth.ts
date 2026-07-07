import NextAuth from "next-auth"
import type { Provider } from "next-auth/providers"
import Credentials from "next-auth/providers/credentials"
import LinkedIn from "next-auth/providers/linkedin"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { provisionUser } from "@/lib/auth-provision"
import { verifyPassword } from "@/lib/password"

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
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email    = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const otp      = credentials?.otp as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || (!otp && !password)) return null

        const isAdmin = isAdminEmail(email)

        // Domain guard (defence-in-depth — send-otp also validates); admin bypasses
        if (!isAdmin && isDomainBlocked(email).blocked) return null

        // Password login — set up once after a first OTP/LinkedIn/ID-card
        // verification (see /auth/set-password), used on return visits instead
        // of re-verifying every time.
        if (password) {
          const dbUser = await prisma.user.findUnique({ where: { email } })
          if (!dbUser?.passwordHash) return null
          if (!(await verifyPassword(password, dbUser.passwordHash))) return null

          if (!isAdmin) {
            const idRequest = await prisma.idVerificationRequest.findUnique({ where: { corpEmail: email } })
            if (idRequest && idRequest.status !== "APPROVED") return null
          }

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image ?? dbUser.avatarUrl,
          }
        }

        // Validate OTP against VerificationToken
        const token = await prisma.verificationToken.findFirst({
          where: {
            identifier: email,
            token: otp,
            expires: { gt: new Date() },
          },
        })
        if (!token) return null

        // Block login while an org ID card verification is outstanding, even if an
        // OTP was already issued before the request was filed (see send-otp route).
        if (!isAdmin) {
          const idRequest = await prisma.idVerificationRequest.findUnique({ where: { corpEmail: email } })
          if (idRequest && idRequest.status !== "APPROVED") return null
        }

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
  // Inactivity logout: the session cookie's expiry is (re)stamped to now + maxAge
  // on every request that's older than updateAge since the last stamp, so an idle
  // session (no requests) expires 15 minutes after the last activity.
  session: { strategy: "jwt", maxAge: 15 * 60, updateAge: 60 },
  providers,

  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials flow already validates domain + provisions the user in authorize()
      if (account?.provider !== "linkedin") return true

      // `user.email` reflects whatever email was stored on the User row the last
      // time this LinkedIn account (providerAccountId) was linked — it does NOT
      // update on its own if the member later changes their LinkedIn primary
      // email. `profile.email` is the live value from today's OIDC token, so it's
      // the one we trust; if it drifted from the stored value, sync it here.
      // Otherwise every future login with this LinkedIn identity keeps resolving
      // to the old email forever, even after the member's LinkedIn email changes.
      const liveEmail = (profile?.email as string | undefined)?.trim().toLowerCase()
      if (!liveEmail) return false

      // The "safe to auto-link by email" assumption above only holds if LinkedIn
      // actually verified this address — enforce that rather than assuming it.
      if (profile?.email_verified !== true) {
        return "/auth/signin?error=email_conflict"
      }

      if (user.id && liveEmail !== user.email?.trim().toLowerCase()) {
        const conflict = await prisma.user.findUnique({ where: { email: liveEmail }, select: { id: true } })
        if (conflict && conflict.id !== user.id) {
          // Someone else already owns that email outright — don't silently merge accounts.
          return "/auth/signin?error=email_conflict"
        }
        await prisma.user.update({ where: { id: user.id }, data: { email: liveEmail } })
      }

      const email = liveEmail
      const isAdmin = isAdminEmail(email)
      // LinkedIn identity trust lets us allow personal inboxes (Gmail, Outlook, …)
      // through — only still-abusive disposable/throwaway domains stay blocked.
      if (!isAdmin && isDomainBlocked(email).reason === "temp") {
        return "/auth/signin?error=domain_blocked"
      }

      // Adapter has already created the User row for a first-time OAuth sign-in;
      // provisionUser upserts on email so it works for both new and returning users.
      // LinkedIn's own login is trusted as sufficient verification — no follow-up OTP.
      await provisionUser(email, { isAdmin, name: user.name })
      return true
    },

    async jwt({ token, user, trigger }) {
      if (user?.id || trigger === "update") {
        const id = user?.id ?? (token.sub as string)
        const dbUser = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isVerified: true,
            companyId: true,
            workEmail: true,
            city: true,
            avatarUrl: true,
            membership: { select: { plan: true } },
            company: { select: { name: true, logo: true, domain: true } },
          },
        })
        if (dbUser) {
          token.sub          = dbUser.id
          token.email        = dbUser.email
          token.name         = dbUser.name
          token.role         = dbUser.role
          token.isVerified   = dbUser.isVerified
          token.companyId    = dbUser.companyId ?? undefined
          token.workEmail    = dbUser.workEmail ?? undefined
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
        session.user.email          = (token.email as string | undefined) ?? session.user.email
        session.user.role           = token.role as string | undefined
        session.user.isVerified     = token.isVerified as boolean | undefined
        session.user.companyId      = token.companyId as string | undefined
        session.user.workEmail      = token.workEmail as string | undefined
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
