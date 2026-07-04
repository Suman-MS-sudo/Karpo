import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        otp: { type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const otp   = credentials?.otp as string | undefined

        if (!email || !otp) return null

        const adminEmails = (process.env.ADMIN_EMAIL ?? "").split(",").map(e => e.trim().toLowerCase())
        const isAdmin = adminEmails.includes(email)

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

        // Auto-link company domain if one exists
        const domain      = email.split("@")[1]
        const company     = await prisma.company.findFirst({ where: { domain, isApproved: true } })
        const isExisting  = !!(await prisma.user.findUnique({ where: { email }, select: { id: true } }))

        // Find or create user
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: {
            isVerified: true,
            ...(isAdmin ? { role: "ADMIN" } : {}),
            ...(company ? { companyId: company.id } : {}),
          },
          create: {
            email,
            name: isAdmin ? "Admin" : null,
            isVerified: true,
            role: isAdmin ? "ADMIN" : "USER",
            ...(company ? { companyId: company.id } : {}),
            membership: { create: { plan: isAdmin ? "PREMIUM" : "FREE" } },
          },
        })

        // If new user has no company match, create a pending CompanyRequest for admin review
        if (!company && !isExisting && !isAdmin) {
          const domain = email.split("@")[1]
          const existing = await prisma.companyRequest.findFirst({ where: { domain } })
          if (!existing) {
            await prisma.companyRequest.create({
              data: {
                name:        domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                domain,
                requestedBy: email,
                status:      "PENDING",
              },
            })
          }
        }

        // Dev/test users get auto-provisioned company + PREMIUM membership
        const devDomains: Record<string, string> = {
          "testcorp.com": "Test Corp",
          "korpo.com": "Korpo",
        }
        const userDomain = email.split("@")[1]
        if (email === "dev@testcorp.com" || userDomain in devDomains) {
          const companyName = devDomains[userDomain] ?? "Test Corp"
          const devCompany = await prisma.company.upsert({
            where: { domain: userDomain },
            update: {},
            create: { name: companyName, domain: userDomain, isApproved: true },
          })
          await prisma.membership.upsert({
            where: { userId: dbUser.id },
            update: { plan: "PREMIUM" },
            create: { userId: dbUser.id, plan: "PREMIUM" },
          })
          // Ensure user has city + company so they skip onboarding
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              companyId: devCompany.id,
              city: dbUser.city ?? "Bengaluru",
              name: dbUser.name ?? email.split("@")[0],
              isVerified: true,
            },
          })
        }

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image ?? dbUser.avatarUrl,
        }
      },
    }),
  ],

  callbacks: {
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
