import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error
  if (session.user.membershipPlan !== "PREMIUM") {
    return NextResponse.json({ error: "Premium membership required" }, { status: 403 })
  }

  const body = await req.json()
  const lead = await prisma.conciergeLead.create({
    data: {
      userId: session.user.id,
      serviceType: body.serviceType,
      description: body.description,
    },
  })
  return NextResponse.json(lead, { status: 201 })
}
