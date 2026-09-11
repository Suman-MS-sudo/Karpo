"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell, CheckCheck, ArrowLeft, MessageSquare, Tag, CalendarCheck,
  Handshake, XCircle, Home, Rocket, Crown, Flag, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBanner } from "@/components/shared/PageBanner"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Notif {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

const TYPE_META: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  NEW_MESSAGE:      { icon: MessageSquare, color: "text-primary-600 dark:text-primary-400", bg: "bg-primary-50 dark:bg-primary-900/20" },
  OFFER:            { icon: Tag,           color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20" },
  OFFER_ACCEPTED:   { icon: Handshake,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  OFFER_DECLINED:   { icon: XCircle,       color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
  RENTAL_INQUIRY:   { icon: Home,          color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/20" },
  RENTAL_ACCEPTED:  { icon: Handshake,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  RENTAL_DECLINED:  { icon: XCircle,       color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
  VISIT:            { icon: CalendarCheck, color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/20" },
  EVENT_RSVP:       { icon: CalendarCheck, color: "text-fuchsia-600 dark:text-fuchsia-400", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20" },
  LISTING_BOOST:    { icon: Rocket,        color: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-900/20" },
  MEMBERSHIP:       { icon: Crown,         color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20" },
  REPORT:           { icon: Flag,          color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
  ADMIN_REPORT:     { icon: Flag,          color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
  GENERAL:          { icon: Sparkles,      color: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-50 dark:bg-violet-900/20" },
}
const DEFAULT_META = { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" }

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
      .then((d) => {
        const data: Notif[] = d.data ?? []
        setNotifs(data)
        // Viewing the Alerts page counts as reading it — mark everything
        // read immediately so the badge/dropdown don't keep showing stale
        // "unread" notifications after the user has already seen them here.
        if (data.some((n) => !n.isRead)) {
          fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {})
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" })
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={handleBack}
        title="Go back"
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors mb-3"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <PageBanner
        image="/notifications-banner.svg"
        icon={Bell}
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "Stay on top of activity across Korpo."}
        overlayFrom="from-amber-700/85"
        overlayTo="to-rose-800/80"
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={markAllRead}
            >
              <CheckCheck className="h-4 w-4" /> <span className="hidden sm:inline">Mark all read</span>
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 p-4 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-1.5">No notifications yet</h3>
          <p className="text-muted-foreground text-sm">We&apos;ll notify you about messages, listing activity and more.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {notifs.map((n) => {
            const meta = TYPE_META[n.type] ?? DEFAULT_META
            return (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                className={cn(
                  "flex items-start gap-3.5 p-4 hover:bg-muted/60 transition-colors relative",
                  !n.isRead && "bg-primary-50/40 dark:bg-primary-900/10"
                )}
              >
                {!n.isRead && <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" aria-hidden />}

                <span className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", meta.bg)}>
                  <meta.icon className={cn("h-4.5 w-4.5", meta.color)} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground")}>{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className={cn("text-xs mt-1", !n.isRead ? "text-primary-600 dark:text-primary-400 font-medium" : "text-muted-foreground")}>
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
