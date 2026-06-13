import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing || listing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.listing.update({ where: { id: params.id }, data: { status: "SOLD" } })
  return NextResponse.redirect(
    new URL(`/marketplace`, process.env.NEXTAUTH_URL ?? "http://localhost:3001"),
    303  // 303 = POST → GET redirect; browser switches method
  )
}
