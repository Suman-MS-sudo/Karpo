"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift,
} from "lucide-react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
}

const MY_ROUTE_MAP: Record<string, string> = {
  "/my-listings":  "buy-sell",
  "/my-rentals":   "rentals",
  "/my-referrals": "job-referrals",
  "/my-carpool":   "carpool",
  "/my-services":  "services",
  "/my-events":    "events",
  "/my-learning":  "learning",
}

export function ServiceRail() {
  const pathname  = usePathname()
  const cleanPath = pathname.split("?")[0]

  return (
    /*
     * Outer div reserves 68px in the flex layout.
     * Inner div is absolutely positioned and expands on hover,
     * overlaying the ServiceSidebar without shifting any column.
     */
    <div className="hidden lg:block relative w-[68px] shrink-0">
      <div className={cn(
        "group",
        "absolute top-0 left-0 bottom-0 z-50",
        "flex flex-col",
        "bg-sidebar border-r border-sidebar-border",
        // Width: 68px collapsed → 220px expanded
        "w-[68px] hover:w-[220px]",
        "transition-[width] duration-200 ease-in-out",
        "overflow-hidden",
        "hover:shadow-[4px_0_20px_rgba(0,0,0,0.07)] dark:hover:shadow-[4px_0_20px_rgba(0,0,0,0.3)]"
      )}>

        {/* ── Logo row ── */}
        <div className="h-14 flex items-center border-b border-sidebar-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 w-full">
            {/*
             * Icon is always at the center of 68px.
             * pl = (68 - 32px image) / 2 = 18px
             */}
            <Image
              src="/logo.png" alt="Korpo"
              width={32} height={32}
              className="rounded-lg object-contain shrink-0 ml-[18px]"
            />
            {/* "Korpo" text hidden until expanded */}
            <span className={cn(
              "font-bold text-sm whitespace-nowrap text-foreground",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-100 delay-150"
            )}>
              Korpo
            </span>
          </Link>
        </div>

        {/* ── Service nav ── */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-3 space-y-0.5 px-2">
          {SERVICES.filter((s) => s.isActive).map((service) => {
            const Icon     = iconMap[service.icon] ?? ShoppingBag
            const isActive = pathname.startsWith(service.route) || MY_ROUTE_MAP[cleanPath] === service.id
            return (
              <Link
                key={service.id}
                href={service.route}
                className={cn(
                  "flex items-center gap-3 h-10 w-full rounded-xl",
                  "transition-colors duration-150",
                  isActive ? cn(service.bgColor, "shadow-sm") : "hover:bg-muted"
                )}
              >
                {/*
                 * Icon wrapper is exactly 44px so the icon sits centered
                 * inside the 68px column (2px rail padding each side + 44px = 48px,
                 * icon center at 2+22 = 24px from rail edge → close enough to centered).
                 * shrink-0 ensures it never collapses.
                 */}
                <span className="flex items-center justify-center w-[44px] h-full shrink-0">
                  <Icon className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? service.color : "text-muted-foreground"
                  )} />
                </span>

                {/* Service name — invisible when collapsed, fades in on expand */}
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap flex-1 min-w-0",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-100 delay-150",
                  isActive ? service.color : "text-muted-foreground"
                )}>
                  {service.name}
                </span>

              </Link>
            )
          })}
        </nav>

      </div>
    </div>
  )
}
