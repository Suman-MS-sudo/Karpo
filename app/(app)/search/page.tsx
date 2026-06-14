import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Search, ShoppingBag, Home, Briefcase, Car, Users, Wrench } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = (searchParams.q ?? "").trim()

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Search across Korpo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find listings, jobs, rentals, events, and more
          </p>
        </div>
      </div>
    )
  }

  const contains = { contains: q, mode: "insensitive" as const }

  const [listings, referrals, rentals, carpool, skills, events] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { description: contains }] },
      take: 6,
      select: { id: true, title: true, price: true, city: true, area: true, images: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobReferral.findMany({
      where: { status: "OPEN", OR: [{ title: contains }, { department: contains }] },
      take: 6,
      select: { id: true, title: true, department: true, location: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rentalPost.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { description: contains }] },
      take: 6,
      select: { id: true, title: true, rent: true, area: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.carpoolRoute.findMany({
      where: { isActive: true, OR: [{ fromLocation: contains }, { toLocation: contains }] },
      take: 4,
      select: { id: true, fromLocation: true, toLocation: true, pricePerSeat: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.servicePost.findMany({
      where: { isActive: true, OR: [{ title: contains }, { description: contains }] },
      take: 6,
      select: { id: true, title: true, price: true, priceType: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { isActive: true, date: { gte: new Date() }, OR: [{ title: contains }, { description: contains }] },
      take: 4,
      select: { id: true, title: true, date: true, location: true, fee: true },
      orderBy: { date: "asc" },
    }),
  ])

  const total = listings.length + referrals.length + rentals.length + carpool.length + skills.length + events.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          {total > 0 ? `${total}+ results for "${q}"` : `No results for "${q}"`}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Showing across all Korpo services</p>
      </div>

      {total === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Try a different keyword or browse a service directly.</p>
        </div>
      )}

      {/* Buy & Sell */}
      {listings.length > 0 && (
        <Section
          title="Buy & Sell"
          icon={<ShoppingBag className="h-4 w-4" />}
          color="text-blue-600"
          href={`/marketplace?q=${encodeURIComponent(q)}`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {listings.map((l) => (
              <Link key={l.id} href={`/marketplace/${l.id}`}
                className="border border-border rounded-xl p-3 hover:bg-muted/50 transition-colors">
                {l.images?.[0] && (
                  <img src={l.images[0]} alt={l.title}
                    className="w-full h-28 object-cover rounded-lg mb-2 bg-muted" />
                )}
                <p className="text-sm font-semibold line-clamp-1">{l.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {l.price ? `₹${Number(l.price).toLocaleString("en-IN")}` : "Negotiable"}
                </p>
                {(l.area || l.city) && <p className="text-[11px] text-muted-foreground mt-0.5">{l.area ? `${l.area}, ${l.city}` : l.city}</p>}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Job Referrals */}
      {referrals.length > 0 && (
        <Section
          title="Job Referrals"
          icon={<Briefcase className="h-4 w-4" />}
          color="text-violet-600"
          href={`/referrals?q=${encodeURIComponent(q)}`}
        >
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {referrals.map((r) => (
              <Link key={r.id} href={`/referrals/${r.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.department} · {r.location}</p>
                </div>
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 shrink-0">View →</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Rentals */}
      {rentals.length > 0 && (
        <Section
          title="Rentals & Flatmates"
          icon={<Home className="h-4 w-4" />}
          color="text-emerald-600"
          href={`/rentals?q=${encodeURIComponent(q)}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rentals.map((r) => (
              <Link key={r.id} href={`/rentals/${r.id}`}
                className="border border-border rounded-xl px-4 py-3 hover:bg-muted/50 transition-colors">
                <p className="text-sm font-semibold line-clamp-1">{r.title}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  ₹{Number(r.rent).toLocaleString("en-IN")}/mo
                </p>
                {r.area && <p className="text-[11px] text-muted-foreground mt-0.5">{r.area}</p>}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Carpool */}
      {carpool.length > 0 && (
        <Section
          title="Carpool Routes"
          icon={<Car className="h-4 w-4" />}
          color="text-orange-600"
          href={`/carpool?q=${encodeURIComponent(q)}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {carpool.map((c) => (
              <Link key={c.id} href={`/carpool/${c.id}`}
                className="border border-border rounded-xl px-4 py-3 hover:bg-muted/50 transition-colors">
                <p className="text-sm font-semibold">{c.fromLocation} → {c.toLocation}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ₹{Number(c.pricePerSeat).toLocaleString("en-IN")}/seat
                </p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section
          title="Skill Marketplace"
          icon={<Wrench className="h-4 w-4" />}
          color="text-cyan-600"
          href={`/services?q=${encodeURIComponent(q)}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((s) => (
              <Link key={s.id} href={`/services/${s.id}`}
                className="border border-border rounded-xl px-4 py-3 hover:bg-muted/50 transition-colors">
                <p className="text-sm font-semibold line-clamp-1">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.category} · {s.priceType === "FREE" ? "Free" : s.priceType === "QUOTE" ? "Get a Quote" : s.price ? `from ₹${Number(s.price).toLocaleString("en-IN")}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Events */}
      {events.length > 0 && (
        <Section
          title="Events"
          icon={<Users className="h-4 w-4" />}
          color="text-amber-600"
          href={`/events?q=${encodeURIComponent(q)}`}
        >
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {events.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0">
                  {e.fee === 0 ? "Free" : `₹${Number(e.fee).toLocaleString("en-IN")}`}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({
  title, icon, color, href, children,
}: {
  title: string; icon: React.ReactNode; color: string; href: string; children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 font-semibold text-sm ${color}`}>
          {icon}
          {title}
        </div>
        <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          See all →
        </Link>
      </div>
      {children}
    </section>
  )
}
