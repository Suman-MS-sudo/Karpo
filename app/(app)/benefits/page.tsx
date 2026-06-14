import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Gift, CheckCircle, Shield, ChevronRight } from "lucide-react"
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

const TYPE_COLOR: Record<string, string> = {
  LOAN:       "border-l-blue-400",
  INSURANCE:  "border-l-green-400",
  TRAVEL:     "border-l-sky-400",
  INVESTMENT: "border-l-violet-400",
}

const TYPE_BADGE_COLOR: Record<string, string> = {
  LOAN:       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  INSURANCE:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  TRAVEL:     "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  INVESTMENT: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
}

export const dynamic = "force-dynamic"

export default async function BenefitsPage({ searchParams }: { searchParams: { type?: string } }) {
  const typeParam = searchParams.type ?? ""

  const products = await prisma.benefitProduct.findMany({
    where: {
      isActive: true,
      ...(typeParam ? { type: typeParam } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { provider: { select: { name: true, logo: true } } },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-pink-50 dark:bg-pink-950/30 rounded-xl flex items-center justify-center">
            <Gift className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Employee Benefits</h1>
            <p className="text-muted-foreground text-sm">Pre-negotiated financial products — browse and apply directly, no expert needed</p>
          </div>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 my-6 scrollbar-hide">
        {TYPE_TABS.map((tab) => (
          <Link key={tab.value} href={`/benefits${tab.value ? `?type=${tab.value}` : ""}`}>
            <Button
              variant={typeParam === tab.value ? "default" : "outline"}
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
          {products.map((product) => {
            const features       = (product as any).features as string[] ?? []
            const eligibility    = (product as any).eligibility as string | null
            const interestRate   = (product as any).interestRate as string | null
            const tenure         = (product as any).tenure as string | null
            const processingTime = (product as any).processingTime as string | null
            const badgeColor     = TYPE_BADGE_COLOR[product.type] ?? "bg-muted text-muted-foreground"
            const borderColor    = TYPE_COLOR[product.type] ?? "border-l-pink-400"

            return (
              <Link key={product.id} href={`/benefits/${product.id}`} className="group">
                <div className={`bg-card border border-border border-l-4 ${borderColor} rounded-xl p-5 hover:shadow-md transition-all h-full flex flex-col`}>
                  {/* Provider + type */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {product.provider.logo ? (
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-border bg-white shrink-0">
                          <Image src={product.provider.logo} alt={product.provider.name} fill className="object-contain p-0.5" sizes="32px" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Gift className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">{product.provider.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{product.type}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                  </div>

                  <h3 className="font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{product.description}</p>

                  {/* Amount range */}
                  {(product.minAmount || product.maxAmount) && (
                    <p className="text-sm font-semibold mt-3">
                      {product.minAmount ? formatCurrency(product.minAmount) : ""}
                      {product.minAmount && product.maxAmount ? " – " : ""}
                      {product.maxAmount ? formatCurrency(product.maxAmount) : ""}
                    </p>
                  )}

                  {/* Key terms grid */}
                  {(interestRate || tenure || processingTime) && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                      {interestRate   && <div><p className="font-medium text-foreground">{interestRate}</p><p>Rate</p></div>}
                      {tenure         && <div><p className="font-medium text-foreground">{tenure}</p><p>Tenure</p></div>}
                      {processingTime && <div><p className="font-medium text-foreground">{processingTime}</p><p>Processing</p></div>}
                    </div>
                  )}

                  {/* Feature previews */}
                  {features.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />{f}
                        </li>
                      ))}
                      {features.length > 3 && (
                        <li className="text-xs text-primary-600 dark:text-primary-400 ml-5">+{features.length - 3} more</li>
                      )}
                    </ul>
                  )}

                  {/* Eligibility preview */}
                  {eligibility && (
                    <div className="mt-3 flex items-start gap-1.5 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{eligibility}</span>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">View Details</Button>
                    {product.contactUrl && (
                      <Button size="sm" className="flex-1 text-xs" asChild onClick={(e) => e.stopPropagation()}>
                        <a href={product.contactUrl} target="_blank" rel="noopener noreferrer">
                          Apply <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
