"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Tag, ExternalLink, Users, AlertCircle, Zap, RefreshCw, Bell, Clock,
  SlidersHorizontal, TrendingUp, Sparkles, Search, X, Star, Flame,
  ShoppingBag, Plane, Tv, Shirt, Heart, Landmark, BookOpen, Hotel,
  Code2, Smile, Shield, Car, Package, Globe, Copy, Check,
} from "lucide-react"
import { Badge }    from "@/components/ui/badge"
import { Button }  from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input }   from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SocialShare } from "@/components/shared/SocialShare"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import { useDeals, type Deal, type DealFilters } from "@/hooks/useDeals"
import { FREE_LIMITS } from "@/lib/limits"

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEAL_CATEGORIES = [
  { value: "",              label: "All Deals",        emoji: "🏷️",  icon: Tag       },
  { value: "FOOD_DINING",   label: "Food & Dining",    emoji: "🍕",  icon: ShoppingBag },
  { value: "TRAVEL",        label: "Travel",           emoji: "✈️",  icon: Plane      },
  { value: "SHOPPING",      label: "Shopping",         emoji: "🛍️",  icon: ShoppingBag },
  { value: "ELECTRONICS",   label: "Electronics",      emoji: "📱",  icon: Tv         },
  { value: "FASHION",       label: "Fashion",          emoji: "👗",  icon: Shirt      },
  { value: "ENTERTAINMENT", label: "Entertainment",    emoji: "🎬",  icon: Tv         },
  { value: "HEALTH_FITNESS",label: "Health & Fitness", emoji: "💪",  icon: Heart      },
  { value: "BANKING",       label: "Banking & Finance",emoji: "🏦",  icon: Landmark   },
  { value: "EDUCATION",     label: "Education",        emoji: "📚",  icon: BookOpen   },
  { value: "HOTELS",        label: "Hotels",           emoji: "🏨",  icon: Hotel      },
  { value: "SOFTWARE",      label: "Software & SaaS",  emoji: "💻",  icon: Code2      },
  { value: "LIFESTYLE",     label: "Lifestyle",        emoji: "✨",  icon: Smile      },
  { value: "INSURANCE",     label: "Insurance",        emoji: "🛡️",  icon: Shield     },
  { value: "AUTOMOTIVE",    label: "Automotive",       emoji: "🚗",  icon: Car        },
  { value: "OTHER",         label: "Others",           emoji: "📦",  icon: Package    },
]

const SORT_OPTIONS = [
  { value: "discount", label: "Highest Discount" },
  { value: "newest",   label: "Latest"           },
  { value: "expiring", label: "Expiring Soon"    },
  { value: "popular",  label: "Most Popular"     },
]

const DISCOUNT_OPTIONS = [
  { value: "0",  label: "Any discount" },
  { value: "10", label: "10% or more"  },
  { value: "20", label: "20% or more"  },
  { value: "30", label: "30% or more"  },
  { value: "50", label: "50% or more"  },
]

const BADGE_STYLES: Record<string, string> = {
  NEW:          "bg-primary-600 text-white",
  TRENDING:     "bg-orange-500 text-white",
  LIMITED_TIME: "bg-red-600 text-white",
  EXCLUSIVE:    "bg-violet-600 text-white",
}
const BADGE_LABELS: Record<string, string> = {
  NEW:          "🆕 New",
  TRENDING:     "🔥 Trending",
  LIMITED_TIME: "⏰ Limited",
  EXCLUSIVE:    "⭐ Exclusive",
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DealCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col animate-pulse">
      <div className="h-36 bg-muted" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-20 bg-muted rounded-full" />
        <div className="h-4 w-3/4 bg-muted rounded-full" />
        <div className="h-3 w-full bg-muted rounded-full" />
        <div className="h-3 w-5/6 bg-muted rounded-full" />
        <div className="h-9 w-full bg-muted rounded-xl mt-3" />
      </div>
    </div>
  )
}

// ── Copy button (inline, no extra dep) ───────────────────────────────────────

function InlineCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
      title="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ── Deal card ─────────────────────────────────────────────────────────────────

