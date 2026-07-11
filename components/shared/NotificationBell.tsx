"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, X } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { useChatContext } from "@/components/chat/ChatContext"

interface Notif {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

export function NotificationBell() {
  const pathname = usePathname()
  const { openChat } = useChatContext()
  const [notifs,   setNotifs]   = useState<Notif[]>([])
  const [open,     setOpen]     = useState(false)
  const [snapshot, setSnapshot] = useState<Notif[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(() => {
    fetch("/api/notifications?limit=20")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .catch(() => {})
  }, [])

  // Initial fetch + refresh on navigation
  useEffect(() => { fetchNotifs() }, [fetchNotifs, pathname])

  // Live push via SSE — new notifications (e.g. rental interest/visit requests)
  // appear instantly without waiting for a poll or page reload.
  useEffect(() => {
    const source = new EventSource("/api/notifications/stream")
    source.onmessage = (e) => {
      try {
        const notif = JSON.parse(e.data) as Notif
        setNotifs((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)])
      } catch {}
    }
    return () => source.close()
  }, [])

  // Poll as a fallback safety net in case the SSE connection drops
  useEffect(() => {
    const id = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Close popup on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const unread = notifs.filter((n) => !n.isRead).length

  const handleOpen = () => {
    if (!open) {
      const unreadNow = notifs.filter((n) => !n.isRead)
      setSnapshot(unreadNow)
      if (unreadNow.length > 0) {
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
        fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {})
      }
    }
    setOpen((o) => !o)
  }

  /**
   * For NEW_MESSAGE notifications, extract the sender's userId from the link
   * (/messages/[userId]) and open a floating chat window instead of navigating.
   */
  const handleNotifClick = async (n: Notif) => {
    setOpen(false)
    if (n.type === "NEW_MESSAGE" && n.link) {
      const match = n.link.match(/\/messages\/([^/?#]+)/)
      if (match) {
        const senderId = match[1]
        try {
          const res    = await fetch(`/api/profile/${senderId}`)
          const profile = await res.json()
          openChat({
            id:        senderId,
            name:      profile.name ?? "User",
            avatarUrl: profile.avatarUrl ?? profile.image ?? "",
            jobTitle:  profile.jobTitle ?? "",
            isVerified: !!profile.isVerified,
          })
        } catch {
          // Fallback to navigation
          window.location.href = n.link
        }
        return
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">New Notifications</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {snapshot.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No new notifications</p>
            ) : (
              snapshot.map((n) => {
                const isMsg = n.type === "NEW_MESSAGE"
                const inner = (
                  <div className="flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 bg-accent-50 dark:bg-accent-900/30 cursor-pointer">
                    <div className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-accent-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                )

                return isMsg ? (
                  <div key={n.id} onClick={() => handleNotifClick(n)}>
                    {inner}
                  </div>
                ) : (
                  <Link
                    key={n.id}
                    href={n.link ?? "/notifications"}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                )
              })
            )}
          </div>
          <div className="px-4 py-2 border-t border-border">
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-accent-400 hover:underline">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
