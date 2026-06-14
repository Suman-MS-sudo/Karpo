import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Users,
  Plus, Eye, MapPin, Clock, CheckCircle2, XCircle,
  ExternalLink, Pencil, Package, Calendar, DollarSign,
  TrendingUp, LayoutGrid, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Postings" }
export const dynamic  = "force-dynamic"

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",   label: "Overview",     icon: LayoutGrid,   color: "text-slate-600 dark:text-slate-300",    bg: "bg-slate-100 dark:bg-slate-700/40"    },
  { key: "marketplace",label: "Buy & Sell",   icon: ShoppingBag,  color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-100 dark:bg-blue-500/15"      },
  { key: "rentals",    label: "Rentals",      icon: Home,         color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-500/15"},
  { key: "referrals",  label: "Referrals",    icon: Briefcase,    color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-100 dark:bg-violet-500/15"  },
  { key: "carpool",    label: "Carpool",      icon: Car,          color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-100 dark:bg-orange-500/15"  },
  { key: "services",   label: "Services",     icon: Wrench,       color: "text-cyan-600 dark:text-cyan-400",      bg: "bg-cyan-100 dark:bg-cyan-500/15"      },
  { key: "events",     label: "Events",       icon: Users,        color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-100 dark:bg-amber-500/15"    },
] as const

type TabKey = typeof TABS[number]["key"]

const NEW_ROUTES: Record<string, string> = {
  marketplace: "/marketplace/new",
  rentals:     "/rentals/new",
  referrals:   "/referrals/new",
  carpool:     "/carpool/new",
  services:    "/services/new",
  events:      "/events/new",
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-green-500",
  OPEN:   "bg-green-500",
  FILLED: "bg-blue-500",
  SOLD:   "bg-blue-500",
  CLOSED: "bg-slate-400",
  EXPIRED:"bg-slate-400",
}

function StatusBadge({ status, active }: { status?: string; active?: boolean }) {
  const key    = status ?? (active ? "ACTIVE" : "CLOSED")
  const dotCls = STATUS_DOT[key] ?? "bg-slate-400"
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
      {key}
    </span>
  )
}

// ─── Card shells ──────────────────────────────────────────────────────────────

function PostCard({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <div className="group bg-card border border-border rounded-2xl p-4 flex gap-4 hover:border-border/60 hover:shadow-sm transition-all">
      {children}
      <div className="flex items-center shrink-0">
        <Link href={href} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}

function Thumb({ src, fallback: Fallback }: { src?: string | null; fallback: any }) {
  return (
    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
      {src ? (
        <Image src={src} alt="" fill className="object-cover" sizes="80px" />
      ) : (
        <Fallback className="h-6 w-6 text-muted-foreground/30" />
      )}
    </div>
  )
}

function MetaRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">{children}</div>
}

function Actions({ href, editHref, extraAction }: { href: string; editHref?: string; extraAction?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
        <Link href={href}><ExternalLink className="h-3 w-3" /> View</Link>
      </Button>
      {editHref && (
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
          <Link href={editHref}><Pencil className="h-3 w-3" /> Edit</Link>
        </Button>
      )}
      {extraAction}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, label, color, bg, count, newRoute,
}: {
  icon: any; label: string; color: string; bg: string; count: number; newRoute?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{label}</h2>
          <p className="text-[11px] text-muted-foreground">{count} posting{count !== 1 ? "s" : ""}</p>
        </div>
      </div>
      {newRoute && (
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" asChild>
          <Link href={newRoute}><Plus className="h-3 w-3" /> New</Link>
        </Button>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, label, newRoute }: { icon: any; label: string; newRoute?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-2xl text-center">
      <Icon className="h-8 w-8 text-muted-foreground/25 mb-2" />
      <p className="text-sm text-muted-foreground">No {label} yet</p>
      {newRoute && (
        <Button size="sm" asChild className="mt-3">
          <Link href={newRoute}><Plus className="h-3.5 w-3.5" /> Post now</Link>
        </Button>
      )}
    </div>
  )
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchAll(userId: string) {
  const [listings, rentals, referrals, carpools, services, events] = await Promise.all([
    prisma.listing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { offers: { where: { status: "ACCEPTED" }, select: { amount: true }, take: 1 } },
    }),
    prisma.rentalPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobReferral.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { name: true } } },
    }),
    prisma.carpoolRoute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.servicePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { organizerId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ])
  return { listings, rentals, referrals, carpools, services, events }
}

// ─── Section renderers ────────────────────────────────────────────────────────

function MarketplaceSection({ listings, limit }: { listings: any[]; limit?: number }) {
  const items = limit ? listings.slice(0, limit) : listings
  if (!items.length) return <EmptyState icon={ShoppingBag} label="marketplace listings" newRoute="/marketplace/new" />
  return (
    <div className="space-y-3">
      {items.map((l) => (
        <PostCard key={l.id} href={`/marketplace/${l.id}`}>
          <Thumb src={l.images?.[0]} fallback={Package} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="font-semibold text-sm leading-tight truncate">{l.title}</p>
              <StatusBadge status={l.status} />
            </div>
            <MetaRow>
              <span className="font-bold text-foreground">{formatCurrency(l.price)}</span>
              {l.offers?.[0] && <span className="text-blue-600 dark:text-blue-400">sold for {formatCurrency(l.offers[0].amount)}</span>}
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{l.viewCount}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.city}</span>
              <span>{formatRelativeTime(l.createdAt)}</span>
            </MetaRow>
            <Actions href={`/marketplace/${l.id}`} editHref={l.status === "ACTIVE" ? `/marketplace/${l.id}/edit` : undefined} />
          </div>
        </PostCard>
      ))}
    </div>
  )
}

