"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { ProfileLink } from "@/components/shared/ProfileLink"
import { formatRelativeTime, getInitials, cn } from "@/lib/utils"

export interface ConversationItem {
  partnerId: string
  partner: {
    name: string | null
    avatarUrl: string | null
    image: string | null
    isVerified: boolean
    jobTitle: string | null
  }
  lastMessage: string
  lastAt: string
  isUnread: boolean
  isMine: boolean
}

export function MessagesList({ conversations }: { conversations: ConversationItem[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => (c.partner.name ?? "").toLowerCase().includes(q))
  }, [conversations, query])

  if (conversations.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
        <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-6 w-6 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold mb-1.5">No messages yet</h3>
        <p className="text-muted-foreground text-sm">When you contact someone about a listing, your conversation will appear here.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations…"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary-400 placeholder:text-muted-foreground transition-shadow"
        />
      </div>

      {/* Conversation list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No conversations match &ldquo;{query}&rdquo;.</p>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.partnerId}
              href={`/messages/${c.partnerId}`}
              className={cn(
                "flex items-center gap-3.5 p-4 hover:bg-muted/60 transition-colors relative",
                c.isUnread && "bg-primary-50/40 dark:bg-primary-900/10"
              )}
            >
              {c.isUnread && <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" aria-hidden />}

              <ProfileLink userId={c.partnerId} className="relative shrink-0">
                <Avatar className={cn("h-12 w-12 ring-2", c.isUnread ? "ring-primary-200 dark:ring-primary-800" : "ring-transparent")}>
                  <AvatarImage src={c.partner.avatarUrl ?? c.partner.image ?? ""} />
                  <AvatarFallback>{getInitials(c.partner.name)}</AvatarFallback>
                </Avatar>
                {c.isUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary-500 rounded-full border-2 border-card" />
                )}
              </ProfileLink>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ProfileLink userId={c.partnerId} className={cn("truncate", c.isUnread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                    {c.partner.name}
                  </ProfileLink>
                  {c.partner.isVerified && <VerifiedBadge size="sm" />}
                </div>
                {c.partner.jobTitle && !c.isUnread && (
                  <p className="text-xs text-muted-foreground truncate">{c.partner.jobTitle}</p>
                )}
                <p className={cn("text-sm mt-0.5 truncate", c.isUnread ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {c.isMine ? "You: " : ""}{c.lastMessage}
                </p>
              </div>

              <div className="text-right shrink-0 self-start pt-0.5">
                <p className={cn("text-xs", c.isUnread ? "text-primary-600 dark:text-primary-400 font-medium" : "text-muted-foreground")}>
                  {formatRelativeTime(c.lastAt)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
