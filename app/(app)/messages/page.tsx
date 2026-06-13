import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { formatRelativeTime, getInitials } from "@/lib/utils"

export default async function MessagesPage() {
  const session = await auth()
  const userId = session!.user!.id

  // Get all unique conversations
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { include: { company: { select: { name: true, logo: true, domain: true } } } },
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

  const conversations = Array.from(conversationMap.entries()).map(([partnerId, lastMsg]) => {
    const partner = lastMsg.senderId === userId ? lastMsg.receiver : lastMsg.sender
    return { partnerId, partner, lastMsg }
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground">When you contact someone about a listing, your conversation will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(({ partnerId, partner, lastMsg }) => {
            const isUnread = !lastMsg.isRead && lastMsg.receiverId === userId
            return (
              <Link key={partnerId} href={`/messages/${partnerId}`}>
                <div className={`flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors ${isUnread ? "bg-accent-50" : ""}`}>
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={partner.avatarUrl ?? partner.image ?? ""} />
                      <AvatarFallback>{getInitials(partner.name)}</AvatarFallback>
                    </Avatar>
                    {isUnread && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-accent-400 rounded-full border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isUnread ? "text-foreground" : "text-foreground"}`}>{partner.name}</span>
                      {partner.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    {partner.company && <p className="text-xs text-muted-foreground">{partner.company.name}</p>}
                    <p className={`text-sm mt-0.5 truncate ${isUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {lastMsg.senderId === userId ? "You: " : ""}{lastMsg.content}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(lastMsg.createdAt)}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
