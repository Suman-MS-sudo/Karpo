import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ConciergeManager } from "./ConciergeManager"

export const dynamic = "force-dynamic"

interface Props { searchParams: { status?: string } }

export default async function AdminConciergePage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect("/auth/signin")
  if (session.user?.role !== "ADMIN") redirect("/dashboard")

  const statusFilter = searchParams.status

  const leads = await prisma.conciergeLead.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, company: { select: { name: true } } } },
    },
  })

  return <ConciergeManager leads={leads} activeStatus={statusFilter ?? "all"} />
}
