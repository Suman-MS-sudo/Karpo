import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireVerified()
  if (error) return error

  const product = await prisma.benefitProduct.findUnique({
    where: { id: params.id },
    include: { provider: { select: { name: true, logo: true, domain: true } } },
  })

  if (!product || !product.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}
