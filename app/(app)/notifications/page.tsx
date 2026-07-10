"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    setCanGoBack(window.history.length > 1)
  }, [])

  const handleBack = () => {
    if (canGoBack) router.back()
    else router.push("/dashboard")
  }

  useEffect(() => {
    fetch("/api/notifications?limit=50")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" })
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            title="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        {notifs.some((n) => !n.isRead) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-muted-foreground">We&apos;ll notify you about messages, listing activity and more.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifs.map((n) => (
            <Link key={n.id} href={n.link ?? "#"}>
              <div className={cn("flex gap-4 p-4 rounded-xl hover:bg-muted transition-colors border", n.isRead ? "bg-background border-transparent" : "bg-accent-50/50 border-accent-100")}>
                <div className={cn("h-2.5 w-2.5 rounded-full mt-1.5 shrink-0", n.isRead ? "bg-transparent" : "bg-accent-400")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
