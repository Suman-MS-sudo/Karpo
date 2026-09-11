import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireVerified()
  if (error) return error

  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } } },
  })

  return NextResponse.json({ blocked: blocks.map((b) => b.blocked) })
}
