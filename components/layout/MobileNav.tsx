"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, MessageSquare, User, Plus, LayoutGrid,
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift, Search,
} from "lucide-react"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
}

// Per-service bottom tabs: [Browse, Post, My]
const SERVICE_TABS: Record<string, Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>> = {
  "buy-sell":     [
    { href: "/marketplace",     label: "Browse",   icon: ShoppingBag },
    { href: "/marketplace/new", label: "Post",     icon: Plus        },
    { href: "/my-listings",     label: "Mine",     icon: LayoutGrid  },
    { href: "/messages",        label: "Messages", icon: MessageSquare },
    { href: "/profile/me",      label: "Profile",  icon: User        },
  ],
  "rentals":      [
    { href: "/rentals",     label: "Browse",   icon: Home          },
    { href: "/rentals/new", label: "Post",     icon: Plus          },
    { href: "/my-rentals",  label: "Mine",     icon: LayoutGrid    },
    { href: "/messages",    label: "Messages", icon: MessageSquare },
    { href: "/profile/me",  label: "Profile",  icon: User          },
  ],
  "job-referrals": [
    { href: "/referrals",     label: "Browse",   icon: Briefcase     },
    { href: "/referrals/new", label: "Post",     icon: Plus          },
    { href: "/my-referrals",  label: "Mine",     icon: LayoutGrid    },
    { href: "/messages",      label: "Messages", icon: MessageSquare },
    { href: "/profile/me",    label: "Profile",  icon: User          },
  ],
  "carpool":      [
    { href: "/carpool",     label: "Find",     icon: Search          },
    { href: "/carpool/new", label: "Offer",    icon: Plus            },
    { href: "/my-carpool",  label: "Mine",     icon: LayoutGrid      },
    { href: "/messages",    label: "Messages", icon: MessageSquare   },
    { href: "/profile/me",  label: "Profile",  icon: User            },
  ],
  "services":     [
    { href: "/skills",       label: "Browse",   icon: Wrench          },
    { href: "/skills/new",   label: "Offer",    icon: Plus            },
    { href: "/my-services",  label: "Mine",     icon: LayoutGrid      },
    { href: "/messages",     label: "Messages", icon: MessageSquare   },
    { href: "/profile/me",   label: "Profile",  icon: User            },
  ],
  "events":       [
    { href: "/events",     label: "Browse",   icon: Users             },
    { href: "/events/new", label: "Create",   icon: Plus              },
    { href: "/my-events",  label: "Mine",     icon: LayoutGrid        },
    { href: "/messages",   label: "Messages", icon: MessageSquare     },
    { href: "/profile/me", label: "Profile",  icon: User              },
  ],
}

const DEFAULT_TABS = [
  { href: "/dashboard",   label: "Home",     icon: LayoutDashboard },
  { href: "/marketplace", label: "Buy/Sell", icon: ShoppingBag     },
  { href: "/referrals",   label: "Jobs",     icon: Briefcase       },
  { href: "/messages",    label: "Messages", icon: MessageSquare   },
  { href: "/profile/me",  label: "Profile",  icon: User            },
]

const MY_ROUTE_MAP: Record<string, string> = {
  "/my-listings":  "buy-sell",
  "/my-rentals":   "rentals",
  "/my-referrals": "job-referrals",
  "/my-carpool":   "carpool",
  "/my-services":  "services",
  "/my-events":    "events",
  "/my-learning":  "learning",
}

export function MobileNav() {
  const pathname = usePathname()
  const cleanPath = pathname.split("?")[0]

  const activeService =
    SERVICES.find((s) => pathname.startsWith(s.route)) ??
    SERVICES.find((s) => s.id === MY_ROUTE_MAP[cleanPath])

  const tabs = activeService && SERVICE_TABS[activeService.id]
    ? SERVICE_TABS[activeService.id]
    : DEFAULT_TABS

  const ServiceIcon = activeService ? (iconMap[activeService.icon] ?? null) : null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-inset-bottom">
      {/* Service context strip */}
      {activeService && (
        <div className={cn("flex items-center gap-2 px-4 py-1.5 border-b border-border/50 text-xs font-medium", activeService.color)}>
          {ServiceIcon && <ServiceIcon className="h-3 w-3 shrink-0" />}
          <span>{activeService.name}</span>
          <Link href="/dashboard" className="ml-auto text-muted-foreground hover:text-foreground text-[10px]">
            ← All Services
          </Link>
        </div>
      )}

      <div className="flex">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[9px] font-semibold uppercase tracking-wider transition-colors relative",
                isActive
                  ? activeService ? activeService.color : "text-primary-600 dark:text-primary-400"
                  : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
                  activeService ? activeService.bgColor.replace("bg-", "bg-").replace("/15", "") : "bg-primary-600 dark:bg-primary-400"
                )} />
              )}
              <Icon className={cn("h-5 w-5 transition-all", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
