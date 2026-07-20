import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

// Lists all known companies for client-side autocomplete (referral posting,
// search filters, etc.) — a flat list is fine at current scale; if the table
// grows large this should switch to a `?q=` server-side search instead.
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, domain: true, logo: true },
  })
  return NextResponse.json({ data: companies })
}
