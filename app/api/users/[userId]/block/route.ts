import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

const VALID_SCOPES = new Set(["MESSAGE", "FULL"])

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: params.userId } },
  })

  return NextResponse.json({ isBlocked: !!block, scope: block?.scope ?? null })
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: "You can't block yourself." }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const scope = VALID_SCOPES.has(body?.scope) ? body.scope : "MESSAGE"

  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: params.userId } },
    create: { blockerId: session.user.id, blockedId: params.userId, scope },
    update: { scope },
  })

  return NextResponse.json({ ok: true, scope })
}

export async function DELETE(_req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  await prisma.userBlock.deleteMany({
    where: { blockerId: session.user.id, blockedId: params.userId },
  })

  return NextResponse.json({ ok: true })
}
