import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireVerified()
  if (error) return error

  const leads = await prisma.conciergeLead.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ data: leads })
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  // Free users: max 2 active (non-completed/cancelled) leads
  if (session.user.membershipPlan !== "PREMIUM") {
    const activeCount = await prisma.conciergeLead.count({
      where: { userId: session.user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    })
    if (activeCount >= 2) {
      return NextResponse.json(
        { error: "Free plan limit reached (2 active requests). Upgrade to Premium for unlimited.", limitReached: true },
        { status: 403 }
      )
    }
  }

  const body = await req.json()
  const lead = await prisma.conciergeLead.create({
    data: {
      userId: session.user.id,
      serviceType: body.serviceType,
      description: body.description,
      budget: body.budget ? parseInt(body.budget) : undefined,
      urgency: body.urgency ?? "NORMAL",
      timeline: body.timeline,
      phone: body.phone,
      preferredContact: body.preferredContact ?? "EMAIL",
    },
  })
  return NextResponse.json(lead, { status: 201 })
}
