import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: "You can't block yourself." }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: params.userId } },
    create: { blockerId: session.user.id, blockedId: params.userId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  await prisma.userBlock.deleteMany({
    where: { blockerId: session.user.id, blockedId: params.userId },
  })

  return NextResponse.json({ ok: true })
}
