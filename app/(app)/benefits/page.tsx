import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { ExternalLink, Gift, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

const TYPE_TABS: { value: string; label: string; emoji: string }[] = [
  { value: "",           label: "All",         emoji: "🎁" },
  { value: "LOAN",       label: "Loans",       emoji: "💰" },
  { value: "INSURANCE",  label: "Insurance",   emoji: "🛡️" },
  { value: "TRAVEL",     label: "Travel",      emoji: "✈️" },
  { value: "INVESTMENT", label: "Investments", emoji: "📈" },
]

export const dynamic = "force-dynamic"

export default async function BenefitsPage({ searchParams }: { searchParams: { type?: string } }) {
  const session = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const products = await prisma.benefitProduct.findMany({
    where: {
      isActive: true,
      ...(searchParams.type ? { type: searchParams.type } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { provider: { select: { name: true, logo: true } } },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-pink-50 dark:bg-pink-950/30 rounded-xl flex items-center justify-center">
            <Gift className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Employee Benefits</h1>
            <p className="text-muted-foreground text-sm">Loans, insurance, travel and investment products for salaried professionals</p>
          </div>
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

      <div className="flex gap-2 overflow-x-auto pb-2 my-6 scrollbar-hide">
        {TYPE_TABS.map((tab) => (
          <Link key={tab.value} href={`/benefits${tab.value ? `?type=${tab.value}` : ""}`}>
            <Button
              variant={searchParams.type === tab.value || (!searchParams.type && !tab.value) ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap"
            >
              {tab.emoji} {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎁</p>
          <h3 className="text-lg font-semibold mb-2">More benefits coming soon</h3>
          <p className="text-muted-foreground">We&apos;re partnering with providers — check back shortly.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id} className="bg-card border border-border border-l-4 border-l-pink-400 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <Badge variant="secondary" className="text-xs mb-2">{product.type}</Badge>
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-xs text-muted-foreground">{product.provider.name}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{product.description}</p>
              {(product.minAmount || product.maxAmount) && (
                <p className="text-sm font-medium mb-3">
                  Amount: {product.minAmount ? formatCurrency(product.minAmount) : ""}
                  {product.minAmount && product.maxAmount ? " – " : ""}
                  {product.maxAmount ? formatCurrency(product.maxAmount) : ""}
                </p>
              )}
              <Button asChild size="sm" className="w-full" variant="outline">
                <a href={product.contactUrl} target="_blank" rel="noopener noreferrer">
                  Apply / Learn More <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
