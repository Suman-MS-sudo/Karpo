import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

const TYPE_RANK: Record<string, number> = { INTEREST: 1, APPLICATION: 2 }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { type = "APPLICATION", coverLetter, linkedIn, resumeUrl, resumeFileName, yearsExp, currentCompany, currentCtc, expectedCtc, noticePeriod } = await req.json()

  if (!resumeUrl || !String(resumeUrl).trim()) {
    return NextResponse.json({ error: "A resume/CV link is required to show interest or apply" }, { status: 400 })
  }

  const referral = await prisma.jobReferral.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true, status: true },
  })

  if (!referral || referral.status !== "OPEN") {
    return NextResponse.json({ error: "Referral not found or closed" }, { status: 404 })
  }
  if (referral.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot apply to your own referral" }, { status: 400 })
  }

  const existing = await prisma.referralApplication.findUnique({
    where: { referralId_userId: { referralId: params.id, userId: session.user.id } },
  })

  const incomingRank = TYPE_RANK[type] ?? 1
  const existingRank = existing ? (TYPE_RANK[existing.type] ?? 1) : 0

  if (existing && incomingRank <= existingRank && existing.status !== "REJECTED") {
    return NextResponse.json({ error: "Already applied", existing }, { status: 400 })
  }

  const data: any = {
    referralId:     params.id,
    userId:         session.user.id,
    type,
    status:         "PENDING",
    coverLetter:    coverLetter    || null,
    linkedIn:       linkedIn       || null,
    resumeUrl:      resumeUrl      || null,
    resumeFileName: resumeFileName || null,
    yearsExp:       yearsExp       ? Number(yearsExp)      : null,
    currentCompany: currentCompany || null,
    currentCtc:     currentCtc     ? Number(currentCtc)    : null,
    expectedCtc:    expectedCtc    ? Number(expectedCtc)   : null,
    noticePeriod:   noticePeriod   ? Number(noticePeriod)  : null,
  }

  const application = existing
    ? await prisma.referralApplication.update({ where: { id: existing.id }, data })
    : await prisma.referralApplication.create({ data })

  const notification = await prisma.notification.create({
    data: {
      userId: referral.userId,
      type:   "GENERAL",
      title:  type === "APPLICATION" ? "New referral application 📋" : "New interest in referral 👀",
      body:   type === "APPLICATION"
        ? `Someone submitted a full application for "${referral.title}".`
        : `Someone expressed interest in the "${referral.title}" referral.`,
      link: `/referrals/${params.id}`,
    },
  })
  pushNotification(notification)

  return NextResponse.json({ application })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const application = await prisma.referralApplication.findUnique({
    where: { referralId_userId: { referralId: params.id, userId: session.user.id } },
  })

  if (!application) return NextResponse.json({ error: "No application found" }, { status: 404 })
  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "Only a pending application can be revoked" }, { status: 400 })
  }

  await prisma.referralApplication.delete({ where: { id: application.id } })
  return NextResponse.json({ ok: true })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const referral = await prisma.jobReferral.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })
  if (!referral || referral.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const applications = await prisma.referralApplication.findMany({
    where:   { referralId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          avatarUrl: true, image: true, isVerified: true,
          jobTitle: true, department: true,
          company: { select: { name: true } },
        },
      },
    },
    // All fields are returned by default including new ones:
    // coverLetter, linkedIn, resumeUrl, yearsExp, currentCompany,
    // currentCtc, expectedCtc, noticePeriod, referrerNotes
  })

  return NextResponse.json({ applications })
}
