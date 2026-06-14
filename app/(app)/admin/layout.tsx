"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Building2, Tag, Shield, FileWarning,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin/users",     label: "Users",       icon: Users            },
  { href: "/admin/companies", label: "Companies",   icon: Building2        },
  { href: "/admin/deals",     label: "Deals",       icon: Tag              },
  { href: "/admin/concierge", label: "Concierge",   icon: Shield           },
  { href: "/admin/reports",   label: "Reports",     icon: FileWarning      },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex min-h-full">
      {/* Admin sidebar */}
      <aside className="hidden md:flex flex-col w-48 border-r border-border bg-card shrink-0 py-4 px-2 gap-0.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">Admin</p>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </aside>

      {/* Mobile tab strip */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-card border-t border-border px-1 py-1 gap-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                active ? "text-primary-600" : "text-muted-foreground"
              )}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="flex-1 min-w-0 pb-20 md:pb-0">{children}</div>
    </div>
  )
}
