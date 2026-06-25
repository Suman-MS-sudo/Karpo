"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Tag, ExternalLink, Users, AlertCircle, Zap,
  RefreshCw, Bell, Clock, SlidersHorizontal, TrendingUp, Sparkles,
} from "lucide-react"
import { Badge }      from "@/components/ui/badge"
import { Button }     from "@/components/ui/button"
import { Skeleton }   from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CopyButton } from "@/components/shared/CopyButton"
import { SocialShare } from "@/components/shared/SocialShare"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import { useDeals, type Deal, type DealFilters } from "@/hooks/useDeals"
import { FREE_LIMITS } from "@/lib/limits"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_TABS = [
  { value: "",              label: "All",          emoji: "🏷️" },
  { value: "FOOD",          label: "Food",         emoji: "🍕" },
  { value: "FASHION",       label: "Fashion",      emoji: "👗" },
  { value: "ELECTRONICS",   label: "Electronics",  emoji: "📱" },
  { value: "TRAVEL",        label: "Travel",       emoji: "✈️" },
  { value: "HEALTH",        label: "Health",       emoji: "💊" },
  { value: "ENTERTAINMENT", label: "Entertainment",emoji: "🎬" },
  { value: "OTHER",         label: "More",         emoji: "📦" },
]

const DISCOUNT_OPTIONS = [
  { value: "0",  label: "Any discount" },
  { value: "10", label: "10% or more" },
  { value: "20", label: "20% or more" },
  { value: "30", label: "30% or more" },
  { value: "50", label: "50% or more" },
]

