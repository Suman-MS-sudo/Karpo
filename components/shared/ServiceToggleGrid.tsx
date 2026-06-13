"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift, Lock, ArrowRight,
} from "lucide-react"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift,
}

interface Props {
  isPremium: boolean
  initialHidden: string[]
}

export function ServiceToggleGrid({ isPremium, initialHidden }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set(initialHidden))

  const toggle = (e: React.MouseEvent, serviceId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const isNowHidden = !hidden.has(serviceId)
    setHidden((prev) => {
      const next = new Set(prev)
      if (isNowHidden) next.add(serviceId)
      else next.delete(serviceId)
      return next
    })

    fetch("/api/user/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, hidden: isNowHidden }),
    }).catch(() => {
      // revert optimistic update on error
      setHidden((prev) => {
        const next = new Set(prev)
        if (isNowHidden) next.delete(serviceId)
        else next.add(serviceId)
        return next
      })
    })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {SERVICES.filter((s) => s.isActive).map((service) => {
        const Icon = iconMap[service.icon] ?? ShoppingBag
        const locked = service.isPremium && !isPremium
        const isHidden = hidden.has(service.id)
        const enabled = !isHidden

        return (
          <Link
            key={service.id}
            href={isHidden ? "#" : locked ? "/membership" : service.route}
            className={cn("group/card block", isHidden && "pointer-events-none")}
            tabIndex={isHidden ? -1 : 0}
          >
            <div className={cn(
              "relative flex flex-col gap-3 p-4 rounded-2xl border bg-card transition-all duration-200",
              isHidden
                ? "opacity-40 grayscale border-border"
                : locked
                  ? "border-border opacity-70 hover:opacity-100 hover:shadow-md hover:-translate-y-0.5"
                  : "border-border hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5"
            )}>

              {/* Top row: icon + toggle */}
              <div className="flex items-start justify-between gap-2">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  service.bgColor
                )}>
                  <Icon className={cn("h-5 w-5", service.color)} />
                </div>

                {/* Toggle switch — pointer-events-auto so it works even when card link is disabled */}
                <button
                  onClick={(e) => toggle(e, service.id)}
                  className={cn(
                    "pointer-events-auto relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 mt-0.5",
                    enabled ? "bg-primary-600" : "bg-muted-foreground/30"
                  )}
                  title={enabled ? "Hide this service" : "Show this service"}
                >
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                    enabled ? "translate-x-[18px]" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Name + description */}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-foreground leading-tight">{service.name}</p>

                  {enabled && locked && <Lock className="h-3 w-3 text-muted-foreground/50" />}
                  {enabled && !locked && service.badge === "Popular" && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Hot
                    </span>
                  )}
                  {enabled && service.badge === "Premium" && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                  {isHidden ? "Hidden — toggle to restore" : service.description}
                </p>
              </div>

              {/* Arrow on hover (only when enabled and navigable) */}
              {enabled && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/card:text-muted-foreground/60 transition-all absolute bottom-3.5 right-3.5" />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
