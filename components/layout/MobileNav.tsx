"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, Home, Briefcase, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Home"      },
  { href: "/marketplace",icon: ShoppingBag,     label: "Buy/Sell"  },
  { href: "/rentals",    icon: Home,            label: "Rentals"   },
  { href: "/referrals",  icon: Briefcase,       label: "Jobs"      },
  { href: "/messages",   icon: MessageSquare,   label: "Messages"  },
  { href: "/profile/me", icon: User,            label: "Profile"   },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-inset-bottom">
      <div className="flex">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[9px] font-semibold uppercase tracking-wider transition-colors relative",
                isActive ? "text-primary-600 dark:text-primary-400" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
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
