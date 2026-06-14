import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink, CheckCircle, Shield, AlertCircle, Clock, ChevronRight } from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

const TYPE_COLOR: Record<string, string> = {
  LOAN:       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  INSURANCE:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  TRAVEL:     "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  INVESTMENT: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
}

const TYPE_EMOJI: Record<string, string> = {
  LOAN: "💰", INSURANCE: "🛡️", TRAVEL: "✈️", INVESTMENT: "📈",
}

export default async function BenefitDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.benefitProduct.findUnique({
    where: { id: params.id },
    include: { provider: { select: { name: true, logo: true, domain: true } } },
  })

  if (!product || !product.isActive) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/benefits" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Benefits
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main ────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0 text-2xl overflow-hidden">
                  {product.provider.logo ? (
                    <Image src={product.provider.logo} alt={product.provider.name} width={56} height={56} className="object-contain" />
                  ) : (
                    <span>{TYPE_EMOJI[product.type] ?? "🎁"}</span>
                  )}
                </div>
                <div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLOR[product.type] ?? "bg-muted text-muted-foreground"}`}>
                    {product.type}
                  </span>
                  <h1 className="text-xl font-bold mt-1">{product.title}</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">by {product.provider.name}</p>
                </div>
              </div>
              <SocialShare title={`${product.title} — Benefit on Korpo`} path={`/benefits/${params.id}`} variant="icon" />
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-lg mb-3">About this product</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>

          {/* Features */}
          {product.features.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-4">Key Features</h2>
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Eligibility */}
          {product.eligibility && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Eligibility
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">{product.eligibility}</p>
            </div>
          )}

          {/* Application Steps */}
          {product.applicationSteps.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-4">How to Apply</h2>
              <ol className="space-y-3">
                {product.applicationSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-24 space-y-4">

            {/* Amount range */}
            {(product.minAmount || product.maxAmount) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount range</p>
                <p className="text-xl font-bold">
                  {product.minAmount ? formatCurrency(product.minAmount) : ""}
                  {product.minAmount && product.maxAmount ? " – " : ""}
                  {product.maxAmount ? formatCurrency(product.maxAmount) : ""}
                </p>
              </div>
            )}

            {/* Product details grid */}
            <div className="space-y-3 text-sm border-t border-border pt-4">
              {product.interestRate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium">{product.interestRate}</span>
                </div>
              )}
              {product.tenure && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-medium">{product.tenure}</span>
                </div>
              )}
              {product.processingTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Processing</span>
                  <span className="font-medium">{product.processingTime}</span>
                </div>
              )}
            </div>

            <Button asChild className="w-full">
              <a href={product.contactUrl} target="_blank" rel="noopener noreferrer">
                Apply / Learn More <ExternalLink className="h-4 w-4 ml-1.5" />
              </a>
            </Button>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>This is a third-party product offered through {product.provider.name}. Korpo is not responsible for the terms or outcome of your application.</p>
            </div>
          </div>

          {/* Provider card */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-2">Provided by</p>
            <div className="flex items-center gap-3">
              {product.provider.logo ? (
                <Image src={product.provider.logo} alt={product.provider.name} width={32} height={32} className="object-contain rounded" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm">🏢</div>
              )}
              <span className="font-medium text-sm">{product.provider.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
