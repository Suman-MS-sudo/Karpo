"use client"

import { Search, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface Suggestion {
  type: string
  href: string
  title: string
  subtitle: string
}

export function DashboardSearchBar({ variant = "light" }: { variant?: "light" | "glass" }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Suggestion[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const query = q.trim()
    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q])

  function goToFullSearch() {
    const query = q.trim()
    setOpen(false)
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    goToFullSearch()
  }

  const isGlass = variant === "glass"

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isGlass ? "text-white/70" : "text-muted-foreground"}`} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          type="text"
          placeholder="Search listings, rentals, referrals, skills..."
          className={
            isGlass
              ? "w-full rounded-2xl bg-white/15 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/60 outline-none transition-colors focus:bg-white/25"
              : "w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.04)] outline-none transition-shadow focus:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:border-primary-400"
          }
        />
        {loading && (
          <Loader2 className={cn("absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin", isGlass ? "text-white/70" : "text-muted-foreground")} />
        )}
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <ul className="divide-y divide-border">
                {results.map((r, i) => (
                  <li key={`${r.type}-${r.href}-${i}`}>
                    <Link
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{r.subtitle}</p>}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-1 rounded-full">
                        {r.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={goToFullSearch}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-muted/60 transition-colors border-t border-border"
              >
                See all results for &ldquo;{q.trim()}&rdquo; <ArrowRight className="h-3 w-3" />
              </button>
            </>
          ) : !loading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches yet — press Enter to search everywhere</p>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</p>
          )}
        </div>
      )}
    </div>
  )
}
