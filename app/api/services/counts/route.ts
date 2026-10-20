import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  const userCity = session?.user?.city ?? null

  const [
    marketplaceCount,
    rentalCount,
    referralCount,
    skillCount,
    dealCount,
    eventCount,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE", ...(userCity ? { city: userCity } : {}) } }),
    prisma.rentalPost.count({ where: { status: "ACTIVE", ...(userCity ? { city: userCity } : {}) } }),
    prisma.jobReferral.count({ where: { status: "OPEN", ...(userCity ? { location: userCity } : {}) } }),
    prisma.skillListing.count({ where: { status: "ACTIVE", ...(userCity ? { location: userCity } : {}) } }),
    prisma.deal.count({ where: { isActive: true, validUntil: { gte: new Date() } } }),
    prisma.event.count({ where: { isActive: true, date: { gte: new Date() }, ...(userCity ? { location: userCity } : {}) } }),
  ])

  return NextResponse.json({
    "buy-sell": marketplaceCount,
    rentals: rentalCount,
    "job-referrals": referralCount,
    services: skillCount,
    deals: dealCount,
    events: eventCount,
  })
}
