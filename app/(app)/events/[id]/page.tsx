import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDateTime, formatCurrency, getInitials } from "@/lib/utils"

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      rsvps: { include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 20 },
      _count: { select: { rsvps: true } },
    },
  })

  if (!event || !event.isActive) notFound()
  const isOwner = session?.user?.id === event.organizerId
  const hasRsvped = event.rsvps.some((r) => r.userId === session?.user?.id)
  const isFull = event.maxParticipants ? event._count.rsvps >= event.maxParticipants : false

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {event.images[0] ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden">
              <Image src={event.images[0]} alt={event.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
              <span className="text-6xl">{event.category === "TREK" ? "🥾" : event.category === "SPORTS" ? "⚽" : "🎉"}</span>
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{event.title}</h1>
                <Badge variant="secondary" className="mt-2">{event.category}</Badge>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-600">{event.fee === 0 ? "Free" : formatCurrency(event.fee)}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" /> <span>{formatDateTime(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" /> <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{event._count.rsvps} going{event.maxParticipants ? ` · ${event.maxParticipants - event._count.rsvps} spots left` : ""}</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold mb-2">About this event</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>

            {event.rsvps.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold mb-3">Who&apos;s going ({event._count.rsvps})</h2>
                <div className="flex flex-wrap gap-2">
                  {event.rsvps.map((rsvp) => (
                    <Link key={rsvp.userId} href={`/profile/${rsvp.userId}`}>
                      <Avatar className="h-9 w-9 hover:ring-2 hover:ring-accent-400 transition-all">
                        <AvatarImage src={rsvp.user.avatarUrl ?? rsvp.user.image ?? ""} />
                        <AvatarFallback>{getInitials(rsvp.user.name)}</AvatarFallback>
                      </Avatar>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Organiser</h3>
            <UserCard user={event.organizer} size="md" />
            <div className="mt-4">
              {isOwner ? (
                <Button variant="outline" className="w-full">Manage Event</Button>
              ) : hasRsvped ? (
                <Button variant="secondary" className="w-full">✓ You&apos;re going!</Button>
              ) : isFull ? (
                <Button disabled className="w-full">Event Full</Button>
              ) : (
                <form action={`/api/events/${event.id}/rsvp`} method="POST">
                  <Button type="submit" className="w-full">RSVP — {event.fee === 0 ? "Free" : formatCurrency(event.fee)}</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
