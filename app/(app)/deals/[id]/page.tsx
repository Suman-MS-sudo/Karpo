import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, ExternalLink, Tag, Copy, CheckCircle, Globe, AlertCircle } from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/shared/CopyButton"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id ?? ""

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      redemptions: userId ? { where: { userId } } : false,
      _count: { select: { redemptions: true } },
    },
  })

  if (!deal || !deal.isActive) notFound()

  const isExpired = deal.validUntil < new Date()
  const hasRedeemed = Array.isArray((deal as any).redemptions) && (deal as any).redemptions.length > 0
  const redemptionCount = deal._count.redemptions
  const isLimitReached = deal.usageLimit ? redemptionCount >= deal.usageLimit : false

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/deals" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Deals
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main ────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {deal.images[0] ? (
            <div className="relative h-56 rounded-2xl overflow-hidden">
              <Image src={deal.images[0]} alt={deal.title} fill className="object-cover" />
              <div className="absolute top-3 left-3">
                <span className="bg-red-500 text-white text-lg font-bold px-3 py-1 rounded-full">{deal.discount}% OFF</span>
              </div>
            </div>
          ) : (
            <div className="h-56 rounded-2xl bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950/30 dark:to-pink-950/20 flex items-center justify-center">
              <div className="text-center">
                <Tag className="h-10 w-10 text-red-400 mx-auto mb-2" />
                <span className="text-4xl font-black text-red-500">{deal.discount}% OFF</span>
              </div>
            </div>
          )}

          {/* Title & badges */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">{deal.category}</Badge>
                  <Badge variant="destructive">{deal.discount}% OFF</Badge>
                  {isExpired && <Badge variant="secondary">Expired</Badge>}
                  {isLimitReached && <Badge variant="secondary">Limit reached</Badge>}
                </div>
                <h1 className="text-2xl font-bold">{deal.title}</h1>
                {deal.merchantName && (
                  <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                    by {deal.merchantName}
                    {deal.merchantUrl && (
                      <a href={deal.merchantUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </p>
                )}
              </div>
              <SocialShare title={`${deal.discount}% off — ${deal.title} on Korpo`} path={`/deals/${params.id}`} variant="icon" />
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold mb-2">About this deal</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{deal.description}</p>
          </div>

          {/* How to redeem */}
          {deal.redemptionSteps && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> How to redeem
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">{deal.redemptionSteps}</p>
            </div>
          )}

          {/* Terms */}
          {deal.terms && (
            <div>
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" /> Terms & Conditions
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{deal.terms}</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-center mb-4">
              <p className="text-5xl font-black text-red-500">{deal.discount}%</p>
              <p className="text-muted-foreground text-sm">discount</p>
            </div>

            {deal.code ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">Use code at checkout</p>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-3 border border-border">
                  <code className="flex-1 text-center text-base font-mono font-bold tracking-widest">{deal.code}</code>
                  <CopyButton text={deal.code} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center italic">
                No code required — discount applies automatically
              </p>
            )}

            {/* Redeem action */}
            {!isExpired && !isLimitReached && deal.website && (
              <div className="mt-4 space-y-2">
                {hasRedeemed ? (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" /> Redeemed
                  </div>
                ) : (
                  <form action={`/api/deals/${params.id}`} method="POST">
                    <a href={deal.website} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full" disabled={isExpired || isLimitReached}>
                        <Globe className="h-4 w-4 mr-1.5" /> Redeem on {deal.merchantName || "Merchant Site"}
                      </Button>
                    </a>
                  </form>
                )}
              </div>
            )}

            {deal.website && (
              <a href={deal.website} target="_blank" rel="noopener noreferrer" className="mt-2 w-full">
                <Button variant="outline" className="w-full mt-2" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Visit website
                </Button>
              </a>
            )}

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className={isExpired ? "text-red-500 dark:text-red-400 font-medium" : ""}>
                  {isExpired ? "Expired" : `Valid till ${formatDate(deal.validUntil)}`}
                </span>
              </div>
              {redemptionCount > 0 && (
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 shrink-0" />
                  <span>{redemptionCount} people used this</span>
                </div>
              )}
              {deal.usageLimit && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{deal.usageLimit - redemptionCount} uses left of {deal.usageLimit}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
