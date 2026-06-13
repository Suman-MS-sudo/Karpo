import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: Request) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const rentals = await prisma.rentalPost.findMany({
    where: {
      status: "ACTIVE",
      ...(searchParams.get("type") ? { type: searchParams.get("type")! } : {}),
      ...(searchParams.get("city") ? { city: searchParams.get("city")! } : {}),
    },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })
  return NextResponse.json({ data: rentals })
}

// Core fields that have always existed in the DB (safe to write at any time)
function coreData(userId: string, body: any) {
  return {
    userId,
    title:        body.title,
    type:         body.type,
    rent:         body.rent,
    deposit:      body.deposit      ?? null,
    city:         body.city,
    area:         body.area,
    amenities:    body.amenities    ?? [],
    images:       body.images       ?? [],
    availableFrom:new Date(body.availableFrom),
    description:  body.description  ?? null,
  }
}

// Extended fields added in the detail-form migration
function extendedData(body: any) {
  return {
    phone:        body.phone        ?? null,
    bhk:          body.bhk          ?? null,
    furnished:    body.furnished    ?? "UNFURNISHED",
    carpetArea:   body.carpetArea   ?? null,
    floor:        body.floor        ?? null,
    totalFloors:  body.totalFloors  ?? null,
    bathrooms:    body.bathrooms    ?? 1,
    balconies:    body.balconies    ?? 0,
    propertyAge:  body.propertyAge  ?? null,
    facing:       body.facing       ?? null,
    gender:       body.gender       ?? "ANY",
    occupancy:    body.occupancy    ?? "SINGLE",
    petsAllowed:  body.petsAllowed  ?? false,
    furnishingItems: body.furnishingItems ?? [],
    societyName:  body.societyName  || null,
    landmark:     body.landmark     || null,
    fullAddress:  body.fullAddress  || null,
    latitude:     body.latitude     ?? null,
    longitude:    body.longitude    ?? null,
    twoWheelerParking:  body.twoWheelerParking  ?? "NONE",
    fourWheelerParking: body.fourWheelerParking ?? "NONE",
    visitorParking:     body.visitorParking     ?? false,
    waterSupply:  body.waterSupply  ?? "24_7",
    powerBackup:  body.powerBackup  ?? "NONE",
    gasType:      body.gasType      ?? "NONE",
    internet:     body.internet     ?? "NOT_INCLUDED",
    maintenanceAmt:      body.maintenanceAmt      ?? null,
    maintenanceIncluded: body.maintenanceIncluded ?? false,
    brokerage:           body.brokerage           ?? "NONE",
    workingProfOnly: body.workingProfOnly ?? false,
    studentsAllowed: body.studentsAllowed ?? true,
    couplesAllowed:  body.couplesAllowed  ?? false,
    familiesAllowed: body.familiesAllowed ?? true,
    smokingAllowed:  body.smokingAllowed  ?? false,
    alcoholAllowed:  body.alcoholAllowed  ?? false,
    vegetarianOnly:  body.vegetarianOnly  ?? false,
    visitorsAllowed: body.visitorsAllowed ?? true,
    nonVegAllowed:   body.nonVegAllowed   ?? true,
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  const isPremium = session.user.membershipPlan === "PREMIUM"
  const body = await req.json()

  try {
    // Full create — works once db push has run
    const rental = await prisma.rentalPost.create({
      data: { ...coreData(session.user.id, body), ...extendedData(body), isBoosted: isPremium },
    })
    return NextResponse.json(rental, { status: 201 })
  } catch (err: any) {
    // P2022 = column doesn't exist yet (db push pending) — fall back to core fields only
    if (err?.code === "P2022") {
      const rental = await prisma.rentalPost.create({
        data: coreData(session.user.id, body),
      })
      return NextResponse.json(
        { ...rental, _warning: "Extended fields not saved — run `npx prisma db push` then restart the server." },
        { status: 201 }
      )
    }
    console.error("[POST /api/rentals]", err)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}
