"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Notif {
  id: string
  title: string
  body: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch("/api/notifications?limit=10")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .catch(() => {})
  }, [])

  const unread = notifs.filter((n) => !n.isRead).length

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" })
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent-400 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
              ) : (
                notifs.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/notifications"}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0",
                      !n.isRead && "bg-accent-50 dark:bg-accent-900/30"
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", n.isRead ? "bg-transparent" : "bg-accent-400")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-border">
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-accent-400 hover:underline">
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
