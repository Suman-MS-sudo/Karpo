"use client"
import { useEffect, useRef, useState } from "react"
import { MessageSquare, X } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useChatContext } from "@/components/chat/ChatContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatRelativeTime } from "@/lib/utils"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"

interface Conversation {
  partnerId: string
  partnerName: string
  partnerAvatar: string
  partnerJobTitle: string
  isVerified: boolean
  lastMessage: string
  lastAt: string
  unread: boolean
}

export function MessageIcon() {
  const pathname  = usePathname()
  const { totalUnread, openChat, windows } = useChatContext()
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen]               = useState(false)
  const [conversations, setConvos]    = useState<Conversation[]>([])
  const [loading, setLoading]         = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Refresh unread count on navigation or context changes
  useEffect(() => {
    fetch("/api/messages/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count ?? 0))
      .catch(() => {})
  }, [pathname, totalUnread])

  // Close popup on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleOpen = async () => {
    if (!open) {
      setLoading(true)
      try {
        const res  = await fetch("/api/messages/conversations")
        const data = await res.json()
        setConvos(data.conversations ?? [])
      } catch {
        setConvos([])
      } finally {
        setLoading(false)
      }
    }
    setOpen((o) => !o)
  }

  const handleOpenChat = (c: Conversation) => {
    openChat({
      id:        c.partnerId,
      name:      c.partnerName,
      avatarUrl: c.partnerAvatar,
      jobTitle:  c.partnerJobTitle,
      isVerified: c.isVerified,
    })
    setOpen(false)
    // Refresh unread count
    setUnreadCount((prev) => Math.max(0, prev - (c.unread ? 1 : 0)))
  }

  // Effective unread = DB count minus what's already open in windows
  const openPartnerIds = new Set(windows.map((w) => w.partner.id))
  const displayUnread  = Math.max(0, unreadCount - totalUnread)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Messages"
      >
        <MessageSquare className="h-[18px] w-[18px]" />
        {displayUnread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {displayUnread > 9 ? "9+" : displayUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Messages</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.partnerId}
                  onClick={() => handleOpenChat(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 text-left ${
                    c.unread && !openPartnerIds.has(c.partnerId) ? "bg-accent-50 dark:bg-accent-900/20" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={c.partnerAvatar} />
                      <AvatarFallback className="text-xs">{getInitials(c.partnerName)}</AvatarFallback>
                    </Avatar>
                    {c.unread && !openPartnerIds.has(c.partnerId) && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-accent-400 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm truncate ${c.unread ? "font-semibold" : "font-medium"}`}>{c.partnerName}</span>
                      {c.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    {c.partnerJobTitle && (
                      <p className="text-[10px] text-muted-foreground truncate leading-tight">{c.partnerJobTitle}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${c.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {c.lastMessage}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0 self-start mt-0.5">
                    {formatRelativeTime(c.lastAt)}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-border flex items-center justify-between">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="text-xs text-accent-400 hover:underline"
            >
              View all messages →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
