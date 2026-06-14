import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (session.user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

const VALID_STATUSES = ["PENDING","IN_REVIEW","IN_PROGRESS","COMPLETED","CANCELLED"]

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { status, assignedProId, notes } = body

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (status)                       data.status        = status
  if (assignedProId !== undefined)  data.assignedProId = assignedProId || null
  if (notes !== undefined)          data.notes         = notes || null

  const lead = await prisma.conciergeLead.update({ where: { id: params.id }, data })
  return NextResponse.json(lead)
}
