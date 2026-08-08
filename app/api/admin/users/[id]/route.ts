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
  const { isVerified, role, isDisabled, name, email, department, jobTitle, city, phone } = body

  const data: Record<string, unknown> = {}
  if (typeof isVerified === "boolean") data.isVerified = isVerified
  if (role === "ADMIN" || role === "USER") data.role = role
  if (typeof isDisabled === "boolean") data.isDisabled = isDisabled
  if (typeof name === "string")        data.name       = name.trim() || null
  if (typeof email === "string")       data.email      = email.trim() || null
  if (typeof department === "string")  data.department = department.trim() || null
  if (typeof jobTitle === "string")    data.jobTitle   = jobTitle.trim() || null
  if (typeof city === "string")        data.city       = city.trim() || null
  if (typeof phone === "string")       data.phone      = phone.trim() || null

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({ where: { id: params.id }, data })
    return NextResponse.json(user)
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "That email or phone is already in use." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdmin()
  if (error) return error

  if (session!.user!.id === params.id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 })
  }
}
