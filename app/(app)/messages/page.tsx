import type { Metadata } from "next"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MessageSquare } from "lucide-react"
import { PageBanner } from "@/components/shared/PageBanner"
import { MessagesBackButton } from "@/components/shared/MessagesBackButton"
import { MessagesList, type ConversationItem } from "@/components/shared/MessagesList"

export const metadata: Metadata = { title: "Messages" }

export default async function MessagesPage() {
  const session = await auth()
  const userId = session!.user!.id

  // Get all unique conversations
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender:   { include: { company: { select: { name: true, logo: true, domain: true } } } },
      receiver: { include: { company: { select: { name: true, logo: true, domain: true } } } },
    },
  })

  // Build unique conversation partners
  const conversationMap = new Map<string, typeof messages[0]>()
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, msg)
    }
  }

  const conversations: ConversationItem[] = Array.from(conversationMap.entries()).map(([partnerId, lastMsg]) => {
    const partner = lastMsg.senderId === userId ? lastMsg.receiver : lastMsg.sender
    return {
      partnerId,
      partner: {
        name:       partner.name,
        avatarUrl:  partner.avatarUrl,
        image:      partner.image,
        isVerified: partner.isVerified,
        jobTitle:   partner.jobTitle,
      },
      lastMessage: lastMsg.content,
      lastAt:      lastMsg.createdAt.toISOString(),
      isUnread:    !lastMsg.isRead && lastMsg.receiverId === userId,
      isMine:      lastMsg.senderId === userId,
    }
  })

  const unreadCount = conversations.filter((c) => c.isUnread).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-3">
        <MessagesBackButton />
      </div>

      <PageBanner
        image="/messages-banner.svg"
        icon={MessageSquare}
        title="Messages"
        subtitle={unreadCount > 0 ? `${unreadCount} unread conversation${unreadCount === 1 ? "" : "s"}` : "Your conversations with colleagues."}
        overlayFrom="from-indigo-700/85"
        overlayTo="to-purple-700/80"
      />

      <MessagesList conversations={conversations} />
    </div>
  )
}
