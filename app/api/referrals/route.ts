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

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error
  if (!session.user.companyId) return NextResponse.json({ error: "No company associated" }, { status: 400 })

  const body = await req.json()

  const isPremium = session.user.membershipPlan === "PREMIUM"
  const referral = await prisma.jobReferral.create({
    data: {
      userId:          session.user.id,
      companyId:       session.user.companyId,
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
