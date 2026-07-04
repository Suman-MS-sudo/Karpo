import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { FREE_LIMITS } from "@/lib/limits"
import { ServicesClient } from "./ServicesClient"
import type { ServiceItem } from "./ServicesClient"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const session   = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const userId    = session?.user?.id

  const [myCount, posts, totalServices] = await Promise.all([
    userId && !isPremium
      ? prisma.servicePost.count({ where: { userId, isActive: true } })
      : Promise.resolve(0),
    prisma.servicePost.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "desc" },
      take:    100,
      include: { user: { select: { id: true, name: true, image: true, jobTitle: true, company: { select: { name: true } } } } },
    }),
    prisma.servicePost.count({ where: { isActive: true } }),
  ])

  const serialized: ServiceItem[] = posts.map(p => ({
    id:          p.id,
    title:       p.title,
    description: p.description,
    category:    p.category,
    priceType:   p.priceType,
    price:       p.price,
    portfolio:   (() => {
      const raw = p.portfolio as unknown
      if (Array.isArray(raw)) return raw as string[]
      if (typeof raw === "string") { try { return JSON.parse(raw) } catch {} }
      return []
    })(),
    city:        p.city,
    createdAt:   p.createdAt.toISOString(),
    user: {
      id:       p.user.id,
      name:     p.user.name,
      image:    p.user.image,
      jobTitle: p.user.jobTitle ?? null,
      company:  p.user.company ? { name: p.user.company.name } : null,
    },
  }))

  return (
    <Suspense>
      <ServicesClient
        services={serialized}
        totalServices={totalServices}
        isPremium={isPremium}
        myCount={myCount as number}
        skillsLimit={FREE_LIMITS.skills}
      />
    </Suspense>
  )
}
