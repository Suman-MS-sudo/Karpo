import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Plus, Users, ExternalLink, Calendar, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Events" }
export const dynamic  = "force-dynamic"

const TABS = [
  { key: "all",      label: "All"      },
  { key: "upcoming", label: "Upcoming" },
  { key: "past",     label: "Past"     },
]

interface PageProps { searchParams: { tab?: string } }

export default async function MyEventsPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find((t) => t.key === searchParams.tab)?.key ?? "all"

  const now = new Date()
  const dateFilter =
    tab === "upcoming" ? { gte: now }
    : tab === "past"   ? { lt: now }
    : undefined

  const events = await prisma.event.findMany({
    where:   { organizerId: userId, ...(dateFilter ? { date: dateFilter } : {}) },
    orderBy: tab === "past" ? { date: "desc" } : { date: "asc" },
    include: { _count: { select: { rsvps: true } } },
  })

  const upcomingCount = events.filter(e => e.date >= now).length
  const pastCount     = events.filter(e => e.date < now).length
  const totalCount    = events.length
  const totalRsvps    = events.reduce((s, e) => s + e._count.rsvps, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Events and communities you've created</p>
        </div>
        <Button asChild>
          <Link href="/events/new"><Plus className="h-4 w-4" /> Create Event</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total",    value: totalCount    },
          { label: "Upcoming", value: upcomingCount },
          { label: "Past",     value: pastCount     },
          { label: "RSVPs",    value: totalRsvps    },
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
          const cnt = t.key === "all" ? totalCount : t.key === "upcoming" ? upcomingCount : pastCount
          return (
            <Link
              key={t.key}
              href={`/my-events?tab=${t.key}`}
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
      {events.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No events yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/events/new"><Plus className="h-4 w-4" /> Create your first event</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const isPast = e.date < now
            const dateStr = new Date(e.date).toLocaleDateString("en-IN", {
              weekday: "short", day: "numeric", month: "short", year: "numeric",
            })
            const timeStr = new Date(e.date).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true,
            })
            return (
              <div key={e.id}
                className={`group bg-card border border-border rounded-2xl p-4 hover:border-border/60 hover:shadow-sm transition-all ${isPast ? "opacity-70" : ""}`}>
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 shrink-0 flex items-center justify-center">
                    {e.images?.[0] ? (
                      <Image src={e.images[0]} alt={e.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm">{e.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.category}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isPast
                          ? "bg-muted text-muted-foreground"
                          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      }`}>
                        {isPast ? "PAST" : "UPCOMING"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{timeStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{e.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {e._count.rsvps}{e.maxParticipants ? `/${e.maxParticipants}` : ""} RSVPs
                      </span>
                      {e.fee > 0
                        ? <span className="font-medium text-foreground">{formatCurrency(e.fee)}</span>
                        : <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                      }
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                        <Link href={`/events/${e.id}`}><ExternalLink className="h-3 w-3" /> View</Link>
                      </Button>
                      {!isPast && (
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                          <Link href={`/events/${e.id}/edit`}>✏️ Edit</Link>
                        </Button>
                      )}
                      {e._count.rsvps > 0 && (
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                          <Link href={`/events/${e.id}#attendees`}>
                            <Users className="h-3 w-3" /> {e._count.rsvps} Attendee{e._count.rsvps !== 1 ? "s" : ""}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
