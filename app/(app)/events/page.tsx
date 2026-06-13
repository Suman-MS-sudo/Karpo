import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Plus, Calendar, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { formatDate, formatCurrency } from "@/lib/utils"

const TABS = ["All", "TREK", "SPORTS", "NETWORKING", "HOBBY", "OTHER"]

export default async function EventsPage({ searchParams }: { searchParams: { category?: string } }) {
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      date: { gte: new Date() },
      ...(searchParams.category && searchParams.category !== "All" ? { category: searchParams.category } : {}),
    },
    orderBy: { date: "asc" },
    take: 40,
    include: {
      organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      _count: { select: { rsvps: true } },
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Events &amp; Communities</h1>
          <p className="text-muted-foreground text-sm mt-1">Treks, sports, networking and more with verified colleagues</p>
        </div>
        <Button asChild><Link href="/events/new"><Plus className="h-4 w-4" /> Create Event</Link></Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {TABS.map((tab) => (
          <Link key={tab} href={`/events${tab !== "All" ? `?category=${tab}` : ""}`}>
            <Button variant={searchParams.category === tab || (!searchParams.category && tab === "All") ? "default" : "outline"} size="sm" className="rounded-full whitespace-nowrap">
              {tab === "TREK" ? "🥾 Treks" : tab === "SPORTS" ? "⚽ Sports" : tab === "NETWORKING" ? "🤝 Networking" : tab === "HOBBY" ? "🎨 Hobbies" : tab === "OTHER" ? "More" : tab}
            </Button>
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎉</p>
          <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
          <p className="text-muted-foreground mb-6">Be the first to organise something!</p>
          <Button asChild><Link href="/events/new">Create Event</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="group">
              <div className="bg-card border border-border border-l-4 border-l-yellow-400 rounded-xl overflow-hidden hover:shadow-md transition-all">
                {event.images[0] ? (
                  <div className="relative aspect-video">
                    <Image src={event.images[0]} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
                    <span className="text-4xl">{event.category === "TREK" ? "🥾" : event.category === "SPORTS" ? "⚽" : event.category === "NETWORKING" ? "🤝" : "🎉"}</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-accent-400 transition-colors line-clamp-1">{event.title}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> {event._count.rsvps} going
                      </span>
                      <span className="font-semibold text-sm">{event.fee === 0 ? "Free" : formatCurrency(event.fee)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <UserCard user={event.organizer} size="sm" showCompany={false} clickable={false} />
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
