"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import Link from "next/link"
import Image from "next/image"
import {
  Briefcase, LogOut, Shield, Sun, Moon, Monitor, Check, User, ArrowRight, Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageTitle } from "@/components/ui/page-title"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

interface AccountData {
  email: string
  company?: { name: string; logo?: string }
  isVerified: boolean
  role: string
}

const LABEL = "block text-xs font-medium text-muted-foreground mb-1.5"

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()

  const [account, setAccount] = useState<AccountData>({ email: "", company: undefined, isVerified: false, role: "USER" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setAccount({
          email:      data.email      ?? "",
          company:    data.company,
          isVerified: data.isVerified ?? false,
          role:       data.role       ?? "USER",
        })
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded-lg" />
            <div className="h-10 w-full bg-muted rounded-xl" />
            <div className="h-10 w-full bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <PageTitle badge="Settings" badgeIcon={Settings} title="Settings" subtitle="Manage your account and preferences" />

      {/* ── Profile link ─────────────────────────────────────────────────── */}
      <Link
        href="/profile/me"
        className="flex items-center gap-3 bg-card border border-border rounded-2xl p-5 hover:border-primary-400 transition-colors group"
      >
        <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Edit your profile</p>
          <p className="text-xs text-muted-foreground">Name, photo, bio, phone, city, skills &amp; more</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
      </Link>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Appearance</h2>
        </div>
        <div className="p-6">
          <p className="text-xs text-muted-foreground mb-4">
            Choose how Korpo looks to you. The toggle in the top nav also cycles through themes.
          </p>
          <div className="flex gap-3 flex-wrap">
            {([
              { value: "light",  icon: Sun,     label: "Light"  },
              { value: "dark",   icon: Moon,    label: "Dark"   },
              { value: "system", icon: Monitor, label: "System" },
            ] as const).map(({ value, icon: Icon, label }) => {
              const active = resolvedTheme === value || (value === "system" && !["light","dark"].includes(resolvedTheme ?? ""))
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300"
                      : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && <Check className="h-3.5 w-3.5 ml-0.5" />}
                </button>
              )
            })}
          </div>

          {/* Live preview of the scenic toggle */}
          <div className="mt-5 flex items-center gap-3">
            <ThemeToggle />
            <p className="text-xs text-muted-foreground">
              {resolvedTheme === "dark" ? "Night mode active — click to switch to day" : "Day mode active — click to switch to night"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Account</h2>
        </div>
        <div className="p-6 space-y-4">

          {/* Email */}
          <div>
            <label className={LABEL}>Email address</label>
            <input
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm opacity-60 cursor-not-allowed"
              value={account.email}
              readOnly
              disabled
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Email is tied to your work account and cannot be changed here.
            </p>
          </div>

          {/* Company */}
          {account.company && (
            <div>
              <label className={LABEL}>Company</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-input bg-muted/30">
                {account.company.logo ? (
                  <Image src={account.company.logo} alt={account.company.name} width={20} height={20} className="rounded" />
                ) : (
                  <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm">{account.company.name}</span>
              </div>
            </div>
          )}

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Role: <span className="font-medium text-foreground">{account.role}</span>
            </span>
          </div>

          {/* Sign out */}
          <div className="pt-2 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