function RentalsSection({ rentals, limit }: { rentals: any[]; limit?: number }) {
  const items = limit ? rentals.slice(0, limit) : rentals
  if (!items.length) return <EmptyState icon={Home} label="rental listings" newRoute="/rentals/new" />
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <PostCard key={r.id} href={`/rentals/${r.id}`}>
          <Thumb src={r.images?.[0]} fallback={Home} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="font-semibold text-sm leading-tight truncate">{r.title}</p>
              <StatusBadge status={r.status} />
            </div>
            <MetaRow>
              <span className="font-bold text-foreground">{formatCurrency(r.rent)}<span className="font-normal text-muted-foreground">/mo</span></span>
              <span>{r.type} · {r.bhk ?? ""}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.area}, {r.city}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{r.viewCount}</span>
              <span>{formatRelativeTime(r.createdAt)}</span>
            </MetaRow>
            <Actions href={`/rentals/${r.id}`} editHref={r.status === "ACTIVE" ? `/rentals/${r.id}/edit` : undefined} />
          </div>
        </PostCard>
      ))}
    </div>
  )
}

function ReferralsSection({ referrals, limit }: { referrals: any[]; limit?: number }) {
  const items = limit ? referrals.slice(0, limit) : referrals
  if (!items.length) return <EmptyState icon={Briefcase} label="job referrals" newRoute="/referrals/new" />
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <PostCard key={r.id} href={`/referrals/${r.id}`}>
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="font-semibold text-sm leading-tight truncate">{r.title}</p>
              <StatusBadge status={r.status} />
            </div>
            <MetaRow>
              <span>{r.company?.name}</span>
              <span>{r.department}</span>
              <span>{r.experienceMin}–{r.experienceMax} yrs</span>
              {r.referralBonus && <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><DollarSign className="h-3 w-3" />Bonus: {formatCurrency(r.referralBonus)}</span>}
              <span>{formatRelativeTime(r.createdAt)}</span>
            </MetaRow>
            <Actions href={`/referrals/${r.id}`} />
          </div>
        </PostCard>
      ))}
    </div>
  )
}

function CarpoolSection({ carpools, limit }: { carpools: any[]; limit?: number }) {
  const items = limit ? carpools.slice(0, limit) : carpools
  if (!items.length) return <EmptyState icon={Car} label="carpool routes" newRoute="/carpool/new" />
  return (
    <div className="space-y-3">
      {items.map((c) => (
        <PostCard key={c.id} href={`/carpool/${c.id}`}>
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 flex items-center justify-center shrink-0">
            <Car className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="font-semibold text-sm leading-tight truncate">{c.fromLocation} → {c.toLocation}</p>
              <StatusBadge active={c.isActive} />
            </div>
            <MetaRow>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.departureTime}</span>
              <span>{c.seatsAvailable} seat{c.seatsAvailable !== 1 ? "s" : ""}</span>
              <span>{formatCurrency(c.pricePerSeat)}/seat</span>
              <span>{c.vehicleType}</span>
              <span>{c.frequency}</span>
              <span>{formatRelativeTime(c.createdAt)}</span>
            </MetaRow>
            <Actions href={`/carpool/${c.id}`} editHref={`/carpool/${c.id}/edit`} />
          </div>
        </PostCard>
      ))}
    </div>
  )
}

