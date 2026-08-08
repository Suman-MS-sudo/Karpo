"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Tag, Users, AlertCircle, Zap, RefreshCw, Bell, Clock,
  SlidersHorizontal, Sparkles, Search, X, Star, Flame,
  ShoppingBag, Plane, Tv, Shirt, Heart, Landmark, BookOpen, Hotel,
  Code2, Smile, Shield, Car, Package, Globe, Copy, Check, ChevronDown,
  ArrowUpDown, Building2,
} from "lucide-react"
import { Badge }    from "@/components/ui/badge"
import { Button }  from "@/components/ui/button"
import { SocialShare } from "@/components/shared/SocialShare"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import { useDeals, type Deal, type DealFilters } from "@/hooks/useDeals"
import { FREE_LIMITS } from "@/lib/limits"


// ── Constants ─────────────────────────────────────────────────────────────────

export const DEAL_CATEGORIES = [
  { value: "",              label: "All Deals",        emoji: "🏷️",  icon: Tag,         iconBg: "bg-slate-100 dark:bg-white/10",       iconColor: "text-slate-600 dark:text-white"        },
  { value: "FOOD_DINING",   label: "Food & Dining",    emoji: "🍕",  icon: ShoppingBag, iconBg: "bg-yellow-100 dark:bg-yellow-500/20", iconColor: "text-yellow-600 dark:text-yellow-400"  },
  { value: "TRAVEL",        label: "Travel",           emoji: "✈️",  icon: Plane,       iconBg: "bg-sky-100 dark:bg-sky-500/20",       iconColor: "text-sky-600 dark:text-sky-400"        },
  { value: "SHOPPING",      label: "Shopping",         emoji: "🛍️",  icon: ShoppingBag, iconBg: "bg-rose-100 dark:bg-rose-500/20",     iconColor: "text-rose-600 dark:text-rose-400"      },
  { value: "ELECTRONICS",   label: "Electronics",      emoji: "📱",  icon: Tv,          iconBg: "bg-cyan-100 dark:bg-cyan-500/20",     iconColor: "text-cyan-600 dark:text-cyan-400"      },
  { value: "FASHION",       label: "Fashion",          emoji: "👗",  icon: Shirt,       iconBg: "bg-pink-100 dark:bg-pink-500/20",     iconColor: "text-pink-600 dark:text-pink-400"      },
  { value: "ENTERTAINMENT", label: "Entertainment",    emoji: "🎬",  icon: Tv,          iconBg: "bg-red-100 dark:bg-red-500/20",       iconColor: "text-red-600 dark:text-red-400"        },
  { value: "HEALTH_FITNESS",label: "Health & Fitness", emoji: "💪",  icon: Heart,       iconBg: "bg-lime-100 dark:bg-lime-500/20",     iconColor: "text-lime-600 dark:text-lime-400"      },
  { value: "BANKING",       label: "Banking & Finance",emoji: "🏦",  icon: Landmark,    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",iconColor: "text-emerald-600 dark:text-emerald-400"},
  { value: "EDUCATION",     label: "Education",        emoji: "📚",  icon: BookOpen,    iconBg: "bg-indigo-100 dark:bg-indigo-500/20", iconColor: "text-indigo-600 dark:text-indigo-400"  },
  { value: "HOTELS",        label: "Hotels",           emoji: "🏨",  icon: Hotel,       iconBg: "bg-orange-100 dark:bg-orange-500/20", iconColor: "text-orange-600 dark:text-orange-400"  },
  { value: "SOFTWARE",      label: "Software & SaaS",  emoji: "💻",  icon: Code2,       iconBg: "bg-violet-100 dark:bg-violet-500/20", iconColor: "text-violet-600 dark:text-violet-400"  },
  { value: "LIFESTYLE",     label: "Lifestyle",        emoji: "✨",  icon: Smile,       iconBg: "bg-fuchsia-100 dark:bg-fuchsia-500/20",iconColor: "text-fuchsia-600 dark:text-fuchsia-400"},
  { value: "INSURANCE",     label: "Insurance",        emoji: "🛡️",  icon: Shield,      iconBg: "bg-blue-100 dark:bg-blue-500/20",     iconColor: "text-blue-600 dark:text-blue-400"      },
  { value: "AUTOMOTIVE",    label: "Automotive",       emoji: "🚗",  icon: Car,         iconBg: "bg-slate-100 dark:bg-slate-500/20",   iconColor: "text-slate-600 dark:text-slate-400"    },
  { value: "OTHER",         label: "Others",           emoji: "📦",  icon: Package,     iconBg: "bg-amber-100 dark:bg-amber-500/20",   iconColor: "text-amber-600 dark:text-amber-400"    },
]

// Per-category stock photo + gradient — used as the card banner fallback so
// every deal reflects its own category instead of one repeated orange tone.
const CATEGORY_VISUALS: Record<string, { image: string; gradient: string }> = {
  FOOD_DINING:    { image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", gradient: "from-amber-500 to-orange-500" },
  TRAVEL:         { image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80", gradient: "from-sky-500 to-blue-600" },
  SHOPPING:       { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", gradient: "from-rose-500 to-orange-500" },
  ELECTRONICS:    { image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80", gradient: "from-cyan-500 to-blue-500" },
  FASHION:        { image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80", gradient: "from-pink-500 to-rose-500" },
  ENTERTAINMENT:  { image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80", gradient: "from-red-500 to-rose-600" },
  HEALTH_FITNESS: { image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80", gradient: "from-lime-500 to-emerald-500" },
  BANKING:        { image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80", gradient: "from-emerald-500 to-teal-600" },
  EDUCATION:      { image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80", gradient: "from-indigo-500 to-blue-600" },
  HOTELS:         { image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", gradient: "from-orange-500 to-amber-600" },
  SOFTWARE:       { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80", gradient: "from-violet-500 to-purple-600" },
  LIFESTYLE:      { image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80", gradient: "from-fuchsia-500 to-pink-600" },
  INSURANCE:      { image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", gradient: "from-blue-500 to-indigo-600" },
  AUTOMOTIVE:     { image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80", gradient: "from-slate-600 to-slate-800" },
  OTHER:          { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", gradient: "from-rose-500 to-orange-500" },
}
const DEFAULT_VISUAL = { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", gradient: "from-rose-500 to-orange-500" }

function categoryVisual(category: string) {
  return CATEGORY_VISUALS[category] ?? DEFAULT_VISUAL
}

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

const RUPEE_OPTIONS = [
  { value: "0",     label: "Any ₹ off"   },
  { value: "1000",  label: "₹1,000+ off" },
  { value: "3000",  label: "₹3,000+ off" },
  { value: "5000",  label: "₹5,000+ off" },
  { value: "10000", label: "₹10,000+ off"},
]

function dealRupeeAmount(deal: Deal): number {
  const m = deal.title.match(/₹([\d,]+)/)
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0
}

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
    <div className="bg-card border-2 border-border rounded-3xl overflow-hidden flex flex-col animate-pulse">
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

function dealSavingText(deal: Deal): string {
  if (deal.discount > 0) return `${deal.discount}% OFF`
  const rupeeMatch = deal.title.match(/₹[\d,]+/)
  return rupeeMatch ? rupeeMatch[0] : "SPECIAL OFFER"
}

function DealCard({ deal, isNew }: { deal: Deal; isNew: boolean }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isLimitReached = deal.usageLimit != null && deal.usedCount >= deal.usageLimit
  const usedPct = deal.usageLimit ? Math.min(100, (deal.usedCount / deal.usageLimit) * 100) : 0
  const daysLeft = Math.ceil((new Date(deal.validUntil).getTime() - Date.now()) / 86400000)
  const isExpiringSoon = mounted && daysLeft <= 3
  const effectiveBadge = isNew ? "NEW" : deal.badge
  const savingText = dealSavingText(deal)
  const visual = categoryVisual(deal.category)
  const bannerImage = deal.images && deal.images.length > 0 ? deal.images[0] : visual.image

  return (
    <div className={cn(
      "bg-card border-2 rounded-3xl overflow-hidden flex flex-col group relative transition-all duration-200 hover:-translate-y-1",
      isNew       ? "border-rose-400 ring-1 ring-rose-400/30 hover:shadow-[0_12px_36px_rgba(244,63,94,0.18)]" :
      deal.featured ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200/50 dark:ring-amber-700/30 hover:shadow-[0_12px_36px_rgba(245,158,11,0.18)]" :
      "border-border hover:border-rose-400/60 hover:shadow-[0_12px_36px_rgba(244,63,94,0.14)]"
    )}>

      {/* Hero — category photo + matching gradient tint */}
      <Link href={`/deals/${deal.id}`} className="block shrink-0">
        <div className={cn("relative h-32 bg-gradient-to-br overflow-hidden", visual.gradient)}>
          <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
          <Image src={bannerImage} alt={deal.title} fill className="object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

          {/* Top row: status badge + logo */}
          <div className="relative flex items-start justify-between p-3">
            <div className="flex flex-col gap-1.5 items-start">
              {effectiveBadge && BADGE_STYLES[effectiveBadge] && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white shadow-sm">
                  {BADGE_LABELS[effectiveBadge]}
                </span>
              )}
              {deal.featured && !effectiveBadge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white shadow-sm">⭐ Featured</span>
              )}
              {isExpiringSoon && !isLimitReached && (
                <span className="bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />{daysLeft}d left
                </span>
              )}
            </div>
            {deal.companyLogo && (
              <div className="h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center p-1.5 shrink-0">
                <Image src={deal.companyLogo} alt={deal.merchantName} width={32} height={32} className="object-contain" />
              </div>
            )}
          </div>

          {/* Discount — single, prominent */}
          <p className={cn("font-outfit", "relative px-3.5 text-3xl font-extrabold text-white tracking-tight drop-shadow-sm")}>
            {savingText}
          </p>

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
          <h3 className={cn("font-outfit", "font-bold text-sm tracking-tight leading-snug group-hover/title:text-rose-600 dark:group-hover/title:text-rose-400 transition-colors line-clamp-2")}>
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
              <div className={cn("h-full rounded-full transition-all", isLimitReached ? "bg-red-500" : usedPct > 80 ? "bg-amber-500" : "bg-gradient-to-r from-rose-500 to-amber-400")}
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
            <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1 rounded-full">
              <Tag className="h-3 w-3" /> Details
            </Button>
          </Link>
          {deal.affiliateUrl ? (
            <a href={deal.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
              <Button size="sm" className="w-full text-xs h-8 gap-1 rounded-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold">
                <ShoppingBag className="h-3 w-3" /> Buy Now
              </Button>
            </a>
          ) : (deal.merchantUrl || deal.website) ? (
            <a href={(deal.merchantUrl || deal.website)!} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full text-xs h-8 gap-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white border-0">
                <Globe className="h-3 w-3" /> Visit Site
              </Button>
            </a>
          ) : (
            <Link href={`/deals/${deal.id}`}>
              <Button size="sm" className="w-full text-xs h-8 gap-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white border-0">
                <Zap className="h-3 w-3" /> Redeem
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Compact spotlight card — shared by Featured & Trending ───────────────────

function SpotlightCard({ deal, variant, rank }: { deal: Deal; variant: "featured" | "trending"; rank?: number }) {
  const visual     = categoryVisual(deal.category)
  const bannerImage = deal.images && deal.images.length > 0 ? deal.images[0] : visual.image
  const hoverGlow  = variant === "featured" ? "hover:shadow-[0_10px_28px_rgba(245,158,11,0.28)]" : "hover:shadow-[0_10px_28px_rgba(249,115,22,0.28)]"
  const accentText = "text-orange-600"

  return (
    <Link href={`/deals/${deal.id}`}
      className={cn("group relative block h-32 rounded-3xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200", hoverGlow)}>
      {/* Category gradient + photo background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", visual.gradient)} />
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
      <Image src={bannerImage} alt="" fill className="object-cover opacity-45 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

      <div className="relative h-full flex items-center justify-between gap-3 p-3.5 text-white">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {variant === "featured" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Star className="h-2.5 w-2.5 fill-white" /> Featured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Flame className="h-2.5 w-2.5 fill-white" /> #{rank}
              </span>
            )}
          </div>
          <p className={cn("font-outfit", "text-lg font-extrabold tracking-tight mt-1 drop-shadow-sm")}>
            {dealSavingText(deal)}
          </p>
          <p className="text-xs font-semibold text-white/85 truncate">{deal.merchantName}</p>
          <p className="text-[11px] text-white/70 truncate mt-0.5">{deal.title}</p>
        </div>

        {deal.companyLogo ? (
          <div className="h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center p-1 shrink-0">
            <Image src={deal.companyLogo} alt={deal.merchantName} width={32} height={32} className="object-contain" />
          </div>
        ) : (
          <span className={cn("h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center shrink-0 font-black text-sm", accentText)}>
            {deal.merchantName.slice(0, 1)}
          </span>
        )}
      </div>
    </Link>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, gradient, count }: {
  icon: any; title: string; gradient: string; count?: number
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br", gradient)}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </span>
      <h2 className={cn("font-outfit", "text-sm font-extrabold uppercase tracking-widest bg-gradient-to-r bg-clip-text text-transparent", gradient)}>{title}</h2>
      {count != null && (
        <span className="text-xs text-muted-foreground font-medium">({count})</span>
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
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [brandFilter, setBrandFilter] = useState("")
  const [brandOpen, setBrandOpen] = useState(false)
  const [brandQuery, setBrandQuery] = useState("")
  const brandRef = useRef<HTMLDivElement>(null)
  const [minRupee, setMinRupee] = useState(0)
  const [discountOpen, setDiscountOpen] = useState(false)
  const discountRef = useRef<HTMLDivElement>(null)
  const [rupeeOpen, setRupeeOpen] = useState(false)
  const rupeeRef = useRef<HTMLDivElement>(null)
  const [seenIds] = useState(() => new Set(initialDeals.map((d) => d.id)))

  const brands = Array.from(new Set(initialDeals.map((d) => d.merchantName).filter(Boolean))).sort()
  const filteredBrands = brandQuery
    ? brands.filter((b) => b.toLowerCase().includes(brandQuery.toLowerCase()))
    : brands

  useEffect(() => {
    if (!brandOpen) setBrandQuery("")
  }, [brandOpen])

  useEffect(() => {
    if (!sortOpen && !brandOpen && !discountOpen && !rupeeOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (sortOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (brandOpen && brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false)
      if (discountOpen && discountRef.current && !discountRef.current.contains(e.target as Node)) setDiscountOpen(false)
      if (rupeeOpen && rupeeRef.current && !rupeeRef.current.contains(e.target as Node)) setRupeeOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [sortOpen, brandOpen, discountOpen, rupeeOpen])

  const {
    deals: fetchedDeals, loading, newDealsCount, lastFetchedAt, secondsUntilRefresh,
    refresh, dismissNewDeals,
  } = useDeals(initialDeals, filters)

  const deals = fetchedDeals
    .filter((d) => !brandFilter || d.merchantName === brandFilter)
    .filter((d) => !minRupee || dealRupeeAmount(d) >= minRupee)

  const minutesUntilRefresh = Math.ceil(secondsUntilRefresh / 60)
  const isNewDeal = (id: string) => newDealsCount > 0 && !seenIds.has(id)
  const isFiltered = !!(filters.category || filters.minDiscount || filters.search || brandFilter || minRupee)

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
    setBrandFilter("")
    setMinRupee(0)
    setFilters({ category: "", minDiscount: 0, sortBy: "discount", search: "" })
  }

  const totalClaims = fetchedDeals.reduce((sum, d) => sum + (d.usedCount ?? 0), 0)

  return (
    <div className="min-h-full bg-background">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="relative text-white overflow-hidden" style={{ minHeight: 300 }}>
        <img
          src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1920&q=85&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/50 via-transparent to-amber-950/40" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-white border border-white/30 rounded-full px-3 py-1 backdrop-blur-sm bg-gradient-to-r from-rose-500/30 via-red-500/30 to-amber-400/30 shadow-[0_0_20px_rgba(244,63,94,0.35)]">
                  <Sparkles className="h-3 w-3 text-rose-300" /> Corporate Exclusive
                </span>
              </div>
              <h1 className={cn("font-outfit", "text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-lg")}>
                <span className="bg-gradient-to-r from-white via-rose-200 to-amber-200 bg-clip-text text-transparent">Employee</span>
                {" "}<span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">Deals</span> 🏷️
              </h1>
              <p className="text-white/60 mt-2 text-sm">Exclusive discounts &amp; offers for verified corporate professionals.</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!isPremium && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs backdrop-blur-sm">
                  <span className="text-amber-300 font-medium">{redemptionCount}/{FREE_LIMITS.deals} redeemed</span>
                  <Link href="/membership" className="flex items-center gap-1 text-amber-400 font-bold hover:underline">
                    <Zap className="h-3 w-3" />Upgrade
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-8">
            <div>
              <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-rose-300 to-red-200 bg-clip-text text-transparent")}>{fetchedDeals.length}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Active Deals</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-amber-300 to-orange-200 bg-clip-text text-transparent")}>{totalClaims.toLocaleString()}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Total Claims</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className={cn("font-outfit", "text-3xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent")}>100%</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Verified</p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={submitSearch} className="relative pb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search deals, companies, or offers…"
              className="w-full h-12 pl-11 pr-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:bg-white/15 transition-all"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ── Category strip + filter bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-background shadow-sm">
        {/* Category icon strip */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
            <div className="flex">
              {DEAL_CATEGORIES.map(cat => {
                const isActive = filters.category === cat.value
                const count = initialDeals.filter(d => cat.value === "" || d.category === cat.value).length
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 relative transition-all duration-150 group shrink-0",
                      "flex-1 min-w-[84px]",
                      isActive ? "opacity-100" : "opacity-40 hover:opacity-75"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-150",
                      isActive ? cn(cat.iconBg, "ring-2 ring-rose-400 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.4)]") : cn(cat.iconBg, "group-hover:scale-105")
                    )}>
                      <cat.icon className={cn("h-4.5 w-4.5", cat.iconColor)} style={{ width: 18, height: 18 }} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={cn("font-outfit", "text-[11px] font-bold tracking-tight whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {cat.label.split(" ")[0]}
                    </span>
                    <span className={cn("text-[10px] tabular-nums leading-none", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                      {count}
                    </span>
                    <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-150", isActive ? "w-8" : "w-0")} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-bold">Filters</span>
              </div>

              {/* Discount % dropdown */}
              <div className="relative" ref={discountRef}>
                <button
                  onClick={() => setDiscountOpen(o => !o)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap",
                    filters.minDiscount > 0 || discountOpen
                      ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white border-transparent shadow-sm"
                      : "text-foreground border-border hover:border-rose-400/60 hover:text-rose-600 dark:hover:text-rose-400"
                  )}
                >
                  {DISCOUNT_OPTIONS.find(o => parseInt(o.value) === filters.minDiscount)?.label ?? "Any discount"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", discountOpen && "rotate-180")} />
                </button>
                {discountOpen && (
                  <div className="absolute left-0 top-full mt-2 z-20 bg-card border-2 border-border rounded-2xl shadow-[0_12px_36px_rgba(244,63,94,0.12)] overflow-hidden min-w-[200px] py-1.5">
                    {DISCOUNT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setFilters(f => ({ ...f, minDiscount: parseInt(o.value) })); setDiscountOpen(false) }}
                        className={cn("w-full flex items-center justify-between gap-2 text-left mx-1.5 my-0.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                          filters.minDiscount === parseInt(o.value) ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white" : "text-foreground hover:bg-muted"
                        )}
                      >
                        {o.label}
                        {filters.minDiscount === parseInt(o.value) && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rupee-off dropdown */}
              <div className="relative" ref={rupeeRef}>
                <button
                  onClick={() => setRupeeOpen(o => !o)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap",
                    minRupee > 0 || rupeeOpen
                      ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white border-transparent shadow-sm"
                      : "text-foreground border-border hover:border-rose-400/60 hover:text-rose-600 dark:hover:text-rose-400"
                  )}
                >
                  {RUPEE_OPTIONS.find(o => parseInt(o.value) === minRupee)?.label ?? "Any ₹ off"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", rupeeOpen && "rotate-180")} />
                </button>
                {rupeeOpen && (
                  <div className="absolute left-0 top-full mt-2 z-20 bg-card border-2 border-border rounded-2xl shadow-[0_12px_36px_rgba(244,63,94,0.12)] overflow-hidden min-w-[200px] py-1.5">
                    {RUPEE_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setMinRupee(parseInt(o.value)); setRupeeOpen(false) }}
                        className={cn("w-full flex items-center justify-between gap-2 text-left mx-1.5 my-0.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                          minRupee === parseInt(o.value) ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white" : "text-foreground hover:bg-muted"
                        )}
                      >
                        {o.label}
                        {minRupee === parseInt(o.value) && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand dropdown */}
              <div className="relative" ref={brandRef}>
                <button
                  onClick={() => setBrandOpen(o => !o)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap",
                    brandFilter || brandOpen
                      ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white border-transparent shadow-sm"
                      : "text-foreground border-border hover:border-rose-400/60 hover:text-rose-600 dark:hover:text-rose-400"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  {brandFilter || "All Brands"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", brandOpen && "rotate-180")} />
                </button>
                {brandOpen && (
                  <div className="absolute left-0 top-full mt-2 z-20 bg-card border-2 border-border rounded-2xl shadow-[0_12px_36px_rgba(244,63,94,0.12)] overflow-hidden min-w-[240px] py-1.5">
                    <div className="px-2 pb-1.5">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          autoFocus
                          value={brandQuery}
                          onChange={(e) => setBrandQuery(e.target.value)}
                          placeholder="Search brands…"
                          className="w-full h-8 pl-8 pr-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/50"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {!brandQuery && (
                        <button
                          onClick={() => { setBrandFilter(""); setBrandOpen(false) }}
                          className={cn("w-full flex items-center justify-between gap-2 text-left mx-1.5 my-0.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                            !brandFilter ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white" : "text-foreground hover:bg-muted"
                          )}
                        >
                          All Brands
                          {!brandFilter && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      )}
                      {filteredBrands.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-4">No brands match "{brandQuery}"</p>
                      ) : filteredBrands.map(b => (
                        <button
                          key={b}
                          onClick={() => { setBrandFilter(b); setBrandOpen(false) }}
                          className={cn("w-full flex items-center justify-between gap-2 text-left mx-1.5 my-0.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors truncate",
                            brandFilter === b ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white" : "text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="truncate">{b}</span>
                          {brandFilter === b && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isFiltered && (
                <Button variant="ghost" size="sm" className="h-8 text-sm font-bold gap-1 text-muted-foreground rounded-full" onClick={clearAllFilters}>
                  <X className="h-3.5 w-3.5" /> Clear all
                </Button>
              )}

              <div className="flex-1" />

              {!loading && (
                <span className="text-sm font-bold text-foreground whitespace-nowrap hidden sm:block">
                  {deals.length} deal{deals.length !== 1 ? "s" : ""}
                </span>
              )}

              {/* Sort dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen(o => !o)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold px-3.5 py-1.5 rounded-full border transition-all",
                    sortOpen
                      ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white border-transparent shadow-sm"
                      : "text-foreground border-border hover:border-rose-400/60 hover:text-rose-600 dark:hover:text-rose-400"
                  )}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", sortOpen && "rotate-180")} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 z-20 bg-card border-2 border-border rounded-2xl shadow-[0_12px_36px_rgba(244,63,94,0.12)] overflow-hidden min-w-[200px] py-1.5">
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setFilters(f => ({ ...f, sortBy: opt.value as DealFilters["sortBy"] })); setSortOpen(false) }}
                        className={cn("w-full flex items-center justify-between gap-2 text-left mx-1.5 my-0.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                          filters.sortBy === opt.value
                            ? "bg-gradient-to-r from-rose-500 to-amber-400 text-white"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {opt.label}
                        {filters.sortBy === opt.value && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {isFiltered && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">Active:</span>
                {filters.search && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full">
                    "{filters.search}" <button onClick={clearSearch}><X className="h-3.5 w-3.5 ml-0.5" /></button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold bg-muted text-foreground px-2.5 py-1 rounded-full">
                    {DEAL_CATEGORIES.find(c => c.value === filters.category)?.label}
                    <button onClick={() => setCategory("")}><X className="h-3.5 w-3.5 ml-0.5" /></button>
                  </span>
                )}
                {filters.minDiscount > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold bg-muted text-foreground px-2.5 py-1 rounded-full">
                    {filters.minDiscount}%+ off
                    <button onClick={() => setFilters(f => ({ ...f, minDiscount: 0 }))}><X className="h-3.5 w-3.5 ml-0.5" /></button>
                  </span>
                )}
                {minRupee > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold bg-muted text-foreground px-2.5 py-1 rounded-full">
                    ₹{minRupee.toLocaleString("en-IN")}+ off
                    <button onClick={() => setMinRupee(0)}><X className="h-3.5 w-3.5 ml-0.5" /></button>
                  </span>
                )}
                {brandFilter && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold bg-muted text-foreground px-2.5 py-1 rounded-full">
                    <Building2 className="h-3.5 w-3.5" /> {brandFilter}
                    <button onClick={() => setBrandFilter("")}><X className="h-3.5 w-3.5 ml-0.5" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New deals banner ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {newDealsCount > 0 && (
          <div className="mb-5 flex items-center justify-between bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-300">
              <Bell className="h-4 w-4" />
              {newDealsCount} new deal{newDealsCount > 1 ? "s" : ""} added since your last visit
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-rose-600 dark:text-rose-400" onClick={dismissNewDeals}>Dismiss</Button>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-10">

        {/* Featured carousel */}
        {featuredDeals.length > 0 && !isFiltered && (
          <section>
            <SectionHeader icon={Star} title="Featured Deals" gradient="from-amber-400 to-orange-500" count={featuredDeals.length} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredDeals.map((d) => <SpotlightCard key={d.id} deal={d} variant="featured" />)}
            </div>
          </section>
        )}

        {/* Trending */}
        {trendingDeals.length > 0 && !isFiltered && (
          <section>
            <SectionHeader icon={Flame} title="Trending Now" gradient="from-orange-500 to-red-500" count={trendingDeals.length} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {trendingDeals.map((d, i) => <SpotlightCard key={d.id} deal={d} variant="trending" rank={i + 1} />)}
            </div>
          </section>
        )}

        {/* Expiring soon */}
        {expiringSoon.length > 0 && !isFiltered && (
          <section>
            <SectionHeader icon={Clock} title="Expiring Soon" gradient="from-red-500 to-rose-600" count={expiringSoon.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {expiringSoon.map((d) => <DealCard key={d.id} deal={d} isNew={false} />)}
            </div>
          </section>
        )}

        {/* All deals */}
        <section>
          {isFiltered ? (
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <h2 className={cn("font-outfit", "font-bold text-sm")}>
                {filters.search ? `Results for "${filters.search}"` :
                 brandFilter ? `${brandFilter} Deals` :
                 filters.category ? `${DEAL_CATEGORIES.find(c => c.value === filters.category)?.label} Deals` :
                 "Filtered Deals"}
              </h2>
            </div>
          ) : (
            <SectionHeader icon={Tag} title="All Deals" gradient="from-rose-500 to-amber-400" count={deals.length} />
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <DealCardSkeleton key={i} />)}
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center mb-5 text-4xl shadow-inner">🏷️</div>
              <h3 className="text-xl font-black mb-2">No deals match your filters</h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-sm">
                {filters.search ? `No results for "${filters.search}".` :
                 brandFilter ? `No deals from ${brandFilter} right now.` :
                 "Try a different category, brand, or lower the minimum discount/₹ amount."}
              </p>
              <Button variant="outline" className="rounded-full" onClick={clearAllFilters}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {deals.map((d) => <DealCard key={d.id} deal={d} isNew={isNewDeal(d.id)} />)}
            </div>
          )}
        </section>

        {/* Footer note */}
        {deals.length > 0 && (
          <div className="flex flex-col items-center gap-2 pb-4">
            <p className="text-center text-xs text-muted-foreground">
              Deals refresh automatically every 5 minutes · All offers are exclusively for verified corporate employees
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {lastFetchedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />Updated {formatRelativeTime(lastFetchedAt)}
                </span>
              )}
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-1 h-7 px-2 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                {loading ? "Refreshing…" : `${minutesUntilRefresh}m`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
