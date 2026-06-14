import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true, membership: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const scalar  = ["name", "bio", "city", "phone", "department", "jobTitle", "avatarUrl", "yearsOfExp"]
  const special = ["socialLinks", "skills", "username"]
  const data: Record<string, unknown> = {}

  for (const key of scalar) {
    if (key in body) data[key] = body[key]
  }
  if ("socialLinks" in body) data["socialLinks"] = body.socialLinks ?? {}
  if ("skills"      in body) data["skills"]      = Array.isArray(body.skills) ? body.skills : []
  if ("username"    in body) {
    const u = (body.username as string | null)?.trim().toLowerCase() || null
    if (u && !/^[a-z0-9_]{3,30}$/.test(u)) {
      return NextResponse.json({ error: "Username must be 3–30 characters: letters, numbers, underscores only." }, { status: 400 })
    }
    data["username"] = u || null
  }

  try {
    const user = await prisma.user.update({ where: { id: session.user.id }, data })
    return NextResponse.json(user)
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 })
  }
}
