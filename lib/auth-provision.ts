import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { assignUserCode } from "@/lib/user-codes"

const DEV_DOMAINS: Record<string, string> = {
  "testcorp.com": "Test Corp",
  "korpo.com": "Korpo",
}

// Internal/dev domains are pre-provisioned, not self-serve — an email on one
// of these domains must already have a User row; typos of them (e.g.
// korpo.commm) must never fall through to "new account will be created".
export const RESERVED_DOMAINS = new Set(Object.keys(DEV_DOMAINS))

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

// Collapses runs of the same repeated character down to one, so a held/
// double-tapped key (korpo.commmmmm) normalizes to the same string regardless
// of how many times the key repeated — length-based diffing can't handle
// that since the typo can be arbitrarily long.
function collapseRepeats(s: string): string {
  return s.replace(/(.)\1+/g, "$1")
}

// Catches near-miss typos of a reserved domain (korpo.commm, korp0.com,
// korpo.commmmmm, ...) so they get treated as an attempt at the real reserved
// domain rather than sailing through as some brand-new, unrelated corporate
// domain.
export function matchesReservedDomainTypo(domain: string): boolean {
  const collapsed = collapseRepeats(domain)
  for (const reserved of RESERVED_DOMAINS) {
    if (domain === reserved) continue
    if (collapsed === reserved) return true
    if (Math.abs(domain.length - reserved.length) > 2) continue
    if (levenshtein(domain, reserved) <= 2) return true
  }
  return false
}

// Shared user-provisioning logic used by both the OTP credentials flow and
// OAuth flows (LinkedIn) — keeps company-linking/CompanyRequest/dev-domain
// behavior consistent across sign-in methods. Both flows are trusted enough
// (OTP proves inbox ownership; LinkedIn's own login proves identity) to
// verify the user immediately.
export async function provisionUser(
  email: string,
  opts: {
    isAdmin: boolean
    name?: string | null
    phone?: string | null
    passwordHash?: string | null
    workEmail?: string | null
    // Callers that already know whether a User row exists for this email
    // (e.g. the OTP credentials flow, which has to look this up itself
    // beforehand anyway) can pass it through here to skip a redundant
    // findUnique — every round trip to this remote (Turso) DB adds real,
    // noticeable latency to sign-in/registration.
    isExisting?: boolean
  }
) {
  const domain = email.split("@")[1]

  // These lookups are all independent of each other — run them together
  // instead of one-after-another to cut this function's DB round trips.
  const [company, isExisting, workEmailOwner, phoneOwner] = await Promise.all([
    prisma.company.findFirst({ where: { domain, isApproved: true } }),
    opts.isExisting !== undefined
      ? Promise.resolve(opts.isExisting)
      : prisma.user.findUnique({ where: { email }, select: { id: true } }).then(Boolean),
    opts.workEmail
      ? prisma.user.findUnique({ where: { workEmail: opts.workEmail }, select: { email: true } })
      : Promise.resolve(null),
    opts.phone
      ? prisma.user.findUnique({ where: { phone: opts.phone }, select: { email: true } })
      : Promise.resolve(null),
  ])

  // A caller-supplied workEmail (e.g. LinkedIn's own verified corporate email)
  // is only trustworthy to attach if it isn't already claimed by someone else —
  // the unique constraint would otherwise throw and abort the whole sign-in.
  let workEmail = opts.workEmail ?? undefined
  if (workEmail && workEmailOwner && workEmailOwner.email !== email) workEmail = undefined

  // `User.phone` has its own unique constraint independent of the `email`
  // upsert key — if this phone is already linked to a *different* account,
  // writing it here would crash the upsert with a raw SQLITE_CONSTRAINT
  // error. Drop it instead so the email verification/registration can still
  // succeed; the caller keeps their existing phone link untouched.
  let phone = opts.phone ?? null
  if (phone && phoneOwner && phoneOwner.email !== email) phone = null

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

  // Non-critical: the account itself is already created above. Losing the
  // sequential userCode/referralCode assignment (e.g. retries exhausted
  // under heavy concurrent signups) must never fail the sign-in itself.
  if (!isExisting) {
    try {
      await assignUserCode(dbUser.id)
    } catch (err) {
      console.error("[provisionUser] assignUserCode failed", err)
    }
  }

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
