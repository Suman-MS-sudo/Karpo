"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface PendingRequest {
  userId:    string
  name:      string | null
  image:     string | null
  avatarUrl: string | null
}

interface Props {
  eventId:  string
  requests: PendingRequest[]
}

export function PendingRequestsPanel({ eventId, requests: initial }: Props) {
  const router = useRouter()
  const [requests, setRequests] = useState(initial)
  const [busyId,   setBusyId]   = useState<string | null>(null)
  const [error,    setError]    = useState("")

  async function act(userId: string, action: "approve" | "decline") {
    setBusyId(userId); setError("")
    try {
      const res  = await fetch(`/api/events/${eventId}/rsvp/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      setRequests((prev) => prev.filter((r) => r.userId !== userId))
      router.refresh()
    } finally { setBusyId(null) }
  }

  if (requests.length === 0) return null

  return (
    <section className="bg-card border-2 border-amber-200 dark:border-amber-800 rounded-3xl p-6">
      <h2 className="text-base font-bold mb-1 flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
          <Clock className="h-3.5 w-3.5 text-white" />
        </span>
        Pending requests
        <span className="text-muted-foreground font-normal text-sm">({requests.length})</span>
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Approve or decline attendees waiting for confirmation.</p>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <div className="space-y-2">
        {requests.map((r) => (
          <div key={r.userId} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={r.avatarUrl ?? r.image ?? ""} />
              <AvatarFallback className="text-[10px]">{getInitials(r.name)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 min-w-0 text-sm font-medium truncate">{r.name ?? "Unknown"}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => act(r.userId, "decline")}
                disabled={busyId === r.userId}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-50"
              >
                {busyId === r.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => act(r.userId, "approve")}
                disabled={busyId === r.userId}
                className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 hover:brightness-110 flex items-center justify-center text-white transition-all disabled:opacity-50"
              >
                {busyId === r.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
