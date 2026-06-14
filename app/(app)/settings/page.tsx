"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import Image from "next/image"
import {
  User, Phone, MapPin, Briefcase, Tag, FileText,
  LogOut, Shield, Sun, Moon, Monitor, Check, Loader2, Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { getInitials } from "@/lib/utils"

interface ProfileData {
  name: string
  bio: string
  phone: string
  city: string
  department: string
  jobTitle: string
  avatarUrl: string
  email: string
  company?: { name: string; logo?: string }
  isVerified: boolean
  role: string
}

type SaveState = "idle" | "saving" | "saved" | "error"

const INPUT =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-colors"

const LABEL = "block text-xs font-medium text-muted-foreground mb-1.5"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()

  const [form, setForm] = useState<ProfileData>({
    name: "", bio: "", phone: "", city: "",
    department: "", jobTitle: "", avatarUrl: "", email: "",
    company: undefined, isVerified: false, role: "USER",
  })
  const [loading, setLoading] = useState(true)
  const [save, setSave] = useState<SaveState>("idle")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name:       data.name       ?? "",
          bio:        data.bio        ?? "",
          phone:      data.phone      ?? "",
          city:       data.city       ?? "",
          department: data.department ?? "",
          jobTitle:   data.jobTitle   ?? "",
          avatarUrl:  data.avatarUrl  ?? "",
          email:      data.email      ?? "",
          company:    data.company,
          isVerified: data.isVerified ?? false,
          role:       data.role       ?? "USER",
        })
        setLoading(false)
      })
  }, [])

  const set = (field: keyof ProfileData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSave = async () => {
    setSave("saving")
    setError("")
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, bio: form.bio, phone: form.phone,
        city: form.city, department: form.department,
        jobTitle: form.jobTitle, avatarUrl: form.avatarUrl,
      }),
    })
    if (res.ok) {
      setSave("saved")
      setTimeout(() => setSave("idle"), 2500)
    } else {
      setSave("error")
      setError("Failed to save. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {[...Array(3)].map((_, i) => (
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
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Profile</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                <AvatarImage src={form.avatarUrl || session?.user?.image || ""} />
                <AvatarFallback className="text-lg font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                  {getInitials(form.name || session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-card border border-border rounded-full flex items-center justify-center">
                <Camera className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className={LABEL}>Avatar URL</label>
              <input
                className={INPUT}
                placeholder="https://example.com/photo.jpg"
                value={form.avatarUrl}
                onChange={set("avatarUrl")}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={LABEL}>
              <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> Full Name</span>
            </label>
            <input className={INPUT} placeholder="Your full name" value={form.name} onChange={set("name")} />
          </div>

          {/* Bio */}
          <div>
            <label className={LABEL}>
              <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> Bio</span>
            </label>
            <textarea
              className={`${INPUT} resize-none`}
              rows={3}
              placeholder="A short bio about yourself…"
              value={form.bio}
              onChange={set("bio")}
            />
          </div>

          {/* 2-col row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone</span>
              </label>
              <input className={INPUT} placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> City</span>
              </label>
              <input className={INPUT} placeholder="Mumbai" value={form.city} onChange={set("city")} />
            </div>
          </div>

          {/* 2-col row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Department</span>
              </label>
              <input className={INPUT} placeholder="Engineering" value={form.department} onChange={set("department")} />
            </div>
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> Job Title</span>
              </label>
              <input className={INPUT} placeholder="Senior Developer" value={form.jobTitle} onChange={set("jobTitle")} />
            </div>
          </div>

          {/* Save */}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSave}
              disabled={save === "saving"}
              className="gap-2"
            >
              {save === "saving" ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : save === "saved" ? (
                <><Check className="h-3.5 w-3.5" /> Saved</>
              ) : "Save changes"}
            </Button>
            {save === "saved" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Profile updated
              </span>
            )}
          </div>
        </div>
      </section>

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
              className={`${INPUT} opacity-60 cursor-not-allowed`}
              value={form.email}
              readOnly
              disabled
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Email is tied to your work account and cannot be changed here.
            </p>
          </div>

          {/* Company */}
          {form.company && (
            <div>
              <label className={LABEL}>Company</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-input bg-muted/30">
                {form.company.logo ? (
                  <Image src={form.company.logo} alt={form.company.name} width={20} height={20} className="rounded" />
                ) : (
                  <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm">{form.company.name}</span>
              </div>
            </div>
          )}

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Role: <span className="font-medium text-foreground">{form.role}</span>
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
