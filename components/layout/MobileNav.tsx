"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import {
  Home, MessageSquare, Plus, LayoutGrid, Bell, User,
  ShoppingBag, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
} from "lucide-react"
import { SERVICES, type ServiceConfig } from "@/config/services"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
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

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-150 lg:hidden"
      onClick={onClose}
    >
      {/* A single horizontal strip that pops up out of the tab bar — quick-commerce
          app style (Blinkit/Zepto category rows): one row of icon bubbles, each
          bouncing in left-to-right, no boxed card behind the row. */}
      <div
        className="absolute bottom-16 left-0 right-0 flex items-end justify-center gap-3 px-4 pb-3 overflow-x-auto scrollbar-hide animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {services.map((service, i) => {
          const Icon = iconMap[service.icon] ?? ShoppingBag
          // Gentle arc — icons rise toward the middle of the row and settle
          // back down at the edges, like a shallow dock/rainbow curve.
          const t = services.length > 1 ? i / (services.length - 1) : 0.5
          const arcLift = Math.sin(t * Math.PI) * 16
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="flex flex-col items-center gap-1 shrink-0 group animate-in zoom-in-50 fade-in"
              style={{
                marginBottom: arcLift,
                animationDelay: `${i * 60}ms`,
                animationDuration: "280ms",
                animationFillMode: "backwards",
              }}
            >
              <div
                className={cn(
                  "rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-150 group-active:scale-90 animate-icon-bob",
                  service.bgColor
                )}
                style={{ height: 68, width: 68, animationDelay: `${300 + i * 90}ms` }}
              >
                <Icon className={cn("h-7 w-7", service.color)} />
              </div>
              <span className="text-[9px] font-semibold text-foreground bg-background/90 px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                {service.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [sheet, setSheet] = useState<"post" | "view" | null>(null)

  const handleSelect = (service: ServiceConfig) => {
    setSheet((current) => {
      router.push(current === "post" ? `${service.route}/new` : service.route)
      return null
    })
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-inset-bottom">
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
                <Icon className={cn("h-5 w-5 transition-all", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
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
