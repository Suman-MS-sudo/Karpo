"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function DashboardSearchBar({ variant = "light" }: { variant?: "light" | "glass" }) {
  const router = useRouter()
  const [q, setQ] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    router.push(query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace")
  }

  const isGlass = variant === "glass"

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isGlass ? "text-white/70" : "text-muted-foreground"}`} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="text"
        placeholder="Search listings, rentals, referrals, skills..."
        className={
          isGlass
            ? "w-full rounded-2xl bg-white/15 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/60 outline-none transition-colors focus:bg-white/25"
            : "w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.04)] outline-none transition-shadow focus:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:border-primary-400"
        }
      />
    </form>
  )
}
