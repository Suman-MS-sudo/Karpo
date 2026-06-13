import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Image from "next/image"
import Link from "next/link"
import { Tag, Crown } from "lucide-react"
import { CopyButton } from "@/components/shared/CopyButton"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DealsPage() {
  const session = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const deals = await prisma.deal.findMany({
    where: { isActive: true, validUntil: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employee Deals</h1>
          <p className="text-muted-foreground text-sm mt-1">Exclusive discounts for verified corporate professionals</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="premium" className="text-xs px-2.5 py-1 flex items-center gap-1">
            <Crown className="h-3 w-3" />Premium Section
          </Badge>
          {!isPremium && (
            <Link href="/membership" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium">
              Upgrade for boosts →
            </Link>
          )}
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏷️</p>
          <h3 className="text-lg font-semibold mb-2">New deals coming soon</h3>
          <p className="text-muted-foreground">We&apos;re onboarding brands — check back shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {deal.images[0] ? (
                <div className="relative h-40">
                  <Image src={deal.images[0]} alt={deal.title} fill className="object-cover" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="text-sm font-bold">{deal.discount}% OFF</Badge>
                  </div>
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
                  <div className="text-center">
                    <Tag className="h-8 w-8 text-red-400 mx-auto mb-1" />
                    <span className="text-2xl font-bold text-red-500">{deal.discount}% OFF</span>
                  </div>
                </div>
              )}
              <div className="p-4">
                <Badge variant="outline" className="text-xs mb-2">{deal.category}</Badge>
                <h3 className="font-semibold">{deal.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{deal.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Valid till {formatDate(deal.validUntil)}</p>
                {deal.code && (
                  <div className="mt-3 flex items-center gap-2 bg-muted rounded-lg p-2.5 border border-border">
                    <code className="flex-1 text-sm font-mono font-bold">{deal.code}</code>
                    <CopyButton text={deal.code!} />
                  </div>
                )}
                {!deal.code && (
                  <p className="text-xs text-muted-foreground mt-3 italic">No code required — discount applied automatically</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
