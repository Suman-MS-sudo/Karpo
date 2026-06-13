import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: Request) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const posts = await prisma.servicePost.findMany({
    where: {
      isActive: true,
      ...(searchParams.get("category") ? { category: searchParams.get("category")! } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })
  return NextResponse.json({ data: posts })
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()
  const post = await prisma.servicePost.create({
    data: {
      userId: session.user.id,
      category: body.category,
      title: body.title,
      description: body.description,
      priceType: body.priceType,
      price: body.price,
      portfolio: body.portfolio ?? [],
      city: body.city,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
