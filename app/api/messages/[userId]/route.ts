import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"
import { emitNewMessage } from "@/lib/message-events"
import { findContactInfo, contactInfoError } from "@/lib/contact-filter"
import { pushNotification } from "@/lib/notify"

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const [messages, iBlockedThem, theyBlockedMe] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: params.userId },
          { senderId: params.userId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: params.userId } },
    }),
    prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: params.userId, blockedId: session.user.id } },
    }),
  ])

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: { senderId: params.userId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ messages, isBlocked: !!iBlockedThem, blockedByOther: !!theyBlockedMe })
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: session.user.id, blockedId: params.userId },
        { blockerId: params.userId, blockedId: session.user.id },
      ],
    },
  })
  if (blocked) {
    return NextResponse.json({ error: "You can't message this user." }, { status: 403 })
  }

  const body = await req.json()
  if (findContactInfo(body.content)) {
    return NextResponse.json({ error: contactInfoError("message") }, { status: 400 })
  }
  const message = await prisma.message.create({
    data: {
      senderId:    session.user.id,
      receiverId:  params.userId,
      content:     body.content,
      listingId:   body.listingId,
      listingType: body.listingType,
    },
  })

  // Push to SSE stream so the recipient's floating chat updates instantly
  emitNewMessage(params.userId, {
    id:         message.id,
    senderId:   message.senderId,
    receiverId: message.receiverId,
    content:    message.content,
    createdAt:  message.createdAt.toISOString(),
    isRead:     message.isRead,
  })

  // Create notification, then push it live over SSE so the bell/badge
  // updates instantly instead of waiting for the 60s poll fallback.
  prisma.notification.create({
    data: {
      userId: params.userId,
      type:   "NEW_MESSAGE",
      title:  "New message",
      body:   `${session.user.name ?? "Someone"} sent you a message`,
      link:   `/messages/${session.user.id}`,
    },
  }).then(pushNotification).catch(() => {})

  return NextResponse.json(message, { status: 201 })
}
