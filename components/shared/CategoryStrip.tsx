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
  compact?:       boolean // Skills-sized tiles (72px) instead of the default larger ones — keep in sync with SkillCategoryStrip
}

export function CategoryStrip({ items, activeValue, basePath, paramName, ringClass, glowShadow, underlineGradient, compact = false }: Props) {
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
          className={cn("shrink-0 my-auto rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed", compact ? "w-10 h-10" : "w-7 h-7")}
        >
          <ChevronLeft className={compact ? "h-5 w-5" : "h-4 w-4"} />
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
                `${basePath}?${paramName}=${encodeURIComponent(item.value)}`
              const Icon = ICON_REGISTRY[item.icon] ?? Package
              return (
                <Link
                  key={item.value}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-2 relative transition-all duration-150 group",
                    compact ? "py-4 flex-1 min-w-[108px]" : "py-3 flex-1 min-w-[104px] sm:min-w-[136px]"
                  )}
                >
                  <div className={cn(
                    "relative rounded-2xl flex items-center justify-center transition-all duration-150 overflow-hidden",
                    compact ? "h-[72px] w-[72px]" : "h-16 w-16 sm:h-24 sm:w-24",
                    // Grounding shadow + a subtle bottom-heavy gradient give the tile
                    // itself some depth even before the glossy highlight is added.
                    "shadow-[0_3px_0_rgba(0,0,0,0.06)_inset,0_6px_14px_-6px_rgba(0,0,0,0.35)] dark:shadow-[0_3px_0_rgba(0,0,0,0.25)_inset,0_6px_14px_-6px_rgba(0,0,0,0.6)]",
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
                      <>
                        {/* Glossy top-left highlight + a darker floor — no external
                            image, just gradients/shadow standing in for a "3D" tile
                            until real category artwork exists (see item.image). */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/5 to-transparent dark:from-white/15 dark:via-white/0" aria-hidden />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent dark:from-black/25" aria-hidden />
                        <Icon
                          className={cn("relative drop-shadow-sm", compact ? "h-[38px] w-[38px]" : "h-7 w-7 sm:h-10 sm:w-10", item.iconColor)}
                          strokeWidth={2.5}
                        />
                      </>
                    )}
                  </div>
                  <span className={cn("font-outfit", "font-bold tracking-tight text-center leading-tight line-clamp-2", compact ? "text-sm max-w-[100px]" : "text-xs sm:text-sm max-w-[100px] sm:max-w-[132px]", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                  <span className={cn("tabular-nums leading-none", compact ? "text-xs" : "text-[10px]", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                    {item.count}
                  </span>
                  <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r transition-all duration-150", underlineGradient, compact ? "h-1" : "h-0.5", isActive ? (compact ? "w-12" : "w-8") : "w-0")} />
                </Link>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => scrollCat("right")}
          disabled={!scrolled.right}
          className={cn("shrink-0 my-auto rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed", compact ? "w-10 h-10" : "w-7 h-7")}
        >
          <ChevronRight className={compact ? "h-5 w-5" : "h-4 w-4"} />
        </button>
      </div>
    </div>
  )
}
