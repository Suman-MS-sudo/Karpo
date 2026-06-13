import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { serviceId, hidden } = body as { serviceId: string; hidden: boolean }
  if (!serviceId || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenServices: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = hidden
    ? Array.from(new Set([...user.hiddenServices, serviceId]))
    : user.hiddenServices.filter((s) => s !== serviceId)

  await prisma.user.update({ where: { id: userId }, data: { hiddenServices: updated } })
  return NextResponse.json({ ok: true })
}
