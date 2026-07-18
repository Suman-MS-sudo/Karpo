import Link from "next/link"
import { Star, MapPin, CheckCircle2, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatCurrency, getInitials } from "@/lib/utils"

interface Package { price: number }

interface Listing {
  id:              string
  title:           string
  category:        string
  yearsExp:        number | null
  location:        string | null
  format:          string
  avgRating:       number | null
  reviewCount:     number
  totalOrders:     number
  completedOrders: number
  pricingModel:    string
  hourlyRate:      number | null
  packages:        unknown
  isVerified:      boolean
  user: {
    id:         string
    name:       string | null
    avatarUrl:  string | null
    image:      string | null
    jobTitle:   string | null
    isVerified: boolean
  }
}

function lowestPrice(l: Listing): number | null {
  if (l.pricingModel === "HOURLY") return l.hourlyRate
  const pkgs = l.packages as Package[] | null
  if (!pkgs?.length) return null
  return Math.min(...pkgs.map(p => p.price))
}

export function SkillListRow({ listing: l }: { listing: Listing }) {
  const avatar     = l.user.avatarUrl ?? l.user.image
  const price      = lowestPrice(l)
  const successPct = l.totalOrders > 0 ? Math.round((l.completedOrders / l.totalOrders) * 100) : null
  const isTopRated = !!(l.avgRating && l.avgRating >= 4.7 && l.reviewCount > 0)

  return (
    <Link href={`/skills/${l.id}`} className="group block">
      <div className="flex gap-4 p-4 rounded-3xl bg-card ring-1 ring-border/60 hover:ring-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
        <Avatar className="h-16 w-16 shrink-0 rounded-2xl ring-2 ring-border/50">
          <AvatarImage src={avatar ?? ""} className="rounded-2xl object-cover" />
          <AvatarFallback className="rounded-2xl text-base">{getInitials(l.user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{l.user.name}</h3>
                {isTopRated && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    Top Rated
                  </span>
                )}
                {l.user.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                    <CheckCircle2 className="h-3 w-3" />Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{l.title}</p>
              <div className="flex items-center gap-2.5 mt-2 text-[11px] text-muted-foreground flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{l.category}</span>
                {l.yearsExp != null && <span>{l.yearsExp}+ Years Exp.</span>}
                {l.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{l.location}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">
                {price != null ? formatCurrency(price) : "View pricing"}
                {l.pricingModel === "HOURLY" && price != null && <span className="text-xs font-normal text-muted-foreground">/hr</span>}
              </p>
              {successPct != null && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  <TrendingUp className="h-3 w-3" />{successPct}% Job Success
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            {l.avgRating && l.reviewCount > 0 ? (
              <span className="flex items-center gap-1 text-xs font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{l.avgRating.toFixed(1)} ({l.reviewCount})
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">New listing</span>
            )}
            <Button size="sm" className="h-8 px-4 text-xs shadow-md shadow-primary/20">View Profile</Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
