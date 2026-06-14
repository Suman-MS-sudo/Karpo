import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const lead = await prisma.conciergeLead.findUnique({ where: { id: params.id } })
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (lead.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return NextResponse.json(lead)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const lead = await prisma.conciergeLead.findUnique({ where: { id: params.id }, select: { userId: true, status: true } })
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (lead.status === "COMPLETED") {
    return NextResponse.json({ error: "Cannot cancel a completed request" }, { status: 400 })
  }

  await prisma.conciergeLead.update({ where: { id: params.id }, data: { status: "CANCELLED" } })
  return NextResponse.json({ ok: true })
}
