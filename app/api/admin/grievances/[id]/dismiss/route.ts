import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const existing = await prisma.appGrievance.findUnique({ where: { id: params.id }, select: { respondedAt: true } })
  const now = new Date()
  await prisma.appGrievance.update({
    where: { id: params.id },
    data: { status: "DISMISSED", resolvedAt: now, respondedAt: existing?.respondedAt ?? now },
  })
  return NextResponse.redirect(new URL("/admin/concerns", req.url), 303)
}
