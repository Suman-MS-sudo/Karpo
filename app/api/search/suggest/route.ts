import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 2) return NextResponse.json({ results: [] })

  const contains = { contains: q }

  const [listings, referrals, rentals, carpool, skills, events] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { description: contains }] },
      take: 3, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, price: true, city: true },
    }),
    prisma.jobReferral.findMany({
      where: { status: "OPEN", OR: [{ title: contains }, { department: contains }] },
      take: 3, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, department: true, location: true },
    }),
    prisma.rentalPost.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { description: contains }] },
      take: 3, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, rent: true, area: true },
    }),
    prisma.carpoolRoute.findMany({
      where: { isActive: true, OR: [{ fromLocation: contains }, { toLocation: contains }] },
      take: 3, orderBy: { createdAt: "desc" },
      select: { id: true, fromLocation: true, toLocation: true, pricePerSeat: true },
    }),
    prisma.skillListing.findMany({
      where: { status: "ACTIVE", OR: [{ title: contains }, { tagline: contains }] },
      take: 3, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, category: true },
    }),
    prisma.event.findMany({
      where: { isActive: true, date: { gte: new Date() }, OR: [{ title: contains }, { description: contains }] },
      take: 3, orderBy: { date: "asc" },
      select: { id: true, title: true, location: true, date: true },
    }),
  ])

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
