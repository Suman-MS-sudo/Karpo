"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

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
  const [snapshot, setSnapshot] = useState<Notif[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/notifications?limit=20")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .catch(() => {})
  }, [])

  // Close popup when clicking outside the component
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
        // Immediately clear the badge without waiting for the API
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
        fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {})
      }
    }
    setOpen((o) => !o)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
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
        <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">New Notifications</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {snapshot.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No new notifications</p>
            ) : (
              snapshot.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/notifications"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 bg-accent-50 dark:bg-accent-900/30"
                >
                  <div className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-accent-400" />
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
      )}
    </div>
  )
}
