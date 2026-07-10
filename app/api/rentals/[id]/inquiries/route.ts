import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireVerified()
  if (error) return error

  const rental = await prisma.rentalPost.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (rental.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const inquiries = await prisma.rentalInquiry.findMany({
    where: { rentalId: params.id },
    include: {
      user: {
        select: {
          id: true, name: true, avatarUrl: true, image: true,
          phone: true, email: true, department: true, jobTitle: true,
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(inquiries)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireVerified()
  if (error) return error

  const rental = await prisma.rentalPost.findUnique({
    where: { id: params.id },
    select: { userId: true, status: true, title: true },
  })
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (rental.status !== "ACTIVE") return NextResponse.json({ error: "This listing is no longer active" }, { status: 400 })
  if (rental.userId === session.user.id) return NextResponse.json({ error: "Cannot inquire on your own listing" }, { status: 400 })

  const body = await req.json()
  const { type = "INQUIRY", message, moveInDate, visitDate, visitTime } = body as {
    type?: string; message?: string; moveInDate?: string; visitDate?: string; visitTime?: string
  }

  const existing = await prisma.rentalInquiry.findUnique({
    where: { rentalId_userId: { rentalId: params.id, userId: session.user.id } },
  })

  // Upsert: allow upgrading (INTEREST → VISIT → INQUIRY) but not downgrading
  const TYPE_RANK: Record<string, number> = { INTEREST: 1, VISIT: 2, INQUIRY: 3 }
  const incomingRank = TYPE_RANK[type] ?? 1
  const existingRank = existing ? (TYPE_RANK[existing.type] ?? 1) : 0

  if (existing && incomingRank <= existingRank && existing.status !== "DECLINED") {
    return NextResponse.json({ error: "Already engaged with this listing", existing }, { status: 400 })
  }

  const data = {
    rentalId:  params.id,
    userId:    session.user.id,
    type,
    status:    "PENDING",
    message:   message ?? null,
    moveInDate:moveInDate ? new Date(moveInDate) : null,
    visitDate: visitDate  ? new Date(visitDate)  : null,
    visitTime: visitTime  ?? null,
  }

  const notifyBody = {
    INTEREST: `Someone is interested in your listing: "${rental.title}"`,
    VISIT: `Someone requested a visit for "${rental.title}"${visitDate ? ` on ${new Date(visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}`,
    INQUIRY: `New message about your listing: "${rental.title}"`,
  }[type] ?? `New inquiry for "${rental.title}"`

  const [inquiry] = await prisma.$transaction([
    existing
      ? prisma.rentalInquiry.update({ where: { id: existing.id }, data })
      : prisma.rentalInquiry.create({ data }),
    prisma.notification.create({
      data: {
        userId: rental.userId,
        type:   "RENTAL_INQUIRY",
        title:  type === "VISIT" ? "Visit request received" : type === "INTEREST" ? "Someone is interested" : "New rental inquiry",
        body:   notifyBody,
        link:   `/rentals/${params.id}`,
      },
    }),
  ])

  return NextResponse.json(inquiry, { status: existing ? 200 : 201 })
}
