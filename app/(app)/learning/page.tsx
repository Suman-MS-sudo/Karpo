import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { Plus, Award, Globe, MapPin, GraduationCap, Clock, Zap } from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"
import { FREE_LIMITS } from "@/lib/limits"

export const dynamic = "force-dynamic"

const LEVEL_BADGE: Record<string, string> = {
  BEGINNER:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ADVANCED:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const CATEGORIES = ["All","Programming","Finance","Design","Language","Business","Marketing","Data","Law","Wellness","Other"]

export default async function LearningPage({ searchParams }: { searchParams: { category?: string; mode?: string } }) {
  const session    = await auth()
  const isPremium  = session?.user?.membershipPlan === "PREMIUM"
  const myCoursesCount = session?.user?.id && !isPremium
    ? await prisma.course.count({ where: { instructorId: session.user.id, isActive: true } })
    : 0

  const where: Record<string, unknown> = { isActive: true }
  if (searchParams.category && searchParams.category !== "All") where.category = searchParams.category
  if (searchParams.mode) where.mode = searchParams.mode

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      instructor: { include: { company: { select: { name: true, logo: true, domain: true } } } },
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Learning Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Workshops, mentoring and certification prep from peer professionals</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isPremium && session?.user?.id && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">{myCoursesCount}/{FREE_LIMITS.learning} courses listed</span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
            </div>
          )}
          <Button asChild><Link href="/learning/new"><Plus className="h-4 w-4" /> List Course</Link></Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/learning${cat !== "All" ? `?category=${cat}` : ""}`}>
            <Button
              variant={searchParams.category === cat || (!searchParams.category && cat === "All") ? "default" : "outline"}
              size="sm" className="rounded-full whitespace-nowrap"
            >{cat}</Button>
          </Link>
        ))}
      </div>

      {/* Mode filter */}
      <div className="flex gap-2 mb-6">
        {[["","All modes"],["ONLINE","Online"],["OFFLINE","In-person"],["HYBRID","Hybrid"]].map(([v,l]) => (
          <Link key={v} href={`/learning?${searchParams.category ? `category=${searchParams.category}&` : ""}${v ? `mode=${v}` : ""}`}>
            <Button
              variant={searchParams.mode === v || (!searchParams.mode && v === "") ? "secondary" : "ghost"}
              size="sm" className="text-xs h-7"
            >{l}</Button>
          </Link>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6">Share your knowledge with the network!</p>
          <Button asChild><Link href="/learning/new">List First Course</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Link key={course.id} href={`/learning/${course.id}`} className="group">
              <div className="bg-card border border-border border-l-4 border-l-indigo-400 rounded-xl overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                {course.images[0] ? (
                  <div className="relative aspect-video">
                    <Image src={course.images[0]} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    {course.certificate && (
                      <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="h-2.5 w-2.5" /> Certificate
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 flex items-center justify-center relative">
                    <GraduationCap className="h-10 w-10 text-indigo-300 dark:text-indigo-700" />
                    {course.certificate && (
                      <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="h-2.5 w-2.5" /> Certificate
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {course.mode === "ONLINE" ? <><Globe className="h-2.5 w-2.5 mr-1" />Online</> : course.mode === "OFFLINE" ? <><MapPin className="h-2.5 w-2.5 mr-1" />In-person</> : "Hybrid"}
                    </Badge>
                    {course.level && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_BADGE[course.level] ?? "bg-muted text-muted-foreground"}`}>
                        {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-accent-400 transition-colors line-clamp-2 text-sm mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{course.description}</p>

                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {course.tags.slice(0,3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <UserCard user={course.instructor} size="sm" showCompany={false} clickable={false} />
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        <p className="font-bold text-primary-600 text-sm">{course.price === 0 ? "Free" : formatCurrency(course.price)}</p>
                        <SocialShare title={`${course.title} — Course on Korpo`} path={`/learning/${course.id}`} variant="icon" />
                      </div>
                    </div>
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
