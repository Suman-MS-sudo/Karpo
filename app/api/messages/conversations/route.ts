import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

/**
 * GET /api/messages/conversations
 *
 * Returns a deduplicated list of conversation partners with last message
 * preview and unread status — used by the MessageIcon dropdown.
 */
export async function GET() {
  const { session, error } = await requireVerified()
  if (error) return error

  const userId = session.user.id

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender:   { select: { id: true, name: true, image: true, avatarUrl: true, isVerified: true, jobTitle: true } },
      receiver: { select: { id: true, name: true, image: true, avatarUrl: true, isVerified: true, jobTitle: true } },
    },
    take: 200,
  })

  const seen = new Map<string, typeof messages[number]>()
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
    if (!seen.has(partnerId)) seen.set(partnerId, msg)
  }

  const conversations = Array.from(seen.entries()).map(([partnerId, lastMsg]) => {
    const partner = lastMsg.senderId === userId ? lastMsg.receiver : lastMsg.sender
    const unread  = !lastMsg.isRead && lastMsg.receiverId === userId
    return {
      partnerId,
      partnerName:     partner.name     ?? "Unknown",
      partnerAvatar:   partner.avatarUrl ?? partner.image ?? "",
      partnerJobTitle: partner.jobTitle  ?? "",
      isVerified:      partner.isVerified,
      lastMessage:     lastMsg.senderId === userId
        ? `You: ${lastMsg.content}`
        : lastMsg.content,
      lastAt: lastMsg.createdAt.toISOString(),
      unread,
    }
  })

  return NextResponse.json({ conversations })
}
