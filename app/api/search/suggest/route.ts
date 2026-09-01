import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fuzzyFilter } from "@/lib/fuzzy"

// Typo-tolerant like the rest of the app's search (see lib/fuzzy.ts): an
// exact DB `contains` pass first (cheap, catches the common case), and when
// that comes up short, a fuzzy pass over a wider recent window so misspelled
// queries (e.g. "iphon") still surface matches, similar to Google's "did you
// mean" behavior.
const CANDIDATE_POOL = 60
const PER_TYPE_LIMIT  = 3

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 2) return NextResponse.json({ results: [] })

  const contains = { contains: q }

  const [
    listingsExact, referralsExact, rentalsExact, carpoolExact, skillsExact, eventsExact,
    listingsPool, referralsPool, rentalsPool, carpoolPool, skillsPool, eventsPool,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { description: contains }] },
      take: PER_TYPE_LIMIT, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, price: true, city: true },
    }),
    prisma.jobReferral.findMany({
      where: { status: "OPEN", OR: [{ title: contains }, { department: contains }] },
      take: PER_TYPE_LIMIT, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, department: true, location: true },
    }),
    prisma.rentalPost.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { description: contains }] },
      take: PER_TYPE_LIMIT, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, rent: true, area: true },
    }),
    prisma.carpoolRoute.findMany({
      where: { isActive: true, OR: [{ fromLocation: contains }, { toLocation: contains }] },
      take: PER_TYPE_LIMIT, orderBy: { createdAt: "desc" },
      select: { id: true, fromLocation: true, toLocation: true, pricePerSeat: true },
    }),
    prisma.skillListing.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { tagline: contains }] },
      take: PER_TYPE_LIMIT, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, tagline: true, category: true },
    }),
    prisma.event.findMany({
      where: { isActive: true, date: { gte: new Date() }, OR: [{ title: contains }, { description: contains }] },
      take: PER_TYPE_LIMIT, orderBy: { date: "asc" },
      select: { id: true, title: true, description: true, location: true, date: true },
    }),

    // Fuzzy fallback pools — only needed when the exact pass is thin, but
    // fetched in the same Promise.all so there's no second round trip.
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      take: CANDIDATE_POOL, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, price: true, city: true },
    }),
    prisma.jobReferral.findMany({
      where: { status: "OPEN" },
      take: CANDIDATE_POOL, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, department: true, location: true },
    }),
    prisma.rentalPost.findMany({
      where: { status: "ACTIVE" },
      take: CANDIDATE_POOL, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, rent: true, area: true },
    }),
    prisma.carpoolRoute.findMany({
      where: { isActive: true },
      take: CANDIDATE_POOL, orderBy: { createdAt: "desc" },
      select: { id: true, fromLocation: true, toLocation: true, pricePerSeat: true },
    }),
    prisma.skillListing.findMany({
      where: { status: "ACTIVE" },
      take: CANDIDATE_POOL, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, tagline: true, category: true },
    }),
    prisma.event.findMany({
      where: { isActive: true, date: { gte: new Date() } },
      take: CANDIDATE_POOL, orderBy: { date: "asc" },
      select: { id: true, title: true, description: true, location: true, date: true },
    }),
  ])

  function withFuzzyFallback<T extends { id: string }>(
    exact: T[], pool: T[], getFields: (item: T) => (string | null | undefined)[]
  ): T[] {
    if (exact.length >= PER_TYPE_LIMIT) return exact
    const exactIds = new Set(exact.map((i) => i.id))
    const fuzzyExtra = fuzzyFilter(pool, q, getFields).filter((i) => !exactIds.has(i.id))
    return [...exact, ...fuzzyExtra].slice(0, PER_TYPE_LIMIT)
  }

  const listings  = withFuzzyFallback(listingsExact,  listingsPool,  (l) => [l.title, l.description])
  const referrals = withFuzzyFallback(referralsExact, referralsPool, (r) => [r.title, r.department])
  const rentals   = withFuzzyFallback(rentalsExact,   rentalsPool,   (r) => [r.title, r.description])
  const carpool   = withFuzzyFallback(carpoolExact,   carpoolPool,   (c) => [c.fromLocation, c.toLocation])
  const skills    = withFuzzyFallback(skillsExact,    skillsPool,    (s) => [s.title, s.tagline])
  const events    = withFuzzyFallback(eventsExact,    eventsPool,    (e) => [e.title, e.description])

  const results = [
    ...listings.map((l) => ({
      type: "Buy & Sell", href: `/marketplace/${l.id}`, title: l.title,
      subtitle: [l.price ? `₹${l.price.toLocaleString("en-IN")}` : null, l.city].filter(Boolean).join(" · "),
    })),
    ...referrals.map((r) => ({
      type: "Job Referral", href: `/referrals/${r.id}`, title: r.title,
      subtitle: [r.department, r.location].filter(Boolean).join(" · "),
    })),
    ...rentals.map((r) => ({
      type: "Rental", href: `/rentals/${r.id}`, title: r.title,
      subtitle: [`₹${r.rent.toLocaleString("en-IN")}/mo`, r.area].filter(Boolean).join(" · "),
    })),
    ...carpool.map((c) => ({
      type: "Carpool", href: `/carpool/${c.id}`, title: `${c.fromLocation} → ${c.toLocation}`,
      subtitle: `₹${c.pricePerSeat.toLocaleString("en-IN")}/seat`,
    })),
    ...skills.map((s) => ({
      type: "Skill", href: `/skills/${s.id}`, title: s.title,
      subtitle: s.category,
    })),
    ...events.map((e) => ({
      type: "Event", href: `/events/${e.id}`, title: e.title,
      subtitle: [new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), e.location].filter(Boolean).join(" · "),
    })),
  ]

  return NextResponse.json({ results: results.slice(0, 12) })
}
