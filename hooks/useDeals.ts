"use client"
import { useState, useEffect, useCallback, useRef } from "react"

export interface Deal {
  id: string
  title: string
  description: string
  discount: number
  code: string | null
  validUntil: string
  category: string
  images: string[]
  merchantName: string
  merchantUrl: string | null
  website: string | null
  usageLimit: number | null
  usedCount: number
  createdAt: string
  updatedAt: string
}

export interface DealFilters {
  category: string
  minDiscount: number
  sortBy: "discount" | "newest" | "expiring"
}

// Refresh at most once every 5 minutes; skip if last fetch was < 2 minutes ago.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const STALE_THRESHOLD_MS  = 2 * 60 * 1000

interface UseDealsFeedResult {
  deals: Deal[]
  loading: boolean
  newDealsCount: number
  lastFetchedAt: Date | null
  secondsUntilRefresh: number
  refresh: () => void
  dismissNewDeals: () => void
}

export function useDeals(initialDeals: Deal[], filters: DealFilters): UseDealsFeedResult {
  const [deals, setDeals]               = useState<Deal[]>(initialDeals)
  const [loading, setLoading]           = useState(false)
  const [newDealsCount, setNewDeals]    = useState(0)
  const [lastFetchedAt, setLastFetched] = useState<Date | null>(new Date())
  const [secondsUntilRefresh, setSecondsLeft] = useState(REFRESH_INTERVAL_MS / 1000)

  // Stable ref to track the timestamp of the last successful fetch.
  const lastFetchRef = useRef<Date>(new Date())

  const buildUrl = useCallback((since?: string) => {
    const p = new URLSearchParams()
    if (filters.category)    p.set("category",    filters.category)
    if (filters.minDiscount) p.set("minDiscount", String(filters.minDiscount))
    if (filters.sortBy)      p.set("sortBy",      filters.sortBy)
    if (since)               p.set("since",       since)
    return `/api/deals?${p.toString()}`
  }, [filters.category, filters.minDiscount, filters.sortBy])

  const fetchDeals = useCallback(async (opts: { detectNew?: boolean; showLoading?: boolean } = {}) => {
    const now = new Date()
    const msSinceLast = now.getTime() - lastFetchRef.current.getTime()

    // Enforce stale threshold — only applies to background polls, not manual refreshes.
    if (opts.detectNew && msSinceLast < STALE_THRESHOLD_MS) return

    if (opts.showLoading) setLoading(true)

    const since = opts.detectNew ? lastFetchRef.current.toISOString() : undefined

    try {
      const res  = await fetch(buildUrl(since))
      if (!res.ok) return
      const data = await res.json()

      setDeals(data.deals ?? [])
      if (opts.detectNew && data.newCount > 0) {
        setNewDeals((prev) => prev + (data.newCount ?? 0))
      }
      lastFetchRef.current = new Date(data.fetchedAt ?? now)
      setLastFetched(new Date(data.fetchedAt ?? now))
      setSecondsLeft(REFRESH_INTERVAL_MS / 1000)
    } finally {
      if (opts.showLoading) setLoading(false)
    }
  }, [buildUrl])

  // Re-fetch when filters change (full refresh, no delta detection).
  useEffect(() => {
    fetchDeals({ showLoading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.minDiscount, filters.sortBy])

  // Background poll every REFRESH_INTERVAL_MS.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeals({ detectNew: true })
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchDeals])

  // Countdown ticker: decrements every second to show "refreshes in X".
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return REFRESH_INTERVAL_MS / 1000
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(ticker)
  }, [])

  const refresh = useCallback(() => {
    lastFetchRef.current = new Date(0) // force threshold bypass
    fetchDeals({ showLoading: true })
    setNewDeals(0)
  }, [fetchDeals])

  const dismissNewDeals = useCallback(() => setNewDeals(0), [])

  return { deals, loading, newDealsCount, lastFetchedAt, secondsUntilRefresh, refresh, dismissNewDeals }
}
