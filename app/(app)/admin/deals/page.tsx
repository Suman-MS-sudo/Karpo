import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DealsManager } from "./DealsManager"

export const dynamic = "force-dynamic"

export default async function AdminDealsPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")
  if (session.user?.role !== "ADMIN") redirect("/dashboard")

  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  })

  return <DealsManager deals={deals} />
}
