import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"

const DEV_DOMAINS: Record<string, string> = {
  "testcorp.com": "Test Corp",
  "korpo.com": "Korpo",
}

// Shared user-provisioning logic used by both the OTP credentials flow and
// OAuth flows (LinkedIn) — keeps company-linking/CompanyRequest/dev-domain
// behavior consistent across sign-in methods. Both flows are trusted enough
// (OTP proves inbox ownership; LinkedIn's own login proves identity) to
// verify the user immediately.
export async function provisionUser(
  email: string,
  opts: { isAdmin: boolean; name?: string | null; phone?: string | null; passwordHash?: string | null; workEmail?: string | null }
) {
  const domain = email.split("@")[1]
  const company = await prisma.company.findFirst({ where: { domain, isApproved: true } })
  const isExisting = !!(await prisma.user.findUnique({ where: { email }, select: { id: true } }))

  // A caller-supplied workEmail (e.g. LinkedIn's own verified corporate email)
  // is only trustworthy to attach if it isn't already claimed by someone else —
  // the unique constraint would otherwise throw and abort the whole sign-in.
  let workEmail = opts.workEmail ?? undefined
  if (workEmail) {
    const workEmailOwner = await prisma.user.findUnique({ where: { workEmail }, select: { email: true } })
    if (workEmailOwner && workEmailOwner.email !== email) workEmail = undefined
  }

  // `User.phone` has its own unique constraint independent of the `email`
  // upsert key — if this phone is already linked to a *different* account,
  // writing it here would crash the upsert with a raw SQLITE_CONSTRAINT
  // error. Drop it instead so the email verification/registration can still
  // succeed; the caller keeps their existing phone link untouched.
  let phone = opts.phone ?? null
  if (phone) {
    const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { email: true } })
    if (phoneOwner && phoneOwner.email !== email) phone = null
  }

  const dbUser = await prisma.user.upsert({
    where: { email },
    update: {
      isVerified: true,
      ...(opts.isAdmin ? { role: "ADMIN" } : {}),
      ...(company ? { companyId: company.id } : {}),
      ...(phone ? { phone } : {}),
      ...(opts.passwordHash ? { passwordHash: opts.passwordHash } : {}),
      ...(workEmail ? { workEmail } : {}),
    },
    create: {
      email,
      name: opts.isAdmin ? "Admin" : (opts.name ?? null),
      phone,
      passwordHash: opts.passwordHash ?? null,
      isVerified: true,
      role: opts.isAdmin ? "ADMIN" : "USER",
      ...(company ? { companyId: company.id } : {}),
      ...(workEmail ? { workEmail } : {}),
      membership: { create: { plan: opts.isAdmin ? "PREMIUM" : "FREE" } },
    },
  })

  // Only file a review request for real, uncatalogued corporate domains —
  // personal/disposable domains (allowed in via LinkedIn) aren't companies.
  if (!company && !isExisting && !opts.isAdmin && !isDomainBlocked(email).blocked) {
    const existing = await prisma.companyRequest.findFirst({ where: { domain } })
    if (!existing) {
      await prisma.companyRequest.create({
        data: {
          name: domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          domain,
          requestedBy: email,
          status: "PENDING",
        },
      })
    }
  }

  if (email === "dev@testcorp.com" || domain in DEV_DOMAINS) {
    const companyName = DEV_DOMAINS[domain] ?? "Test Corp"
    const devCompany = await prisma.company.upsert({
      where: { domain },
      update: {},
      create: { name: companyName, domain, isApproved: true },
    })
    await prisma.membership.upsert({
      where: { userId: dbUser.id },
      update: { plan: "PREMIUM" },
      create: { userId: dbUser.id, plan: "PREMIUM" },
    })
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

  return { dbUser, isNewUser: !isExisting }
}
