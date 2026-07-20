import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET() {
  const { error } = await requireVerified()
  if (error) return error

  const referrals = await prisma.jobReferral.findMany({
    where:   { status: "OPEN" },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    take:    40,
    include: {
      user:    { include: { company: { select: { name: true, logo: true, domain: true } } } },
      company: true,
      _count:  { select: { applications: true } },
    },
  })
  return NextResponse.json({ data: referrals })
}

// Resolves the posted "Company Name" field to a real Company row: trust a
// picked id if valid, else match an existing company by name (case-
// insensitive), else create a new (unapproved) one so posting isn't blocked
// on a company Korpo doesn't know about yet.
async function resolveCompanyId(companyId: unknown, companyName: unknown, fallbackId?: string): Promise<string | null> {
  if (typeof companyId === "string" && companyId) {
    const existing = await prisma.company.findUnique({ where: { id: companyId } })
    if (existing) return existing.id
  }

  const name = typeof companyName === "string" ? companyName.trim() : ""
  if (!name) return fallbackId ?? null

  const matched = await prisma.company.findFirst({ where: { name: { equals: name } } })
  if (matched) return matched.id

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "company"
  let domain = `${slug}.new`
  let suffix = 1
  while (await prisma.company.findUnique({ where: { domain } })) {
    domain = `${slug}-${suffix}.new`
    suffix += 1
  }

  const created = await prisma.company.create({ data: { name, domain, isApproved: false } })
  return created.id
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()

  const companyId = await resolveCompanyId(body.companyId, body.companyName, session.user.companyId)
  if (!companyId) return NextResponse.json({ error: "Company name is required" }, { status: 400 })

  const isPremium = session.user.membershipPlan === "PREMIUM"
  const referral = await prisma.jobReferral.create({
    data: {
      userId:          session.user.id,
      companyId,
      title:           body.title,
      description:     body.description,
      department:      body.department,
      experienceMin:   Number(body.experienceMin),
      experienceMax:   Number(body.experienceMax),
      salaryMin:       body.salaryMin       ? Number(body.salaryMin)    : null,
      salaryMax:       body.salaryMax       ? Number(body.salaryMax)    : null,
      skills:          Array.isArray(body.skills) ? body.skills : [],
      jobType:         body.jobType         || null,
      workMode:        body.workMode        || null,
      location:        body.location        || null,
      openings:        body.openings        ? Number(body.openings)     : 1,
      perks:           Array.isArray(body.perks) ? body.perks : [],
      interviewProcess: body.interviewProcess || null,
      internalCode:    body.internalCode    || null,
      referralBonus:   body.referralBonus   ? Number(body.referralBonus) : null,
      deadline:        body.deadline        ? new Date(body.deadline)   : null,
      isBoosted:       isPremium,
    },
  })

  revalidatePath("/dashboard")
  return NextResponse.json(referral, { status: 201 })
}
