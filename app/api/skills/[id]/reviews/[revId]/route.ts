import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string; revId: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const review = await prisma.skillReview.findUnique({ where: { id: params.revId }, select: { sellerId: true, sellerReply: true } })
  if (!review || review.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (review.sellerReply) {
    return NextResponse.json({ error: "Already replied to this review" }, { status: 400 })
  }

  const { sellerReply } = await req.json()
  if (!sellerReply?.trim()) return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 })

  const updated = await prisma.skillReview.update({
    where: { id: params.revId },
    data:  { sellerReply, repliedAt: new Date() },
  })
  return NextResponse.json({ review: updated })
}
