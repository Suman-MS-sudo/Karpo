import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Clock, Calendar, Globe, MapPin, Award, Users,
  BookOpen, CheckCircle, GraduationCap, Pencil, Languages,
} from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ADVANCED:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}
const MODE_LABEL: Record<string, string> = {
  ONLINE: "Online (virtual)", OFFLINE: "In-person", HYBRID: "Hybrid",
}

type Module = { module: string; topics: string[]; durationMins?: number }

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id ?? ""

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      instructor: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      enrollments: userId ? { where: { userId } } : false,
      _count: { select: { enrollments: true } },
    },
  })

  if (!course || !course.isActive) notFound()

  const isOwner = userId === course.instructorId
  const isEnrolled = Array.isArray((course as any).enrollments) && (course as any).enrollments.length > 0
  const enrolledCount = course._count.enrollments
  const curriculum = course.curriculum as Module[] | null
  const totalTopics = curriculum?.reduce((s, m) => s + m.topics.length, 0) ?? 0
  const spotsLeft = course.maxStudents ? course.maxStudents - enrolledCount : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/learning" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Learning Hub
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Cover */}
          {course.images[0] ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden">
              <Image src={course.images[0]} alt={course.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/30 flex items-center justify-center">
              <GraduationCap className="h-16 w-16 text-indigo-300 dark:text-indigo-700" />
            </div>
          )}

          {/* Badges + title */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary">{course.category}</Badge>
              {course.level && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${LEVEL_COLOR[course.level] ?? "bg-muted text-muted-foreground"}`}>
                  {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                </span>
              )}
              {course.certificate && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 flex items-center gap-1">
                  <Award className="h-3 w-3" /> Certificate
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                {isOwner && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/learning/${params.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Link>
                  </Button>
                )}
                <SocialShare title={`${course.title} — Course on Korpo`} path={`/learning/${params.id}`} variant="icon" />
              </div>
            </div>

            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {course.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 py-4 border-y border-border text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{enrolledCount} enrolled</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration}</span>
            <span className="flex items-center gap-1.5">
              {course.mode === "OFFLINE" ? <MapPin className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {MODE_LABEL[course.mode] ?? course.mode}
            </span>
            {course.language && (
              <span className="flex items-center gap-1.5"><Languages className="h-4 w-4" />{course.language}</span>
            )}
            {curriculum && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />{curriculum.length} modules · {totalTopics} topics
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-lg mb-3">About this course</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{course.description}</p>
          </div>

          {/* Prerequisites */}
          {course.prerequisites && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-1 text-amber-800 dark:text-amber-300">Prerequisites</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">{course.prerequisites}</p>
            </div>
          )}

          {/* Curriculum */}
          {curriculum && curriculum.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-4">Curriculum</h2>
              <div className="space-y-2">
                {curriculum.map((mod, i) => (
                  <details key={i} className="border border-border rounded-xl overflow-hidden group" open={i === 0}>
                    <summary className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-pointer hover:bg-muted transition-colors select-none">
                      <span className="font-medium text-sm">Module {i + 1}: {mod.module}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {mod.durationMins && (
                          <span>{mod.durationMins >= 60 ? `${Math.floor(mod.durationMins / 60)}h ${mod.durationMins % 60 > 0 ? `${mod.durationMins % 60}m` : ""}` : `${mod.durationMins}m`}</span>
                        )}
                        <span>{mod.topics.length} topics</span>
                      </div>
                    </summary>
                    <ul className="px-4 py-2 space-y-0.5 bg-card">
                      {mod.topics.map((topic, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm py-1.5 border-b border-border/50 last:border-0">
                          <CheckCircle className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Instructor */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Your Instructor</h2>
            <UserCard user={course.instructor} size="md" />
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
            <p className="text-3xl font-bold mb-1">
              {course.price === 0 ? "Free" : formatCurrency(course.price)}
            </p>
            {enrolledCount > 0 && (
              <p className="text-xs text-muted-foreground mb-4">{enrolledCount} students enrolled</p>
            )}

            <div className="space-y-2.5 mb-5 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{course.schedule}</span>
              </div>
              <div className="flex items-center gap-2">
                {course.mode === "OFFLINE" ? <MapPin className="h-4 w-4 text-muted-foreground shrink-0" /> : <Globe className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span>{MODE_LABEL[course.mode] ?? course.mode}</span>
              </div>
              {course.language && (
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Taught in {course.language}</span>
                </div>
              )}
              {spotsLeft !== null && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={spotsLeft <= 3 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                    {spotsLeft > 0 ? `${spotsLeft} spots left` : "Class full"}
                  </span>
                </div>
              )}
              {course.certificate && (
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                  <Award className="h-4 w-4 shrink-0" />
                  <span>Certificate of completion</span>
                </div>
              )}
            </div>

            {/* Capacity bar */}
            {course.maxStudents && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{enrolledCount} enrolled</span>
                  <span>{course.maxStudents} max</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${spotsLeft === 0 ? "bg-red-500" : spotsLeft! <= 3 ? "bg-amber-500" : "bg-primary-600"}`}
                    style={{ width: `${Math.min(100, (enrolledCount / course.maxStudents) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {isOwner ? (
              <Button className="w-full" asChild>
                <Link href={`/learning/${params.id}/edit`}>Manage Course</Link>
              </Button>
            ) : isEnrolled ? (
              <div className="space-y-2">
                <Button className="w-full" variant="secondary">✓ You&apos;re enrolled</Button>
                <form action={`/api/learning/${params.id}/enroll`} method="DELETE">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive text-xs">
                    Drop this course
                  </Button>
                </form>
              </div>
            ) : spotsLeft === 0 ? (
              <Button className="w-full" disabled>Class Full</Button>
            ) : userId ? (
              <form action={`/api/learning/${params.id}/enroll`} method="POST">
                <Button type="submit" className="w-full">
                  Enroll — {course.price === 0 ? "Free" : formatCurrency(course.price)}
                </Button>
              </form>
            ) : (
              <Button className="w-full" asChild>
                <Link href="/auth/signin">Sign in to Enroll</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