function ServicesSection({ services, limit }: { services: any[]; limit?: number }) {
  const items = limit ? services.slice(0, limit) : services
  if (!items.length) return <EmptyState icon={Wrench} label="service posts" newRoute="/services/new" />
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <PostCard key={s.id} href={`/services/${s.id}`}>
          <Thumb src={s.portfolio?.[0]} fallback={Wrench} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="font-semibold text-sm leading-tight truncate">{s.title}</p>
              <StatusBadge active={s.isActive} />
            </div>
            <MetaRow>
              <span>{s.category}</span>
              {s.price && <span className="font-medium text-foreground">{s.priceType === "HOURLY" ? `${formatCurrency(s.price)}/hr` : formatCurrency(s.price)}</span>}
              {s.priceType === "FREE" && <span className="text-green-600 dark:text-green-400">Free</span>}
              {s.priceType === "QUOTE" && <span>Quote-based</span>}
              {s.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.city}</span>}
              <span>{formatRelativeTime(s.createdAt)}</span>
            </MetaRow>
            <Actions href={`/services/${s.id}`} editHref={`/services/${s.id}/edit`} />
          </div>
        </PostCard>
      ))}
    </div>
  )
}

function EventsSection({ events, limit }: { events: any[]; limit?: number }) {
  const items = limit ? events.slice(0, limit) : events
  if (!items.length) return <EmptyState icon={Users} label="events" newRoute="/events/new" />
  return (
    <div className="space-y-3">
      {items.map((e) => (
        <PostCard key={e.id} href={`/events/${e.id}`}>
          <Thumb src={e.images?.[0]} fallback={Users} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="font-semibold text-sm leading-tight truncate">{e.title}</p>
              <StatusBadge active={e.isActive} />
            </div>
            <MetaRow>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
              {e.fee > 0 ? <span>{formatCurrency(e.fee)}</span> : <span className="text-green-600 dark:text-green-400">Free</span>}
              {e.maxParticipants && <span>{e.maxParticipants} max</span>}
              <span>{formatRelativeTime(e.createdAt)}</span>
            </MetaRow>
            <Actions href={`/events/${e.id}`} editHref={`/events/${e.id}/edit`} />
          </div>
        </PostCard>
      ))}
    </div>
  )
}

// ─── Overview section ──────────────────────────────────────────────────────────