function DealCard({ deal, isNew }: { deal: Deal; isNew: boolean }) {
  const isLimitReached = deal.usageLimit != null && deal.usedCount >= deal.usageLimit
  const usedPct = deal.usageLimit ? Math.min(100, (deal.usedCount / deal.usageLimit) * 100) : 0
  const daysLeft = Math.ceil((new Date(deal.validUntil).getTime() - Date.now()) / 86400000)
  const isExpiringSoon = daysLeft <= 3
  const effectiveBadge = isNew ? "NEW" : deal.badge

  return (
    <div className={cn(
      "bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col group relative",
      isNew       ? "border-primary-400 ring-1 ring-primary-400/30" :
      deal.featured ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200/50 dark:ring-amber-700/30" :
      "border-border"
    )}>

      {/* Top badges */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-end">
        {effectiveBadge && BADGE_STYLES[effectiveBadge] && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm", BADGE_STYLES[effectiveBadge])}>
            {BADGE_LABELS[effectiveBadge]}
          </span>
        )}
        {deal.featured && !effectiveBadge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white shadow-sm">⭐ Featured</span>
        )}
      </div>

      {/* Hero — logo / gradient */}
      <Link href={`/deals/${deal.id}`} className="block shrink-0">
        <div className="relative h-32 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
          {deal.images && deal.images.length > 0 ? (
            <Image src={deal.images[0]} alt={deal.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : deal.companyLogo ? (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center p-1.5 border border-border">
                <Image src={deal.companyLogo} alt={deal.merchantName} width={48} height={48} className="object-contain" />
              </div>
              <span className="text-2xl font-extrabold text-rose-500 drop-shadow-sm">{deal.discount}% OFF</span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-4xl font-black text-rose-500 drop-shadow-sm">{deal.discount}%</span>
              <p className="text-sm font-bold text-rose-400 tracking-widest">OFF</p>
            </div>
          )}

          {/* Discount badge overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              {deal.discount}% OFF
            </span>
            {isExpiringSoon && !isLimitReached && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />{daysLeft}d left
              </span>
            )}
          </div>

          {/* Sold out overlay */}
          {isLimitReached && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-white font-bold text-sm tracking-wide">Limit Reached</span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Merchant + category row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {deal.companyLogo ? (
              <div className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center p-0.5 shrink-0">
                <Image src={deal.companyLogo} alt={deal.merchantName} width={20} height={20} className="object-contain" />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Tag className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs font-semibold text-foreground truncate">{deal.merchantName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{
              DEAL_CATEGORIES.find(c => c.value === deal.category)?.label ?? deal.category
            }</Badge>
            <div onClick={(e) => e.preventDefault()}>
              <SocialShare title={`${deal.title} — Deal on Korpo`} path={`/deals/${deal.id}`} variant="icon" />
            </div>
          </div>
        </div>

        {/* Title + description */}
        <Link href={`/deals/${deal.id}`} className="flex-1 space-y-1.5 group/title">
          <h3 className="font-semibold text-sm leading-snug group-hover/title:text-primary-600 transition-colors line-clamp-2">
            {deal.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{deal.description}</p>
        </Link>

        {/* Usage bar */}
        {deal.usageLimit != null && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{deal.usedCount} claimed</span>
              <span>{deal.usageLimit - deal.usedCount} left</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", isLimitReached ? "bg-red-500" : usedPct > 80 ? "bg-amber-500" : "bg-primary-600")}
                style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        )}

        {/* Expiry */}
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Valid till {formatDate(deal.validUntil)}
        </p>

        {/* Coupon code */}
        {deal.code && !isLimitReached ? (
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2 border border-dashed border-border">
            <code className="flex-1 text-sm font-mono font-bold tracking-widest text-foreground truncate">{deal.code}</code>
            <InlineCopy text={deal.code} />
          </div>
        ) : !deal.code && !isLimitReached ? (
          <p className="text-[10px] text-muted-foreground italic text-center">No code needed — auto-applied at checkout</p>
        ) : null}

        {isLimitReached && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Redemption limit reached
          </div>
        )}

        {/* Price row for affiliate deals */}
        {deal.salePrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">
              ₹{(deal.salePrice as number).toLocaleString("en-IN")}
            </span>
            {deal.originalPrice && deal.originalPrice !== deal.salePrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{(deal.originalPrice as number).toLocaleString("en-IN")}
              </span>
            )}
            {deal.affiliateNetwork && (
              <span className="ml-auto text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {deal.affiliateNetwork}
              </span>
            )}
          </div>
        ) : null}

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link href={`/deals/${deal.id}`}>
            <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
              <Tag className="h-3 w-3" /> Details
            </Button>
          </Link>
          {deal.affiliateUrl ? (
            <a href={deal.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
              <Button size="sm" className="w-full text-xs h-8 gap-1 bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold">
                <ShoppingBag className="h-3 w-3" /> Buy Now
              </Button>
            </a>
          ) : (deal.merchantUrl || deal.website) ? (
            <a href={(deal.merchantUrl || deal.website)!} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full text-xs h-8 gap-1 bg-rose-600 hover:bg-rose-700 text-white">
                <Globe className="h-3 w-3" /> Visit Site
              </Button>
            </a>
          ) : (
            <Link href={`/deals/${deal.id}`}>
              <Button size="sm" className="w-full text-xs h-8 gap-1 bg-rose-600 hover:bg-rose-700 text-white">
                <Zap className="h-3 w-3" /> Redeem
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Featured carousel card ────────────────────────────────────────────────────

function FeaturedCard({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deals/${deal.id}`}
      className="relative flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-700 group shadow-sm hover:shadow-md transition-shadow">
      <div className="h-36 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center relative overflow-hidden">
        {deal.companyLogo ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center p-1.5 border border-border">
              <Image src={deal.companyLogo} alt={deal.merchantName} width={48} height={48} className="object-contain" />
            </div>
          </div>
        ) : (
          <Tag className="h-10 w-10 text-amber-400" />
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">{deal.discount}% OFF</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>
        </div>
      </div>
      <div className="p-3.5 bg-card">
        <p className="text-xs text-muted-foreground font-medium">{deal.merchantName}</p>
        <p className="text-sm font-semibold mt-0.5 line-clamp-2 group-hover:text-primary-600 transition-colors">{deal.title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Valid till {formatDate(deal.validUntil)}</p>
      </div>
    </Link>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, iconClass, count }: {
  icon: any; title: string; iconClass: string; count?: number
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center", iconClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h2 className="font-bold text-base">{title}</h2>
      {count != null && (
        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

interface DealsClientProps {
  initialDeals:    Deal[]
  featuredDeals:   Deal[]
  trendingDeals:   Deal[]
  expiringSoon:    Deal[]
  redemptionCount: number
  isPremium:       boolean
}

export function DealsClient({
  initialDeals, featuredDeals, trendingDeals, expiringSoon,
  redemptionCount, isPremium,
}: DealsClientProps) {
  const [filters, setFilters] = useState<DealFilters>({
    category:    "",
    minDiscount: 0,
    sortBy:      "discount",
    search:      "",
  })
  const [searchInput, setSearchInput] = useState("")
  const [seenIds] = useState(() => new Set(initialDeals.map((d) => d.id)))

  const {
    deals, loading, newDealsCount, lastFetchedAt, secondsUntilRefresh,
    refresh, dismissNewDeals,
  } = useDeals(initialDeals, filters)

  const minutesUntilRefresh = Math.ceil(secondsUntilRefresh / 60)
  const isNewDeal = (id: string) => newDealsCount > 0 && !seenIds.has(id)
  const isFiltered = !!(filters.category || filters.minDiscount || filters.search)

  function setCategory(cat: string) {
    setFilters((f) => ({ ...f, category: cat }))
    dismissNewDeals()
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters((f) => ({ ...f, search: searchInput.trim() }))
  }

  function clearSearch() {
    setSearchInput("")
    setFilters((f) => ({ ...f, search: "" }))
  }

  function clearAllFilters() {
    setSearchInput("")
    setFilters({ category: "", minDiscount: 0, sortBy: "discount", search: "" })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Tag className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </span>
            Employee Deals
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 text-xs font-normal">
              Corporate Exclusive
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 ml-0.5">
            Exclusive discounts &amp; offers for verified corporate professionals
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {lastFetchedAt && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />Updated {formatRelativeTime(lastFetchedAt)}
              </span>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              {loading ? "Refreshing…" : `${minutesUntilRefresh}m`}
            </Button>
          </div>
        </div>
      </div>

      {/* ── New deals banner ───────────────────────────────────────────────── */}
      {newDealsCount > 0 && (
        <div className="mb-5 flex items-center justify-between bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-300">
            <Bell className="h-4 w-4" />
            {newDealsCount} new deal{newDealsCount > 1 ? "s" : ""} added since your last visit
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-primary-600" onClick={dismissNewDeals}>Dismiss</Button>
        </div>
      )}

      {/* ── Featured carousel ──────────────────────────────────────────────── */}
      {featuredDeals.length > 0 && !isFiltered && (
        <section className="mb-8">
          <SectionHeader icon={Star} title="Featured Deals" iconClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" count={featuredDeals.length} />
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x">
            {featuredDeals.map((d) => (
              <div key={d.id} className="snap-start">
                <FeaturedCard deal={d} />
              </div>
            ))}
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-amber-200 dark:from-amber-800 via-border to-transparent" />
        </section>
      )}

      {/* ── Trending section ───────────────────────────────────────────────── */}
      {trendingDeals.length > 0 && !isFiltered && (
        <section className="mb-8">
          <SectionHeader icon={Flame} title="Trending Now" iconClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" count={trendingDeals.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingDeals.map((d) => <DealCard key={d.id} deal={d} isNew={isNewDeal(d.id)} />)}
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-orange-200 dark:from-orange-800 via-border to-transparent" />
        </section>
      )}

      {/* ── Expiring Soon section ──────────────────────────────────────────── */}
      {expiringSoon.length > 0 && !isFiltered && (
        <section className="mb-8">
          <SectionHeader icon={Clock} title="Expiring Soon" iconClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" count={expiringSoon.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringSoon.map((d) => <DealCard key={d.id} deal={d} isNew={false} />)}
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200 dark:from-red-800 via-border to-transparent" />
        </section>
      )}

      {/* ── Search + category tabs ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-5 sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border/60">

        {/* Search bar */}
        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search deals, companies, or offers…"
            className="pl-10 pr-10 h-10 rounded-xl"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DEAL_CATEGORIES.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                filters.category === tab.value
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-background text-foreground border-border hover:bg-muted hover:border-foreground/20"
              )}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="font-medium">Filters</span>
          </div>
          <Select
            value={String(filters.minDiscount)}
            onValueChange={(v) => setFilters((f) => ({ ...f, minDiscount: parseInt(v) }))}
          >
            <SelectTrigger className="h-8 w-36 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v as DealFilters["sortBy"] }))}
          >
            <SelectTrigger className="h-8 w-40 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFiltered && (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearAllFilters}>
              <X className="h-3 w-3" /> Clear all
            </Button>
          )}
          {!loading && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {deals.length} deal{deals.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* ── All deals grid ─────────────────────────────────────────────────── */}
      {isFiltered && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">
            {filters.search ? `Results for "${filters.search}"` :
             filters.category ? `${DEAL_CATEGORIES.find(c => c.value === filters.category)?.label} Deals` :
             "Filtered Deals"}
          </h2>
        </div>
      )}
      {!isFiltered && (
        <SectionHeader icon={Tag} title="All Deals" iconClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" count={deals.length} />
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <DealCardSkeleton key={i} />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold mb-2">No deals match your filters</h3>
          <p className="text-muted-foreground text-sm mb-5">
            {filters.search ? `No results for "${filters.search}".` : "Try a different category or lower the minimum discount."}
          </p>
          <Button variant="outline" onClick={clearAllFilters}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {deals.map((d) => <DealCard key={d.id} deal={d} isNew={isNewDeal(d.id)} />)}
        </div>
      )}

      {/* Footer note */}
      {deals.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-10 pb-4">
          Deals refresh automatically every 5 minutes · All offers are exclusively for verified corporate employees
        </p>
      )}
    </div>
  )
}
