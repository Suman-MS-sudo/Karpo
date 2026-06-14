import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Image from "next/image"
import Link from "next/link"
import { Tag, ExternalLink, Users, AlertCircle, Zap } from "lucide-react"
import { CopyButton } from "@/components/shared/CopyButton"
import { SocialShare } from "@/components/shared/SocialShare"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { FREE_LIMITS } from "@/lib/limits"

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

export const dynamic = "force-dynamic"

export default async function DealsPage({ searchParams }: { searchParams: { category?: string } }) {
  const session    = await auth()
  const isPremium  = session?.user?.membershipPlan === "PREMIUM"
  const category   = searchParams.category ?? ""

  // Track monthly redemptions for free users.
  // Guard: DealRedemption may not exist on the runtime client until dev server restarts.
  let redemptionCount = 0
  if (session?.user?.id && !isPremium && (prisma as any).dealRedemption) {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    redemptionCount = await (prisma as any).dealRedemption.count({
      where: { userId: session.user.id, redeemedAt: { gte: monthStart } },
    })
  }

  const deals = await prisma.deal.findMany({
    where: {
      isActive: true,
      validUntil: { gte: new Date() },
      ...(category ? { category } : {}),
    },
    orderBy: [{ discount: "desc" }, { createdAt: "desc" }],
    take: 40,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Employee Deals</h1>
          <p className="text-muted-foreground text-sm mt-1">Exclusive discounts for verified corporate professionals</p>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-amber-700 dark:text-amber-300 font-medium">{redemptionCount}/{FREE_LIMITS.deals} redeemed this month</span>
            <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline">
              <Zap className="h-3 w-3" />Upgrade for unlimited
            </Link>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORY_TABS.map((tab) => (
          <Link key={tab.value} href={`/deals${tab.value ? `?category=${tab.value}` : ""}`}>
            <Button
              variant={category === tab.value ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap"
            >
              {tab.emoji} {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏷️</p>
          <h3 className="text-lg font-semibold mb-2">No deals in this category yet</h3>
          <p className="text-muted-foreground">We&apos;re onboarding brands — check back shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => {
            const isLimitReached = deal.usageLimit != null && (deal as any).usedCount >= deal.usageLimit
            const usedPct = deal.usageLimit ? Math.min(100, ((deal as any).usedCount / deal.usageLimit) * 100) : 0

            return (
              <div key={deal.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                {/* Image / discount hero */}
                <Link href={`/deals/${deal.id}`} className="block">
                  {deal.images[0] ? (
                    <div className="relative h-40">
                      <Image src={deal.images[0]} alt={deal.title} fill className="object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive" className="text-sm font-bold">{deal.discount}% OFF</Badge>
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
                    {(deal as any).merchantName && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />{(deal as any).merchantName}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{deal.description}</p>
                  </Link>

                  {/* Usage bar */}
                  {deal.usageLimit != null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(deal as any).usedCount} redeemed</span>
                        <span>{deal.usageLimit - (deal as any).usedCount} left</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isLimitReached ? "bg-red-500" : usedPct > 80 ? "bg-amber-500" : "bg-primary-600"}`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">Valid till {formatDate(deal.validUntil)}</p>

                  {/* Code */}
                  {deal.code && !isLimitReached ? (
                    <div className="mt-3 flex items-center gap-2 bg-muted rounded-lg p-2.5 border border-border">
                      <code className="flex-1 text-sm font-mono font-bold">{deal.code}</code>
                      <CopyButton text={deal.code!} />
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
          })}
        </div>
      )}
    </div>
  )
}
