import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireVerified()
  if (error) return error

  const count = await prisma.message.count({
    where: { receiverId: session.user.id, isRead: false },
  })

  return NextResponse.json({ count })
}
