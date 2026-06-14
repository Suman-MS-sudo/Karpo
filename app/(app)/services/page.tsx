import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Plus, Zap } from "lucide-react"
import { FREE_LIMITS } from "@/lib/limits"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ListingCard } from "@/components/shared/ListingCard"

const CATS = [
  { value: "", label: "All" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "CODING", label: "Coding" },
  { value: "DESIGN", label: "Design" },
  { value: "TAX", label: "Tax Filing" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "COACHING", label: "Coaching" },
  { value: "OTHER", label: "Other" },
]

export default async function ServicesPage({ searchParams }: { searchParams: { category?: string } }) {
  const session   = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const myServicesCount = session?.user?.id && !isPremium
    ? await prisma.servicePost.count({ where: { userId: session.user.id, isActive: true } })
    : 0

  const posts = await prisma.servicePost.findMany({
    where: {
      isActive: true,
      ...(searchParams.category ? { category: searchParams.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Skill Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">Hire verified professionals from your network</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isPremium && session?.user?.id && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">{myServicesCount}/{FREE_LIMITS.skills} listed</span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
            </div>
          )}
          <Button asChild><Link href="/skills/new"><Plus className="h-4 w-4" /> Offer Service</Link></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map((c) => (
          <Link key={c.value} href={`/services${c.value ? `?category=${c.value}` : ""}`}>
            <Badge variant={searchParams.category === c.value || (!searchParams.category && !c.value) ? "default" : "outline"} className="cursor-pointer px-3 py-1">
              {c.label}
            </Badge>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔧</p>
          <h3 className="text-lg font-semibold mb-2">No services listed yet</h3>
          <p className="text-muted-foreground mb-6">Offer your skills to the corporate network!</p>
          <Button asChild><Link href="/services/new">List Your Service</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {posts.map((post) => (
            <ListingCard
              key={post.id}
              id={post.id}
              href={`/services/${post.id}`}
              title={post.title}
              subtitle={post.description}
              price={post.priceType === "NEGOTIABLE" ? undefined : post.price ?? undefined}
              priceLabel={post.priceType === "HOURLY" ? "/hr" : post.priceType === "NEGOTIABLE" ? undefined : undefined}
              images={post.portfolio}
              author={post.user}
              badge={post.category}
              tags={[post.priceType === "NEGOTIABLE" ? "Negotiable" : post.priceType === "HOURLY" ? "Hourly" : "Fixed Price"]}
              city={post.city}
              createdAt={post.createdAt}
              serviceBorderColor="border-l-teal-400"
            />
          ))}
        </div>
      )}
    </div>
  )
}
