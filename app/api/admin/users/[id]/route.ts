import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (session.user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { isVerified, role, isDisabled } = body

  const data: Record<string, unknown> = {}
  if (typeof isVerified === "boolean") data.isVerified = isVerified
  if (role === "ADMIN" || role === "USER") data.role = role
  if (typeof isDisabled === "boolean") data.isDisabled = isDisabled

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id: params.id }, data })
  return NextResponse.json(user)
}
