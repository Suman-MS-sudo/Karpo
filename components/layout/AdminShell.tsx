"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Building2, Tag, Shield, FileWarning, BadgeCheck,
  LogOut, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin",                 label: "Dashboard",         icon: LayoutDashboard, exact: true },
  { href: "/admin/users",           label: "Users",             icon: Users            },
  { href: "/admin/companies",       label: "Companies",         icon: Building2        },
  { href: "/admin/id-verifications", label: "ID Verifications", icon: BadgeCheck       },
  { href: "/admin/deals",           label: "Deals",             icon: Tag              },
  { href: "/admin/concierge",       label: "Concierge",         icon: Shield           },
  { href: "/admin/reports",         label: "Reports",           icon: FileWarning      },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#f8f9fb]">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#1E3A5F] text-white shrink-0">
        {/* Logo */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10 shrink-0">
          <Image src="/logo.png" alt="Korpo" width={30} height={30} className="rounded-lg" />
          <div>
            <p className="font-bold text-sm leading-none">Korpo</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4 text-[#1E3A5F]" />
            <span className="font-semibold text-[#1E3A5F]">Admin Panel</span>
            {pathname !== "/admin" && (
              <>
                <span className="text-gray-300">/</span>
                <span className="capitalize text-gray-600">
                  {pathname.split("/").filter(Boolean).slice(1).join(" / ")}
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
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
