import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Plus, Wrench, ExternalLink, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Services" }
export const dynamic  = "force-dynamic"

const TABS = [
  { key: "all",    label: "All"    },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
]

const PRICE_TYPE_LABEL: Record<string, string> = {
  FIXED:  "Fixed",
  HOURLY: "/hr",
  DAILY:  "/day",
  QUOTE:  "Quote",
  FREE:   "Free",
}

interface PageProps { searchParams: { tab?: string } }

export default async function MyServicesPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find((t) => t.key === searchParams.tab)?.key ?? "all"

  const isActiveFilter = tab === "all" ? undefined : tab === "active"

  const services = await prisma.servicePost.findMany({
    where:   { userId, ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}) },
    orderBy: { createdAt: "desc" },
  })

  const activeCount = services.filter(s => s.isActive).length
  const pausedCount = services.filter(s => !s.isActive).length
  const totalCount  = services.length

  function priceLabel(s: { priceType: string; price: number | null }) {
    if (s.priceType === "FREE")  return "Free"
    if (s.priceType === "QUOTE") return "Get a Quote"
    if (!s.price) return "—"
    const suffix = PRICE_TYPE_LABEL[s.priceType] ?? ""
    return s.priceType === "HOURLY" ? `${formatCurrency(s.price)}/hr`
         : s.priceType === "DAILY"  ? `${formatCurrency(s.price)}/day`
         : formatCurrency(s.price)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Skills and services you've offered</p>
        </div>
        <Button asChild>
          <Link href="/services/new"><Plus className="h-4 w-4" /> Offer a Service</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: "Total",  value: totalCount  },
          { label: "Active", value: activeCount  },
          { label: "Paused", value: pausedCount  },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const cnt = t.key === "all" ? totalCount : t.key === "active" ? activeCount : pausedCount
          return (
            <Link
              key={t.key}
              href={`/my-services?tab=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {cnt > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"
                }`}>{cnt}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {services.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Wrench className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No services posted yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/services/new"><Plus className="h-4 w-4" /> Offer your first service</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id}
              className="group bg-card border border-border rounded-2xl p-4 hover:border-border/60 hover:shadow-sm transition-all">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                  {s.portfolio?.[0] ? (
                    <Image src={s.portfolio[0]} alt={s.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <Wrench className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.category}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      s.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {s.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{priceLabel(s)}</span>
                    {s.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.city}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(s.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                      <Link href={`/services/${s.id}`}><ExternalLink className="h-3 w-3" /> View</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
