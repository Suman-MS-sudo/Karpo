"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift, LayoutDashboard, Pin, PinOff,
  Building2, FileWarning,
} from "lucide-react"

const ADMIN_SUB_ITEMS = [
  { href: "/admin",           label: "Dashboard",  Icon: LayoutDashboard, exact: true  },
  { href: "/admin/users",     label: "Users",      Icon: Users,           exact: false },
  { href: "/admin/companies", label: "Companies",  Icon: Building2,       exact: false },
  { href: "/admin/deals",     label: "Deals",      Icon: Tag,             exact: false },
  { href: "/admin/concierge", label: "Concierge",  Icon: Shield,          exact: false },
  { href: "/admin/reports",   label: "Reports",    Icon: FileWarning,     exact: false },
]

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

const STORAGE_KEY      = "korpo:pinned-rail"
const PANE_PINNED_KEY  = "korpo:rail-pane-pinned"

export function ServiceRail() {
  const pathname  = usePathname()
  const cleanPath = pathname.split("?")[0]
  const { data: session } = useSession()
  const isAdminUser = session?.user?.role === "ADMIN"

  const [pinned, setPinned]       = useState<Set<string>>(new Set())
  const [panePinned, setPanePinned] = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setPinned(new Set(JSON.parse(stored)))
      setPanePinned(localStorage.getItem(PANE_PINNED_KEY) === "true")
    } catch {}
    setMounted(true)
  }, [])

  const togglePanePin = () => {
    setPanePinned(prev => {
      localStorage.setItem(PANE_PINNED_KEY, String(!prev))
      return !prev
    })
  }

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPinned(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  // Build full item list
  const allItems = [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Dashboard",
      Icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
      bgColor: "bg-muted",
      color: "text-foreground",
      adminOnly: false,
    },
    ...SERVICES.filter(s => s.isActive).map(s => ({
      id: s.id,
      href: s.route,
      label: s.name,
      Icon: iconMap[s.icon] ?? ShoppingBag,
      isActive: pathname.startsWith(s.route) || MY_ROUTE_MAP[cleanPath] === s.id,
      bgColor: s.bgColor,
      color: s.color,
      adminOnly: false,
    })),
    {
      id: "admin",
      href: "/admin",
      label: "Admin",
      Icon: Shield,
      isActive: pathname.startsWith("/admin"),
      bgColor: "bg-blue-100 dark:bg-blue-950/40",
      color: "text-blue-600 dark:text-blue-400",
      adminOnly: true,
    },
  ]

  const visibleItems = allItems.filter(item => !item.adminOnly || isAdminUser)

  // Split into pinned (top) and unpinned (below), preserving original order within each group
  const pinnedItems   = visibleItems.filter(item => pinned.has(item.id))
  const unpinnedItems = visibleItems.filter(item => !pinned.has(item.id))

  const renderItem = (item: typeof allItems[0]) => {
    const isPinned = pinned.has(item.id)
    const showLabel = panePinned
    return (
      <div key={item.id} className="relative group/item">
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 h-10 w-full rounded-xl pr-1",
            "transition-colors duration-150",
            item.isActive ? cn(item.bgColor, "shadow-sm") : "hover:bg-muted"
          )}
        >
          <span className="flex items-center justify-center w-[44px] h-full shrink-0">
            <item.Icon className={cn("h-[18px] w-[18px]", item.isActive ? item.color : "text-muted-foreground")} />
          </span>
          <span className={cn(
            "text-sm font-medium whitespace-nowrap flex-1 min-w-0",
            showLabel ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-100 delay-150",
            item.isActive ? item.color : "text-muted-foreground"
          )}>
            {item.label}
          </span>

          {/* Pin button */}
          <button
            onClick={(e) => togglePin(item.id, e)}
            title={isPinned ? "Unpin" : "Pin to top"}
            className={cn(
              "shrink-0 h-6 w-6 rounded-md flex items-center justify-center",
              showLabel ? "opacity-0 group-hover/item:opacity-100" : "opacity-0 group-hover:opacity-100 group-hover/item:opacity-100",
              "transition-opacity duration-100",
              isPinned
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className={cn(
      "hidden lg:block relative shrink-0 transition-[width] duration-200 ease-in-out",
      panePinned ? "w-[220px]" : "w-[68px]"
    )}>
      <div className={cn(
        "group",
        "absolute top-0 left-0 bottom-0 z-50",
        "flex flex-col",
        "bg-sidebar border-r border-sidebar-border",
        "transition-[width] duration-200 ease-in-out",
        "overflow-hidden",
        panePinned
          ? "w-[220px]"
          : "w-[68px] hover:w-[220px] hover:shadow-[4px_0_20px_rgba(0,0,0,0.07)] dark:hover:shadow-[4px_0_20px_rgba(0,0,0,0.3)]"
      )}>

        {/* Logo row */}
        <div className="h-14 flex items-center border-b border-sidebar-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
            <Image
              src="/logo.png" alt="Korpo"
              width={32} height={32}
              className="rounded-lg object-contain shrink-0 ml-[18px]"
            />
            <span className={cn(
              "font-bold text-sm whitespace-nowrap text-foreground flex-1 min-w-0",
              panePinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-100 delay-150"
            )}>
              Korpo
            </span>
          </Link>
          {/* Pane pin toggle */}
          <button
            onClick={togglePanePin}
            title={panePinned ? "Unpin pane" : "Pin pane open"}
            className={cn(
              "shrink-0 h-7 w-7 mr-2 rounded-md flex items-center justify-center",
              "transition-all duration-100",
              panePinned
                ? "opacity-100 text-primary hover:bg-primary/10"
                : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted hover:text-foreground delay-150"
            )}
          >
            {panePinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2">
          {/* Pinned section */}
          {mounted && pinnedItems.length > 0 && (
            <>
              <p className={cn(
                "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1",
                panePinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-100 delay-150"
              )}>
                Pinned
              </p>
              <div className="space-y-0.5 mb-1">
                {pinnedItems.map(item => (
                  <div key={item.id}>
                    {renderItem(item)}
                    {item.id === "admin" && pathname.startsWith("/admin") && (
                      <div className="mt-0.5 space-y-0.5 pl-[10px]">
                        {ADMIN_SUB_ITEMS.map(sub => {
                          const isSubActive = sub.exact
                            ? pathname === sub.href
                            : pathname === sub.href || pathname.startsWith(sub.href + "/")
                          return (
                            <Link key={sub.href} href={sub.href} className={cn(
                              "flex items-center gap-3 h-9 w-full rounded-xl pr-1 transition-colors duration-150",
                              isSubActive ? "bg-blue-100 dark:bg-blue-950/40 shadow-sm" : "hover:bg-muted"
                            )}>
                              <span className="flex items-center justify-center w-[34px] h-full shrink-0">
                                <sub.Icon className={cn("h-[15px] w-[15px]", isSubActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")} />
                              </span>
                              <span className={cn(
                                "text-xs font-medium whitespace-nowrap flex-1 min-w-0",
                                panePinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-100 delay-150",
                                isSubActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                              )}>{sub.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="h-px bg-border mx-2 my-2" />
            </>
          )}

          {mounted && pinnedItems.length > 0 && (
            <p className={cn(
              "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1",
              panePinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-100 delay-150"
            )}>
              All
            </p>
          )}
          <div className="space-y-0.5">
            {(mounted ? unpinnedItems : visibleItems).map(item => (
              <div key={item.id}>
                {renderItem(item)}
                {/* Admin sub-items — shown inline when on /admin routes */}
                {item.id === "admin" && pathname.startsWith("/admin") && (
                  <div className="mt-0.5 space-y-0.5 pl-[10px]">
                    {ADMIN_SUB_ITEMS.map(sub => {
                      const isSubActive = sub.exact
                        ? pathname === sub.href
                        : pathname === sub.href || pathname.startsWith(sub.href + "/")
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-3 h-9 w-full rounded-xl pr-1",
                            "transition-colors duration-150",
                            isSubActive
                              ? "bg-blue-100 dark:bg-blue-950/40 shadow-sm"
                              : "hover:bg-muted"
                          )}
                        >
                          <span className="flex items-center justify-center w-[34px] h-full shrink-0">
                            <sub.Icon className={cn(
                              "h-[15px] w-[15px]",
                              isSubActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                            )} />
                          </span>
                          <span className={cn(
                            "text-xs font-medium whitespace-nowrap flex-1 min-w-0",
                            panePinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity duration-100 delay-150",
                            isSubActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                          )}>
                            {sub.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

      </div>
    </div>
  )
}
