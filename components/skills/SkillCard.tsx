import Link from "next/link"
import { Star, Users, Globe, MapPin, BadgeCheck, Repeat2, Crown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PremiumBadge, PremiumStrip } from "@/components/shared/PremiumBadge"
import { SocialShare } from "@/components/shared/SocialShare"

interface Package { name: string; price: number; durationHrs: number; features: string[] }

interface Props {
  listing: {
    id:          string
    title:       string
    tagline:     string | null
    category:    string
    skills:      string[]
    format:      string
    avgRating:   number | null
    reviewCount: number
    totalOrders: number
    completedOrders: number
    pricingModel: string
    hourlyRate:  number | null
    packages:    any
    isFeatured:  boolean
    isVerified:  boolean
    user: {
      id:        string
      name:      string | null
      avatarUrl: string | null
      image:     string | null
      jobTitle:  string | null
      department: string | null
      isVerified: boolean
      company:   { name: string; logo: string | null } | null
    }
  }
}

const FORMAT_ICON: Record<string, any> = { ONLINE: Globe, IN_PERSON: MapPin, BOTH: Globe }
const FORMAT_LABEL: Record<string, string> = { ONLINE: "Online", IN_PERSON: "In-person", BOTH: "Online & In-person" }

const CATEGORY_COLORS: Record<string, string> = {
  TECH:        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DESIGN:      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  BUSINESS:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  LANGUAGE:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  LEGAL:       "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  FINANCE:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  WELLNESS:    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  COACHING:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CREATIVE:    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  ENGINEERING: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  DATA:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  MARKETING:   "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`h-3 w-3 ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  )
}

function lowestPrice(listing: Props["listing"]): number | null {
  if (listing.pricingModel === "HOURLY") return listing.hourlyRate
  const pkgs = listing.packages as Package[] | null
  if (!pkgs?.length) return null
  return Math.min(...pkgs.map((p) => p.price))
}

export function SkillCard({ listing }: Props) {
  const avatar     = listing.user.avatarUrl ?? listing.user.image
  const FormatIcon = FORMAT_ICON[listing.format] ?? Globe
  const startPrice = lowestPrice(listing)
  const catColor   = CATEGORY_COLORS[listing.category] ?? "bg-muted text-muted-foreground"

  return (
    <Link href={`/skills/${listing.id}`}
      className={`group bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col ${
        listing.isFeatured
          ? "border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-amber-900/20 shadow-sm"
          : "border-border hover:border-primary-200 dark:hover:border-primary-800"
      }`}>

      {/* Premium strip */}
      {listing.isFeatured && <PremiumStrip />}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {avatar
            ? <img src={avatar} alt="" className={`h-10 w-10 rounded-full object-cover shrink-0 ring-2 ${listing.isFeatured ? "ring-amber-300 dark:ring-amber-600" : "ring-border"}`} />
            : <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${
                listing.isFeatured
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-primary-400 to-primary-600"
              }`}>
                {listing.user.name?.[0] ?? "?"}
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold truncate">{listing.user.name}</p>
              {listing.user.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
              {listing.isFeatured && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{listing.user.jobTitle ?? listing.user.company?.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {listing.isFeatured && <PremiumBadge variant="boosted" />}
          </div>
        </div>

        {/* Category + format */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{listing.category}</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <FormatIcon className="h-3 w-3" />{FORMAT_LABEL[listing.format]}
          </span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-sm leading-snug mb-1 line-clamp-2 transition-colors ${
          listing.isFeatured
            ? "group-hover:text-amber-600 dark:group-hover:text-amber-400"
            : "group-hover:text-primary-600 dark:group-hover:text-primary-400"
        }`}>
          {listing.title}
        </h3>
        {listing.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{listing.tagline}</p>}

        {/* Skills */}
        {listing.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.skills.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{s}</span>
            ))}
            {listing.skills.length > 4 && <span className="text-[10px] text-muted-foreground">+{listing.skills.length - 4}</span>}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border flex items-end justify-between">
          {/* Stats */}
          <div className="space-y-1">
            {listing.avgRating && listing.reviewCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <Stars rating={listing.avgRating} />
                <span className="text-xs font-semibold">{listing.avgRating.toFixed(1)}</span>
                <span className="text-[11px] text-muted-foreground">({listing.reviewCount})</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No reviews yet</p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {listing.totalOrders > 0 && (
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{listing.completedOrders} done</span>
              )}
              {listing.completedOrders > 0 && listing.totalOrders > 0 && (
                <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{Math.round(listing.completedOrders / listing.totalOrders * 100)}% success</span>
              )}
            </div>
          </div>

          {/* Price + Share */}
          <div className="flex flex-col items-end gap-1">
            {startPrice != null && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">{listing.pricingModel === "HOURLY" ? "per hour" : "starting at"}</p>
                <p className={`font-bold text-base ${listing.isFeatured ? "text-amber-600 dark:text-amber-400" : "text-primary-600 dark:text-primary-400"}`}>
                  {formatCurrency(startPrice)}
                </p>
              </div>
            )}
            <SocialShare
              title={`${listing.title} — Skill on Korpo`}
              path={`/skills/${listing.id}`}
              variant="icon"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
