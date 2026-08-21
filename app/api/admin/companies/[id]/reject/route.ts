import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.companyRequest.update({ where: { id: params.id }, data: { status: "REJECTED" } })
  return NextResponse.redirect(new URL("/admin/companies", req.url), 303)
}