const SORT_OPTIONS = [
  { value: "discount", label: "Highest discount" },
  { value: "newest",   label: "Newest first"     },
  { value: "expiring", label: "Expiring soon"     },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DealsClientProps {
  initialDeals: Deal[]
  redemptionCount: number
  isPremium: boolean
}

// ---------------------------------------------------------------------------
// Skeleton placeholder cards
// ---------------------------------------------------------------------------

function DealCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single deal card
// ---------------------------------------------------------------------------

function DealCard({ deal, isNew }: { deal: Deal; isNew: boolean }) {
  const isLimitReached = deal.usageLimit != null && deal.usedCount >= deal.usageLimit
  const usedPct = deal.usageLimit
    ? Math.min(100, (deal.usedCount / deal.usageLimit) * 100)
    : 0

  const daysUntilExpiry = Math.ceil(
    (new Date(deal.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const isExpiringSoon = daysUntilExpiry <= 3

  return (
    <div className={cn(
      "bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col relative",
      isNew ? "border-primary-400 ring-1 ring-primary-400/40" : "border-border"
    )}>
      {isNew && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> New
          </Badge>
        </div>
      )}

      {/* Image / discount hero */}
      <Link href={`/deals/${deal.id}`} className="block">
        {deal.images[0] ? (
          <div className="relative h-40">
            <Image src={deal.images[0]} alt={deal.title} fill className="object-cover" />
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <Badge variant="destructive" className="text-sm font-bold">{deal.discount}% OFF</Badge>
              {isExpiringSoon && !isLimitReached && (
                <Badge className="bg-amber-500 text-white text-[10px]">
                  <Clock className="h-2.5 w-2.5 mr-1" />Ends in {daysUntilExpiry}d
                </Badge>
              )}
            </div>
            {isLimitReached && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Limit Reached</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 flex items-center justify-center relative">
            <div className="text-center">
              <Tag className="h-8 w-8 text-red-400 mx-auto mb-1" />
              <span className="text-3xl font-bold text-red-500">{deal.discount}%</span>
              <p className="text-sm text-red-400 font-semibold">OFF</p>
            </div>
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isExpiringSoon && !isLimitReached && (
                <Badge className="bg-amber-500 text-white text-[10px]">
                  <Clock className="h-2.5 w-2.5 mr-1" />Ends in {daysUntilExpiry}d
                </Badge>
              )}
            </div>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Badge variant="outline" className="text-xs">{deal.category}</Badge>
          <div onClick={(e) => e.preventDefault()}>
            <SocialShare title={`${deal.title} — Deal on Korpo`} path={`/deals/${deal.id}`} variant="icon" />
          </div>
        </div>

        <Link href={`/deals/${deal.id}`} className="flex-1">
          <h3 className="font-semibold hover:text-primary-600 transition-colors">{deal.title}</h3>
          {deal.merchantName && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />{deal.merchantName}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{deal.description}</p>
        </Link>

        {/* Usage bar */}
        {deal.usageLimit != null && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{deal.usedCount} redeemed</span>
              <span>{deal.usageLimit - deal.usedCount} left</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  isLimitReached ? "bg-red-500" : usedPct > 80 ? "bg-amber-500" : "bg-primary-600"
                )}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">Valid till {formatDate(deal.validUntil)}</p>

        {deal.code && !isLimitReached ? (
          <div className="mt-3 flex items-center gap-2 bg-muted rounded-lg p-2.5 border border-border">
            <code className="flex-1 text-sm font-mono font-bold">{deal.code}</code>
            <CopyButton text={deal.code} />
          </div>
        ) : !deal.code && !isLimitReached ? (
          <p className="text-xs text-muted-foreground mt-3 italic">No code required — auto-applied</p>
        ) : null}

        {isLimitReached && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Redemption limit reached
          </div>
        )}

        <Link href={`/deals/${deal.id}`} className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full text-xs">View Deal Details</Button>
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function DealsClient({ initialDeals, redemptionCount, isPremium }: DealsClientProps) {
  const [filters, setFilters] = useState<DealFilters>({
    category:    "",
    minDiscount: 0,
    sortBy:      "discount",
  })

  // Track which deal IDs were present in the initial SSR render
  // so we can badge genuinely new arrivals during the session.
  const [seenIds] = useState(() => new Set(initialDeals.map((d) => d.id)))

  const {
    deals, loading, newDealsCount, lastFetchedAt, secondsUntilRefresh,
    refresh, dismissNewDeals,
  } = useDeals(initialDeals, filters)

  const minutesUntilRefresh = Math.ceil(secondsUntilRefresh / 60)

  // A deal is "new" if it wasn't in the SSR batch and arrived during polling.
  const isNewDeal = (dealId: string) => newDealsCount > 0 && !seenIds.has(dealId)

  function setCategory(cat: string) {
    setFilters((f) => ({ ...f, category: cat }))
    dismissNewDeals()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Employee Deals
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 text-xs font-normal">
              Corporate Exclusive
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Exclusive discounts &amp; offers for verified corporate professionals
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Monthly redemption counter (free users) */}
          {!isPremium && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                {redemptionCount}/{FREE_LIMITS.deals} redeemed this month
              </span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline">
                <Zap className="h-3 w-3" />Upgrade
              </Link>
            </div>
          )}

          {/* Last-updated + manual refresh */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastFetchedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {formatRelativeTime(lastFetchedAt)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              {loading ? "Refreshing…" : `Auto-refreshes in ${minutesUntilRefresh}m`}
            </Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* New-deals banner                                                    */}
      {/* ------------------------------------------------------------------ */}
      {newDealsCount > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-300">
            <Bell className="h-4 w-4" />
            {newDealsCount} new deal{newDealsCount > 1 ? "s" : ""} added since your last visit
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-primary-600 dark:text-primary-400"
            onClick={dismissNewDeals}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Category tabs                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategory(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              filters.category === tab.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/40 rounded-xl border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>

        {/* Min discount */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Min discount:</span>
          <Select
            value={String(filters.minDiscount)}
            onValueChange={(v) => setFilters((f) => ({ ...f, minDiscount: parseInt(v) }))}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v as DealFilters["sortBy"] }))}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active deals count */}
        {!loading && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {deals.length} active deal{deals.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Deals grid / skeleton / empty state                                */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <DealCardSkeleton key={i} />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏷️</p>
          <h3 className="text-lg font-semibold mb-2">No deals match your filters</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Try a different category or lower the minimum discount.
          </p>
          <Button
            variant="outline"
            onClick={() => setFilters({ category: "", minDiscount: 0, sortBy: "discount" })}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} isNew={isNewDeal(deal.id)} />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Footer note                                                         */}
      {/* ------------------------------------------------------------------ */}
      {deals.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-8">
          Deals refresh automatically every 5 minutes. All offers are exclusively for verified corporate employees.
        </p>
      )}
    </div>
  )
}
