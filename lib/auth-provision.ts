import { prisma } from "@/lib/prisma"

const DEV_DOMAINS: Record<string, string> = {
  "testcorp.com": "Test Corp",
  "korpo.com": "Korpo",
}

// Shared user-provisioning logic used by both the OTP credentials flow and
// OAuth flows (LinkedIn) — keeps company-linking/CompanyRequest/dev-domain
// behavior consistent across sign-in methods.
export async function provisionUser(email: string, opts: { isAdmin: boolean; name?: string | null }) {
  const domain = email.split("@")[1]
  const company = await prisma.company.findFirst({ where: { domain, isApproved: true } })
  const isExisting = !!(await prisma.user.findUnique({ where: { email }, select: { id: true } }))

  const dbUser = await prisma.user.upsert({
    where: { email },
    update: {
      isVerified: true,
      ...(opts.isAdmin ? { role: "ADMIN" } : {}),
      ...(company ? { companyId: company.id } : {}),
    },
    create: {
      email,
      name: opts.isAdmin ? "Admin" : (opts.name ?? null),
      isVerified: true,
      role: opts.isAdmin ? "ADMIN" : "USER",
      ...(company ? { companyId: company.id } : {}),
      membership: { create: { plan: opts.isAdmin ? "PREMIUM" : "FREE" } },
    },
  })

  if (!company && !isExisting && !opts.isAdmin) {
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
