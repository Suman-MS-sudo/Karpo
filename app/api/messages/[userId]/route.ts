import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: params.userId },
        { senderId: params.userId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  })

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: { senderId: params.userId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ messages })
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()
  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId: params.userId,
      content: body.content,
      listingId: body.listingId,
      listingType: body.listingType,
    },
  })

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: "NEW_MESSAGE",
      title: "New message",
      body: `${session.user.name ?? "Someone"} sent you a message`,
      link: `/messages/${session.user.id}`,
    },
  })

  return NextResponse.json(message, { status: 201 })
}
