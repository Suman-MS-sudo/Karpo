"use client"
import { useState, useEffect, useCallback, useRef } from "react"

// ── Deal type ─────────────────────────────────────────────────────────────────

export interface Deal {
  id:             string
  title:          string
  description:    string
  discount:       number
  code:           string | null
  validFrom:      string | null
  validUntil:     string
  category:       string
  images:         string[]
  merchantName:   string
  merchantUrl:    string | null
  companyLogo:    string | null
  website:        string | null
  usageLimit:     number | null
  usedCount:      number
  viewCount:      number
  featured:       boolean
  trending:       boolean
  badge:          string | null   // "NEW" | "TRENDING" | "LIMITED_TIME" | "EXCLUSIVE"
  source:          string
  lastUpdated:     string
  createdAt:       string
  updatedAt:       string
  // Affiliate fields
  affiliateUrl:     string | null
  affiliateNetwork: string | null
  originalPrice:    number | null
  salePrice:        number | null
  externalId:       string | null
}

// ── Filter type ───────────────────────────────────────────────────────────────

export type DealSortBy = "discount" | "newest" | "expiring" | "popular"

export interface DealFilters {
  category:    string
  minDiscount: number
  sortBy:      DealSortBy
  search:      string
}

// ── Hook config ───────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000   // 5 min background poll
const STALE_THRESHOLD_MS  = 2 * 60 * 1000   // skip if fetched < 2 min ago

interface UseDealsFeedResult {
  deals:               Deal[]
  loading:             boolean
  newDealsCount:       number
  lastFetchedAt:       Date | null
  secondsUntilRefresh: number
  refresh:             () => void
  dismissNewDeals:     () => void
}

export function useDeals(initialDeals: Deal[], filters: DealFilters): UseDealsFeedResult {
  const [deals,              setDeals]        = useState<Deal[]>(initialDeals)
  const [loading,            setLoading]      = useState(false)
  const [newDealsCount,      setNewDeals]     = useState(0)
  const [lastFetchedAt,      setLastFetched]  = useState<Date | null>(new Date())
  const [secondsUntilRefresh,setSecondsLeft]  = useState(REFRESH_INTERVAL_MS / 1000)

  const lastFetchRef  = useRef<Date>(new Date())
  const isFirstRender = useRef(true)

  const buildUrl = useCallback((since?: string) => {
    const p = new URLSearchParams()
    if (filters.category)    p.set("category",    filters.category)
    if (filters.minDiscount) p.set("minDiscount", String(filters.minDiscount))
    if (filters.sortBy)      p.set("sortBy",      filters.sortBy)
    if (filters.search)      p.set("search",      filters.search)
    if (since)               p.set("since",       since)
    return `/api/deals?${p.toString()}`
  }, [filters.category, filters.minDiscount, filters.sortBy, filters.search])

  const fetchDeals = useCallback(async (opts: { detectNew?: boolean; showLoading?: boolean } = {}) => {
    const now = new Date()
    const msSinceLast = now.getTime() - lastFetchRef.current.getTime()
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

  // Re-fetch when filters change (skip first render — SSR already populated).
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    fetchDeals({ showLoading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.minDiscount, filters.sortBy, filters.search])

  // Background poll every 5 minutes.
  useEffect(() => {
    const interval = setInterval(() => fetchDeals({ detectNew: true }), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchDeals])

  // Countdown ticker.
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? REFRESH_INTERVAL_MS / 1000 : prev - 1))
    }, 1000)
    return () => clearInterval(ticker)
  }, [])

  const refresh = useCallback(() => {
    lastFetchRef.current = new Date(0)
    fetchDeals({ showLoading: true })
    setNewDeals(0)
  }, [fetchDeals])

  const dismissNewDeals = useCallback(() => setNewDeals(0), [])

  return { deals, loading, newDealsCount, lastFetchedAt, secondsUntilRefresh, refresh, dismissNewDeals }
}
