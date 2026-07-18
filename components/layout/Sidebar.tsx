"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, MessageSquare, Bell, User, Settings, Shield,
  LayoutGrid, Plus, ChevronLeft, Search,
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Gift,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
}

const SERVICE_SUBNAV: Record<string, Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>> = {
  "buy-sell": [
    { href: "/marketplace",     label: "Browse Listings", icon: ShoppingBag },
    { href: "/marketplace/new", label: "Post an Item",    icon: Plus        },
    { href: "/my-listings",     label: "My Listings",     icon: LayoutGrid  },
  ],
  "rentals": [
    { href: "/rentals",     label: "Browse Rentals", icon: Home       },
    { href: "/rentals/new", label: "Post Rental",    icon: Plus       },
    { href: "/my-rentals",  label: "My Rentals",     icon: LayoutGrid },
  ],
  "job-referrals": [
    { href: "/referrals",     label: "Browse Referrals", icon: Briefcase },
    { href: "/referrals/new", label: "Post a Referral",  icon: Plus      },
    { href: "/my-postings",   label: "My Referrals",     icon: LayoutGrid },
  ],
  "carpool": [
    { href: "/carpool",     label: "Find a Ride",  icon: Search },
    { href: "/carpool/new", label: "Offer a Ride", icon: Plus   },
  ],
  "services": [
    { href: "/skills",      label: "Browse Skills", icon: Search },
    { href: "/skills/new",  label: "Offer a Skill", icon: Plus   },
  ],
  "deals": [
    { href: "/deals", label: "All Deals", icon: Tag },
  ],
  "events": [
    { href: "/events",     label: "Browse Events", icon: Users },
    { href: "/events/new", label: "Create Event",  icon: Plus  },
  ],
  "learning": [
    { href: "/learning",     label: "Browse Courses", icon: GraduationCap },
    { href: "/learning/new", label: "Create Course",  icon: Plus          },
  ],
  "concierge": [
    { href: "/concierge", label: "All Services", icon: Shield },
  ],
  "benefits": [
    { href: "/benefits", label: "All Benefits", icon: Gift },
  ],
}

const HUB_NAV = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Home"          },
  { href: "/my-postings",   icon: LayoutGrid,      label: "My Postings"   },
  { href: "/messages",      icon: MessageSquare,   label: "Messages"      },
  { href: "/notifications", icon: Bell,            label: "Notifications" },
  { href: "/profile/me",    icon: User,            label: "Profile"       },
  { href: "/settings",      icon: Settings,        label: "Settings"      },
]

const CTX_NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Home"     },
  { href: "/messages",   icon: MessageSquare,   label: "Messages" },
  { href: "/my-postings",icon: LayoutGrid,      label: "Postings" },
  { href: "/profile/me", icon: User,            label: "Profile"  },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const activeService = SERVICES.find((s) => pathname.startsWith(s.route))
  const ServiceIcon   = activeService ? (iconMap[activeService.icon] ?? ShoppingBag) : null
  const subLinks      = activeService ? (SERVICE_SUBNAV[activeService.id] ?? []) : []

  return (
    <aside className={cn("w-64 flex flex-col bg-sidebar border-r border-sidebar-border h-full", className)}>
      {/* Brand */}
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Korpo" width={36} height={36} className="rounded-xl object-contain" />
          <span className="font-bold text-lg tracking-tight">Korpo</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">

        {activeService ? (
          /* ── SERVICE CONTEXT MODE ───────────────────────────────────
             User is inside a specific service.
             Show only that service's links + minimal core links.
             All other 9 services are hidden.                         */
          <div className="space-y-1">
            {/* Back to hub */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors mb-3"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>All Services</span>
            </Link>

            {/* Service identity header */}
            <div className={cn("flex items-center gap-2.5 px-3 py-3 rounded-xl mb-1", activeService.bgColor)}>
              {ServiceIcon && <ServiceIcon className={cn("h-4 w-4 shrink-0", activeService.color)} />}
              <span className={cn("font-semibold text-sm leading-tight", activeService.color)}>
                {activeService.name}
              </span>
            </div>

            {/* Service-specific sub-links */}
            <nav className="space-y-0.5 mt-1">
              {subLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="h-px bg-border my-4" />

            {/* Minimal core links */}
            <nav className="space-y-0.5">
              {CTX_NAV.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

        ) : (
          /* ── HUB MODE ───────────────────────────────────────────────
             User is on Dashboard / Messages / Profile etc.
             Show full core nav + compact 2-col icon grid of services. */
          <div className="space-y-5">
            <nav className="space-y-0.5">
              {HUB_NAV.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Services — compact 2-col icon grid */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                Services
              </p>
              <div className="grid grid-cols-2 gap-1">
                {SERVICES.filter((s) => s.isActive).map((service) => {
                  const Icon = iconMap[service.icon] ?? ShoppingBag
                  return (
                    <Link
                      key={service.id}
                      href={service.route}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg text-[11px] font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", service.bgColor)}>
                        <Icon className={cn("h-3.5 w-3.5", service.color)} />
                      </div>
                      <span className="truncate leading-tight">{service.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Admin */}
            {session?.user?.role === "ADMIN" && (
              <>
                <div className="h-px bg-border" />
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    pathname.startsWith("/admin")
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  Admin Panel
                </Link>
              </>
            )}
          </div>
        )}
      </div>

    </aside>
  )
}
