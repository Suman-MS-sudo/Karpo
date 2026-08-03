"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Building2, Tag, Shield, FileWarning, BadgeCheck,
  LogOut, ChevronRight, Sparkles, MessageSquareWarning,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useOpenConcernsCount } from "@/hooks/useOpenConcernsCount"

const NAV = [
  { href: "/admin",                 label: "Dashboard",         icon: LayoutDashboard, exact: true,  color: "text-sky-400",    bg: "bg-sky-500/15",    topbarColor: "text-sky-600 dark:text-sky-400"       },
  { href: "/admin/users",           label: "Users",             icon: Users,           exact: false, color: "text-blue-400",   bg: "bg-blue-500/15",   topbarColor: "text-blue-600 dark:text-blue-400"     },
  { href: "/admin/companies",       label: "Companies",         icon: Building2,       exact: false, color: "text-violet-400", bg: "bg-violet-500/15", topbarColor: "text-violet-600 dark:text-violet-400" },
  { href: "/admin/id-verifications", label: "ID Verifications", icon: BadgeCheck,      exact: false, color: "text-emerald-400",bg: "bg-emerald-500/15",topbarColor: "text-emerald-600 dark:text-emerald-400"},
  { href: "/admin/deals",           label: "Deals",             icon: Tag,             exact: false, color: "text-rose-400",   bg: "bg-rose-500/15",   topbarColor: "text-rose-600 dark:text-rose-400"     },
  { href: "/admin/concierge",       label: "Concierge",         icon: Shield,          exact: false, color: "text-cyan-400",   bg: "bg-cyan-500/15",   topbarColor: "text-cyan-600 dark:text-cyan-400"     },
  { href: "/admin/reports",         label: "Reports",           icon: FileWarning,     exact: false, color: "text-amber-400",  bg: "bg-amber-500/15",  topbarColor: "text-amber-600 dark:text-amber-400"   },
  { href: "/admin/concerns",        label: "Concerns",          icon: MessageSquareWarning, exact: false, color: "text-orange-400", bg: "bg-orange-500/15", topbarColor: "text-orange-600 dark:text-orange-400" },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const active = NAV.find(({ href, exact }) => exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"))
  const openConcerns = useOpenConcernsCount()

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#f7f7fb] dark:bg-[#0b0d14]">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gradient-to-b from-slate-900 to-slate-950 text-white shrink-0 relative">
        <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10 shrink-0 relative">
          <Image src="/logo.png" alt="Korpo" width={30} height={30} className="rounded-lg" />
          <div>
            <p className="font-bold text-sm leading-none">Korpo</p>
            <p className="text-[10px] text-indigo-300 mt-0.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Admin Portal
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1 relative">
          {NAV.map(({ href, label, icon: Icon, exact, color, bg }) => {
            const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                <span className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", isActive ? bg : "bg-white/5")}>
                  <Icon className={cn("h-4 w-4", isActive ? color : "text-slate-400")} />
                </span>
                {label}
                {href === "/admin/concerns" && openConcerns > 0 && (
                  <span className="ml-auto h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {openConcerns > 9 ? "9+" : openConcerns}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/10 relative">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all w-full"
          >
            <span className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-red-500/10">
              <LogOut className="h-4 w-4" />
            </span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            {active && (
              <span className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0", active.bg)}>
                <active.icon className={cn("h-3.5 w-3.5", active.topbarColor)} />
              </span>
            )}
            <span className="font-bold text-foreground">Admin Panel</span>
            {pathname !== "/admin" && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="capitalize text-muted-foreground">
                  {pathname.split("/").filter(Boolean).slice(1).join(" / ")}
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              ← Back to App
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
