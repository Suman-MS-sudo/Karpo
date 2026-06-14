import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const post = await prisma.servicePost.findUnique({
    where: { id: params.id },
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  }) as import("@/types").ServicePostWithUser | null

  if (!post || !post.isActive) notFound()
  const isOwner = session?.user?.id === post.userId

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Skill Marketplace
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {post.portfolio.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {post.portfolio.slice(0, 4).map((img, i) => (
                <div key={i} className={`relative rounded-xl overflow-hidden ${i === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}>
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{post.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  {post.city && <span className="text-sm text-muted-foreground">{post.city}</span>}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                {post.priceType === "NEGOTIABLE" ? (
                  <Badge variant="outline">Negotiable</Badge>
                ) : (
                  <p className="text-2xl font-bold text-primary-600">
                    {post.price ? formatCurrency(post.price) : "Contact"}
                    {post.priceType === "HOURLY" && <span className="text-sm font-normal text-muted-foreground">/hr</span>}
                  </p>
                )}
                <SocialShare
                  title={`${post.title} — Skill on Korpo`}
                  description={post.description ?? undefined}
                  path={`/services/${params.id}`}
                  variant="icon"
                />
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold mb-2">About this service</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{post.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Service Provider</h3>
            <UserCard user={post.user} size="md" />
            <div className="mt-4">
              {isOwner ? (
                <Button variant="outline" className="w-full">Edit Service</Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link href={`/messages/${post.userId}?context=${post.id}&type=service`}>Hire / Message</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
