import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const report = await prisma.listingReport.findUnique({ where: { id: params.id } })
  if (report) {
    await prisma.listing.update({ where: { id: report.listingId }, data: { status: "REMOVED" } })
    await prisma.listingReport.update({ where: { id: params.id }, data: { status: "RESOLVED" } })
  }
  return NextResponse.redirect(new URL("/admin/reports", _req.url))
}
