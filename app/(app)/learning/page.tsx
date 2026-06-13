import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { Plus, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function LearningPage() {
  const session = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { instructor: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Learning Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Workshops, mentoring and certification prep from peer professionals</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="premium" className="text-xs px-2.5 py-1 flex items-center gap-1">
            <Crown className="h-3 w-3" />Premium Section
          </Badge>
          {!isPremium && (
            <Link href="/membership" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium">
              Upgrade for boosts →
            </Link>
          )}
          <Button asChild><Link href="/learning/new"><Plus className="h-4 w-4" /> List Course</Link></Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎓</p>
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6">Share your knowledge with the network!</p>
          <Button asChild><Link href="/learning/new">List First Course</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Link key={course.id} href={`/learning/${course.id}`} className="group">
              <div className="bg-card border border-border border-l-4 border-l-indigo-400 rounded-xl overflow-hidden hover:shadow-md transition-all">
                {course.images[0] ? (
                  <div className="relative aspect-video">
                    <Image src={course.images[0]} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <span className="text-4xl">🎓</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    <Badge variant="outline" className="text-xs">{course.mode}</Badge>
                  </div>
                  <h3 className="font-semibold group-hover:text-accent-400 transition-colors line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <UserCard user={course.instructor} size="sm" showCompany={false} clickable={false} />
                    <p className="font-bold text-primary-600">{course.price === 0 ? "Free" : formatCurrency(course.price)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
