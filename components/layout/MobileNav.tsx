"use client"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  Home, MessageSquare, Plus, LayoutGrid, Bell, User,
} from "lucide-react"
import { SERVICES, type ServiceConfig } from "@/config/services"
import { cn } from "@/lib/utils"
import { useChatContext } from "@/components/chat/ChatContext"

const serviceImageMap: Record<string, string> = {
  "buy-sell": "/images/services/marketplace.jpeg",
  rentals: "/images/services/rentals.jpeg",
  "job-referrals": "/images/services/job-referrals.jpeg",
  carpool: "/images/services/carpool.jpeg",
  services: "/images/services/skills.jpeg",
  deals: "/images/services/deals.png",
  events: "/images/services/events.png",
}

const TABS = [
  { key: "home",          href: "/dashboard",     label: "Home",     icon: Home },
  { key: "messages",      href: "/messages",       label: "Messages", icon: MessageSquare },
  { key: "post",          href: null,              label: "Post",     icon: Plus },
  { key: "view",          href: null,              label: "View",     icon: LayoutGrid },
  { key: "notifications", href: "/notifications",  label: "Alerts",   icon: Bell },
  { key: "profile",       href: "/profile/me",     label: "Profile",  icon: User },
] as const

function LaunchpadSheet({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (service: ServiceConfig) => void
  mode: "post" | "view"
}) {
  const services = SERVICES.filter((s) => s.isActive)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch("/api/services/counts")
      .then((res) => (res.ok ? res.json() : {}))
      .then(setCounts)
      .catch(() => {})
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-150 lg:hidden"
      onClick={onClose}
    >
      {/* A wrapping, centered grid — not a horizontal scroller — so every
          icon (including the last row) is fully visible and centered
          within the screen width, regardless of how many services there are. */}
      <div
        className="absolute bottom-16 left-0 right-0 bg-card/95 backdrop-blur-md rounded-t-3xl shadow-2xl px-4 pt-5 pb-4 animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-4">
          {services.map((service, i) => {
            const imageSrc = serviceImageMap[service.id]
            const count = counts[service.id]
            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="flex flex-col items-center gap-1 group animate-in zoom-in-50 fade-in"
                style={{
                  width: 76,
                  animationDelay: `${i * 60}ms`,
                  animationDuration: "280ms",
                  animationFillMode: "backwards",
                }}
              >
                <div
                  className={cn(
                    "h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-md transition-transform duration-150 group-active:scale-90",
                    service.bgColor
                  )}
                >
                  {imageSrc ? (
                    <Image src={imageSrc} alt={service.name} width={160} height={160} quality={90} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight">
                  {service.name}
                </span>
                {count !== undefined && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { messageTick } = useChatContext()
  const [sheet, setSheet] = useState<"post" | "view" | null>(null)
  const [unread, setUnread] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const fetchUnread = useCallback(() => {
    fetch("/api/notifications?limit=20")
      .then((r) => r.json())
      .then((d) => setUnread((d.data ?? []).filter((n: { isRead: boolean }) => !n.isRead).length))
      .catch(() => {})
  }, [])

  // Initial fetch + refresh whenever navigation happens, same pattern as the
  // desktop NotificationBell. Visiting the Alerts page itself marks everything
  // read there, so just clear the badge immediately instead of racing it.
  useEffect(() => {
    if (pathname === "/notifications") setUnread(0)
    else fetchUnread()
  }, [fetchUnread, pathname])

  // Live push via SSE so the badge updates in real time, matching web.
  useEffect(() => {
    const source = new EventSource("/api/notifications/stream")
    source.onmessage = () => setUnread((n) => n + 1)
    return () => source.close()
  }, [])

  // Poll as a fallback safety net in case the SSE connection drops.
  useEffect(() => {
    const id = setInterval(fetchUnread, 60_000)
    return () => clearInterval(id)
  }, [fetchUnread])

  // Messages badge — same live-update pattern as Alerts above, driven by
  // ChatContext's messageTick (bumped by its own /api/messages/stream
  // subscription) instead of opening a second SSE connection here.
  const fetchUnreadMessages = useCallback(() => {
    fetch("/api/messages/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadMessages(d.count ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Unlike Alerts, opening one conversation (GET /api/messages/[userId])
    // only marks *that* conversation's messages read — other unread
    // conversations may remain — so always refetch the real count rather
    // than optimistically zeroing it.
    fetchUnreadMessages()
  }, [fetchUnreadMessages, pathname, messageTick])

  const handleSelect = (service: ServiceConfig) => {
    setSheet((current) => {
      router.push(current === "post" ? `${service.route}/new` : service.route)
      return null
    })
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {TABS.map(({ key, href, icon: Icon, label }) => {
            const isActive = href === null ? sheet === key : (pathname === href || pathname.startsWith(href + "/"))
            const commonClass = cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[9px] font-semibold uppercase tracking-wider transition-colors relative",
              isActive ? "text-primary-600 dark:text-primary-400" : "text-muted-foreground"
            )

            const content = (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                )}
                <span className="relative">
                  <Icon className={cn("h-5 w-5 transition-all", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
                  {key === "notifications" && unread > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                  {key === "messages" && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </span>
                {label}
              </>
            )

            if (href === null) {
              return (
                <button
                  key={key}
                  onClick={() => setSheet((s) => (s === key ? null : (key as "post" | "view")))}
                  className={commonClass}
                >
                  {content}
                </button>
              )
            }

            return (
              <Link key={key} href={href} className={commonClass}>
                {content}
              </Link>
            )
          })}
        </div>
      </nav>

      {sheet && (
        <LaunchpadSheet
          mode={sheet}
          onClose={() => setSheet(null)}
          onSelect={handleSelect}
        />
      )}
    </>
  )
}
