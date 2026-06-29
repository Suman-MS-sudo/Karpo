import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DealsManager } from "./DealsManager"

export const dynamic = "force-dynamic"

export default async function AdminDealsPage() {
  const session = await auth()

  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  })

  return <DealsManager deals={deals} />
}