function OverviewSection({
  counts, listings, rentals, referrals, carpools, services, events,
}: {
  counts: Record<string, number>
  listings: any[]; rentals: any[]; referrals: any[]; carpools: any[]; services: any[]; events: any[]
}) {
  const serviceCards = [
    { key: "marketplace", tab: TABS[1], count: counts.marketplace, items: listings,  href: "/my-listings"   },
    { key: "rentals",     tab: TABS[2], count: counts.rentals,     items: rentals,   href: "/my-rentals"    },
    { key: "referrals",   tab: TABS[3], count: counts.referrals,   items: referrals, href: "/my-referrals"  },
    { key: "carpool",     tab: TABS[4], count: counts.carpool,     items: carpools,  href: "/my-carpool"    },
    { key: "services",    tab: TABS[5], count: counts.services,    items: services,  href: "/my-services"   },
    { key: "events",      tab: TABS[6], count: counts.events,      items: events,    href: "/my-events"     },
  ]

  const total = Object.values(counts).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-6">
      {/* Top stat */}
      {total === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/25 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">You haven't posted anything yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Pick a service above to get started.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> posting{total !== 1 ? "s" : ""} across {Object.values(counts).filter(c => c > 0).length} services
          </p>

          {/* Service summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {serviceCards.map(({ key, tab, count, href }) => {
              const Icon = tab.icon
              return (
                <Link
                  key={key}
                  href={href}
                  className="group bg-card border border-border rounded-2xl p-4 hover:border-border/60 hover:shadow-sm transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${tab.bg}`}>
                      <Icon className={`h-4 w-4 ${tab.color}`} />
                    </div>
                    {count > 0 && (
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                        {count}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tab.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count === 0 ? "No posts yet" : `${count} posting${count !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    View all <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Recent activity — latest 3 across all services merged, sorted by date */}
          {(() => {
            const all = [
              ...listings.map(l  => ({ ...l, _type: "marketplace", _href: `/marketplace/${l.id}` })),
              ...rentals.map(r   => ({ ...r, _type: "rentals",     _href: `/rentals/${r.id}` })),
              ...referrals.map(r => ({ ...r, _type: "referrals",   _href: `/referrals/${r.id}` })),
              ...carpools.map(c  => ({ ...c, _type: "carpool",     _href: `/carpool/${c.id}` })),
              ...services.map(s  => ({ ...s, _type: "services",    _href: `/services/${s.id}` })),
              ...events.map(e    => ({ ...e, _type: "events",      _href: `/events/${e.id}` })),
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

            if (!all.length) return null

            return (
              <div>
                <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {all.map((item) => {
                    const tabInfo = TABS.find(t => t.key === item._type)!
                    const Icon = tabInfo.icon
                    const title = item.title ?? `${item.fromLocation} → ${item.toLocation}`
                    return (
                      <Link key={`${item._type}-${item.id}`} href={item._href}
                        className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-border/60 hover:shadow-sm transition-all group">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${tabInfo.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${tabInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{title}</p>
                          <p className="text-xs text-muted-foreground">{tabInfo.label} · {formatRelativeTime(item.createdAt)}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyPostingsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await auth()
  const userId  = session!.user!.id

  const tab = (TABS.find(t => t.key === searchParams.tab)?.key ?? "overview") as TabKey

  const { listings, rentals, referrals, carpools, services, events } = await fetchAll(userId)

  const counts = {
    marketplace: listings.length,
    rentals:     rentals.length,
    referrals:   referrals.length,
    carpool:     carpools.length,
    services:    services.length,
    events:      events.length,
  }

  const activeTab    = TABS.find(t => t.key === tab)!
  const ActiveIcon   = activeTab.icon
  const newRoute     = NEW_ROUTES[tab]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Postings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All your posts across every service</p>
        </div>
        {newRoute && (
          <Button asChild className="gap-1.5">
            <Link href={newRoute}><Plus className="h-4 w-4" /> New {activeTab.label}</Link>
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {TABS.map((t) => {
          const Icon    = t.icon
          const isActive = tab === t.key
          const cnt     = counts[t.key as keyof typeof counts] ?? 0
          return (
            <Link
              key={t.key}
              href={`/my-postings?tab=${t.key}`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.key !== "overview" && cnt > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  isActive ? "bg-background/20" : "bg-background text-foreground"
                }`}>
                  {cnt}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewSection
          counts={counts}
          listings={listings} rentals={rentals} referrals={referrals}
          carpools={carpools} services={services} events={events}
        />
      )}

      {tab === "marketplace" && (
        <>
          <SectionHeader icon={ShoppingBag} label="Buy & Sell" color={TABS[1].color} bg={TABS[1].bg} count={counts.marketplace} newRoute="/marketplace/new" />
          <MarketplaceSection listings={listings} />
        </>
      )}

      {tab === "rentals" && (
        <>
          <SectionHeader icon={Home} label="Rentals" color={TABS[2].color} bg={TABS[2].bg} count={counts.rentals} newRoute="/rentals/new" />
          <RentalsSection rentals={rentals} />
        </>
      )}

      {tab === "referrals" && (
        <>
          <SectionHeader icon={Briefcase} label="Job Referrals" color={TABS[3].color} bg={TABS[3].bg} count={counts.referrals} newRoute="/referrals/new" />
          <ReferralsSection referrals={referrals} />
        </>
      )}

      {tab === "carpool" && (
        <>
          <SectionHeader icon={Car} label="Carpool Routes" color={TABS[4].color} bg={TABS[4].bg} count={counts.carpool} newRoute="/carpool/new" />
          <CarpoolSection carpools={carpools} />
        </>
      )}

      {tab === "services" && (
        <>
          <SectionHeader icon={Wrench} label="Services" color={TABS[5].color} bg={TABS[5].bg} count={counts.services} newRoute="/services/new" />
          <ServicesSection services={services} />
        </>
      )}

      {tab === "events" && (
        <>
          <SectionHeader icon={Users} label="Events" color={TABS[6].color} bg={TABS[6].bg} count={counts.events} newRoute="/events/new" />
          <EventsSection events={events} />
        </>
      )}

    </div>
  )
}
