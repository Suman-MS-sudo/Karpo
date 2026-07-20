import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

// Valid pipeline transitions per current status
const VALID_ACTIONS: Record<string, string[]> = {
  PENDING:     ["SHORTLIST", "REJECT"],
  SHORTLISTED: ["REFER", "REJECT"],
  REFERRED:    ["HIRE", "REJECT"],
}

const ACTION_STATUS: Record<string, string> = {
  SHORTLIST: "SHORTLISTED",
  REFER:     "REFERRED",
  HIRE:      "HIRED",
  REJECT:    "REJECTED",
}

const ACTION_NOTIF: Record<string, { title: string; body: (title: string) => string }> = {
  SHORTLIST: {
    title: "You've been accepted! 🎯",
    body:  (t) => `Great news — you've been accepted for the "${t}" referral. The referrer will reach out shortly.`,
  },
  REFER: {
    title: "Referral submitted! 🚀",
    body:  (t) => `You've been formally referred for "${t}". Check your messages for next steps.`,
  },
  HIRE: {
    title: "You got the job! 🎉",
    body:  (t) => `Congratulations! The referrer marked you as hired for "${t}". Welcome aboard!`,
  },
  REJECT: {
    title: "Application update",
    body:  (t) => `The referrer has passed on your application for "${t}". Thank you for your interest.`,
  },
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; appId: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { action, referrerNotes } = await req.json()

  // Allow referrer to save private notes without a pipeline action
  if (!action && referrerNotes !== undefined) {
    const referral = await prisma.jobReferral.findUnique({ where: { id: params.id }, select: { userId: true } })
    if (!referral || referral.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    await prisma.referralApplication.update({ where: { id: params.appId }, data: { referrerNotes } })
    return NextResponse.json({ ok: true })
  }

  const referral = await prisma.jobReferral.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true },
  })
  if (!referral || referral.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const application = await prisma.referralApplication.findUnique({
    where: { id: params.appId },
    select: { id: true, status: true, userId: true, referralId: true },
  })
  if (!application || application.referralId !== params.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  const allowed = VALID_ACTIONS[application.status] ?? []
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: `Cannot ${action} from status ${application.status}` }, { status: 400 })
  }

  const newStatus = ACTION_STATUS[action]
  await prisma.referralApplication.update({
    where: { id: application.id },
    data:  { status: newStatus },
  })

  const notif = ACTION_NOTIF[action]
  if (notif) {
    const notification = await prisma.notification.create({
      data: {
        userId: application.userId,
        type:   "GENERAL",
        title:  notif.title,
        body:   notif.body(referral.title),
        link:   `/referrals/${params.id}`,
      },
    })
    pushNotification(notification)
  }

  // Auto-message on SHORTLIST and REFER
  if (action === "SHORTLIST" || action === "REFER") {
    const msg = action === "SHORTLIST"
      ? `Hi! Great news — I've accepted your application for "${referral.title}". I'll be in touch with next steps soon.`
      : `Hi! I've formally submitted your referral for "${referral.title}". You should expect to hear from the company shortly. Feel free to message me if you have any questions!`

    await prisma.message.create({
      data: {
        senderId:    session.user.id,
        receiverId:  application.userId,
        content:     msg,
        listingType: "referral",
        listingId:   params.id,
      },
    })
  }

  return NextResponse.json({ status: newStatus })
}
