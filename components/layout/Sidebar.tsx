"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessageSquare, Bell, User, Settings, Shield, Crown, Zap, LayoutGrid, Rocket } from "lucide-react"
import { useSession } from "next-auth/react"
import { ServiceGrid } from "@/components/shared/ServiceGrid"
import { SERVICES } from "@/config/services"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/my-postings",  icon: LayoutGrid,      label: "My Postings"   },
  { href: "/messages",     icon: MessageSquare,   label: "Messages"      },
  { href: "/notifications",icon: Bell,            label: "Notifications" },
  { href: "/profile/me",   icon: User,            label: "My Profile"    },
  { href: "/settings",     icon: Settings,        label: "Settings"      },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname   = usePathname()
  const { data: session } = useSession()
  const isPremium  = session?.user?.membershipPlan === "PREMIUM"
  const activeServiceId = SERVICES.find((s) => pathname.startsWith(s.route))?.id

  return (
    <aside className={cn(
      "w-64 flex flex-col bg-sidebar border-r border-sidebar-border h-full",
      className
    )}>
      {/* Brand */}
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="Karpo"
            width={36}
            height={36}
            className="rounded-xl object-contain"
          />
          <span className="font-bold text-lg tracking-tight">Karpo</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 space-y-6">
        {/* Core nav */}
        <nav className="space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
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

        {/* Services */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-3">
            Services
          </p>
          <ServiceGrid variant="sidebar" activeId={activeServiceId} isPremium={isPremium} />
        </div>

        {/* Admin */}
        {session?.user?.role === "ADMIN" && (
          <div>
            <div className="h-px bg-border mb-3" />
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
          </div>
        )}
      </div>

      {/* Premium section */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        {isPremium ? (
          /* Premium member chip */
          <Link href="/membership">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <Crown className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-none">Premium Member</p>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-500 mt-0.5 leading-none flex items-center gap-1">
                  <Rocket className="h-2.5 w-2.5" />All listings auto-boosted
                </p>
              </div>
            </div>
          </Link>
        ) : (
          /* Free user upsell */
          <Link href="/membership">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 p-3.5 group">
              <div className="absolute -top-4 -right-4 h-16 w-16 bg-white/10 rounded-full" />
              <div className="absolute -bottom-2 -left-2 h-10 w-10 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-amber-300" />
                  <span className="text-sm font-bold text-white">Go Premium</span>
                </div>
                <p className="text-xs text-white/75 leading-snug mb-2.5">
                  Auto-boost all listings + Deals, Learning & more
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                  <Zap className="h-3 w-3" /> ₹99/month →
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  )
}
