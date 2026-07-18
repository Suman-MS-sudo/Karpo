"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { User, Settings, LogOut, ChevronDown, Menu, Plus, Sparkles, Crown, ShieldCheck, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { MessageIcon } from "@/components/shared/MessageIcon"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { ServiceGrid } from "@/components/shared/ServiceGrid"
import { getInitials } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { ServiceConfig } from "@/config/services"

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const [quickPostOpen, setQuickPostOpen] = useState(false)
  const [searchQuery,   setSearchQuery]   = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const quickPostRef = useRef<HTMLDivElement>(null)
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  useEffect(() => {
    if (!quickPostOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (quickPostRef.current && !quickPostRef.current.contains(e.target as Node)) {
        setQuickPostOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [quickPostOpen])

  const handleServiceSelect = (service: ServiceConfig) => {
    setQuickPostOpen(false)
    router.push(`${service.route}/new`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center px-4 gap-2 shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Brand — mobile only (desktop rail shows logo) */}
      <Link href="/dashboard" className="flex items-center gap-2 mr-2 shrink-0 lg:hidden">
        <Image src="/logo.png" alt="Korpo" width={28} height={28} className="rounded-lg object-contain shrink-0" />
        <span className="font-bold text-foreground whitespace-nowrap">Korpo</span>
      </Link>

      {/* Global search — desktop centered, mobile full width */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings, jobs, rentals, events…"
            className="w-full h-9 pl-9 pr-4 text-sm bg-muted/60 hover:bg-muted focus:bg-background border border-transparent focus:border-border rounded-xl outline-none transition-all placeholder:text-muted-foreground text-foreground"
          />
        </div>
      </form>

      {/* Mobile: search icon button */}
      <button
        onClick={() => router.push("/search")}
        className="sm:hidden h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted text-foreground transition-colors ml-auto"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Quick Post */}
        <div className="relative" ref={quickPostRef}>
          <Button size="sm" onClick={() => setQuickPostOpen((o) => !o)} className="gap-1.5 h-8 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Post</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
          {quickPostOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-xl p-4">
              <p className="text-sm font-semibold mb-3">What would you like to post?</p>
              <ServiceGrid variant="picker" onSelect={handleServiceSelect} />
            </div>
          )}
        </div>

        {/* Messages */}
        <MessageIcon />

        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        {session?.user && (
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl hover:bg-muted px-2 py-1.5 transition-colors"
            >
              <div className="relative">
                <Avatar className={`h-7 w-7 ring-2 ${isPremium ? "ring-amber-400 dark:ring-amber-500" : "ring-border"}`}>
                  <AvatarImage src={session.user.avatarUrl ?? session.user.image ?? ""} />
                  <AvatarFallback className={`text-xs font-semibold ${isPremium ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" : "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"}`}>
                    {getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                {isPremium && (
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 border border-white dark:border-gray-900 flex items-center justify-center">
                    <Crown className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold leading-none">{session.user.name?.split(" ")[0]}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 bg-card border border-border rounded-2xl shadow-xl py-1.5 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded-full">
                        <Crown className="h-2.5 w-2.5" /> Premium Member
                      </span>
                    ) : (
                      <Link
                        href="/membership"
                        onClick={() => setUserMenuOpen(false)}
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-accent-400 hover:underline"
                      >
                        <Sparkles className="h-3 w-3" /> Upgrade — listings appear first
                      </Link>
                    )}
                  </div>

                  <div className="py-1">
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors text-blue-700 dark:text-blue-400 font-medium"
                      >
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/profile/me"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" /> My Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                    </Link>
                  </div>

                  <div className="border-t border-border pt-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
