import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.companyRequest.update({ where: { id: params.id }, data: { status: "REJECTED" } })
  return NextResponse.json({ success: true })
}
