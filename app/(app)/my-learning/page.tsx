import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Plus, GraduationCap, ExternalLink, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Courses" }
export const dynamic  = "force-dynamic"

const TABS = [
  { key: "all",    label: "All"    },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
]

interface PageProps { searchParams: { tab?: string } }

export default async function MyLearningPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find((t) => t.key === searchParams.tab)?.key ?? "all"

  const isActiveFilter = tab === "all" ? undefined : tab === "active"

  const courses = await prisma.course.findMany({
    where:   { instructorId: userId, ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}) },
    orderBy: { createdAt: "desc" },
    include: {},
  })

  const activeCount = courses.filter(c => c.isActive).length
  const pausedCount = courses.filter(c => !c.isActive).length
  const totalCount  = courses.length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Courses and workshops you've created</p>
        </div>
        <Button asChild>
          <Link href="/learning/new"><Plus className="h-4 w-4" /> Create Course</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: "Total",  value: totalCount  },
          { label: "Active", value: activeCount  },
          { label: "Paused", value: pausedCount  },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const cnt = t.key === "all" ? totalCount : t.key === "active" ? activeCount : pausedCount
          return (
            <Link
              key={t.key}
              href={`/my-learning?tab=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {cnt > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"
                }`}>{cnt}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {courses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No courses yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/learning/new"><Plus className="h-4 w-4" /> Create your first course</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c.id}
              className="group bg-card border border-border rounded-2xl p-4 hover:border-border/60 hover:shadow-sm transition-all">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 shrink-0 flex items-center justify-center">
                  {c.images?.[0] ? (
                    <Image src={c.images[0]} alt={c.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.category}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      c.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {c.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {c.price === 0 ? "Free" : formatCurrency(c.price)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{c.duration}
                    </span>
                    <span className="capitalize">{c.mode.toLowerCase()}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{c.schedule}
                    </span>
                    <span>{formatRelativeTime(c.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                      <Link href={`/learning/${c.id}`}><ExternalLink className="h-3 w-3" /> View</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                      <Link href={`/learning/${c.id}/edit`}>✏️ Edit</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
