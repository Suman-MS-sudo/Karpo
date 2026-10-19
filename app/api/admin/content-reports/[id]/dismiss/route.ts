import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await prisma.contentReport.update({ where: { id: params.id }, data: { status: "DISMISSED" } })
  return NextResponse.redirect(new URL("/admin/reports", req.url), 303)
}
