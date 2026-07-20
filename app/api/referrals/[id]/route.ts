import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const referral = await prisma.jobReferral.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (referral.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { status } = await req.json()
  if (status !== "OPEN" && status !== "CLOSED") {
    return NextResponse.json({ error: "status must be OPEN or CLOSED" }, { status: 400 })
  }

  const updated = await prisma.jobReferral.update({ where: { id: params.id }, data: { status } })
  return NextResponse.json(updated)
}
