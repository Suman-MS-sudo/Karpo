"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useState } from "react"
import {
  ChevronLeft, ChevronRight, LayoutDashboard,
  Cpu, Car, Armchair, Tv, BookOpen, Dumbbell, Shirt, UtensilsCrossed, Briefcase,
  Activity, Palette, Ticket, Music, Package,
  Building2, BedDouble, Home, Users2, Warehouse,
  Database, Megaphone, TrendingUp, Users, Scale,
  Repeat, Calendar, Clock, Wrench, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"


// Icons are resolved from a string key rather than passed as component
// references — passing component functions as props from a Server Component
// into a "use client" component isn't serializable across the RSC boundary.
const ICON_REGISTRY: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Cpu, Car, Armchair, Tv, BookOpen, Dumbbell, Shirt, UtensilsCrossed,
  Briefcase, Activity, Palette, Ticket, Music, Package,
  Building2, BedDouble, Home, Users2, Warehouse,
  Database, Megaphone, TrendingUp, Users, Scale,
  Repeat, Calendar, Clock, Wrench, Tag,
}

export interface StripItem {
  value:     string
  label:     string
  icon:      keyof typeof ICON_REGISTRY | string
  iconBg:    string
  iconColor: string
  count:     number
  image?:    string // real logo/photo — takes priority over the lucide icon when set
}

interface Props {
  items:          StripItem[]
  activeValue:    string
  basePath:       string
  paramName:      string
  ringClass:      string // e.g. "ring-blue-400"
  glowShadow:     string // e.g. "shadow-[0_0_12px_rgba(59,130,246,0.4)]"
  underlineGradient: string // e.g. "from-blue-500 to-cyan-400"
}

export function CategoryStrip({ items, activeValue, basePath, paramName, ringClass, glowShadow, underlineGradient }: Props) {
  const catRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState({ left: false, right: true })

  function scrollCat(dir: "left" | "right") {
    const el = catRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -el.clientWidth : el.clientWidth, behavior: "smooth" })
  }

  function onScroll() {
    const el = catRef.current
    if (!el) return
    setScrolled({ left: el.scrollLeft > 8, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8 })
  }

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <button
          onClick={() => scrollCat("left")}
          disabled={!scrolled.left}
          className="shrink-0 w-7 h-7 my-auto rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div ref={catRef} onScroll={onScroll} className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex">
            {items.map((item) => {
              const isActive = activeValue === item.value
              // An item can carry an absolute route of its own (e.g. the dashboard's
              // service strip, where each tile navigates to a different section like
              // /marketplace) rather than a filter value to append to basePath as a
              // query param (e.g. marketplace's category tabs) — link straight there.
              const href =
                item.value === "All"      ? basePath :
                item.value.startsWith("/") ? item.value :
                `${basePath}?${paramName}=${item.value}`
              const Icon = ICON_REGISTRY[item.icon] ?? Package
              return (
                <Link
                  key={item.value}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 relative transition-all duration-150 group",
                    "flex-1 min-w-[104px] sm:min-w-[136px]"
                  )}
                >
                  <div className={cn(
                    "h-16 w-16 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center transition-all duration-150 overflow-hidden",
                    isActive
                      ? cn(item.iconBg, "ring-2 scale-110", ringClass, glowShadow)
                      : cn(item.iconBg, "group-hover:scale-105 group-hover:ring-2", ringClass)
                  )}>
                    {item.image ? (
                      // Requested well above display size (2.5x+) so the CSS
                      // scale-110 on active/hover doesn't upsample an
                      // already-rasterized image and turn it soft.
                      <Image
                        src={item.image}
                        alt={item.label}
                        width={260}
                        height={260}
                        quality={95}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className={cn("h-7 w-7 sm:h-10 sm:w-10", item.iconColor)} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                  <span className={cn("font-outfit", "text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                  <span className={cn("text-[10px] tabular-nums leading-none", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                    {item.count}
                  </span>
                  <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r transition-all duration-150", underlineGradient, isActive ? "w-8" : "w-0")} />
                </Link>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => scrollCat("right")}
          disabled={!scrolled.right}
          className="shrink-0 w-7 h-7 my-auto rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
