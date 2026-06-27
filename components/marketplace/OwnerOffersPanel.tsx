"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

interface Offer {
  id: string
  amount: number
  message: string | null
  status: string
  createdAt: string
  buyer: {
    name: string | null
    email: string | null
    jobTitle: string | null
    company: { name: string } | null
  }
}

interface Props {
  listingId: string
  initialCount: number
}

export function OwnerOffersPanel({ listingId, initialCount }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [offers, setOffers]   = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [acting, setActing]   = useState<string | null>(null) // offerId being acted on

  if (initialCount === 0) return null

  const toggle = async () => {
    if (offers.length > 0) { setOpen((v) => !v); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/listings/${listingId}/offers`)
      const data = await res.json()
      setOffers(data.offers ?? [])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const respond = async (offerId: string, action: "ACCEPT" | "DECLINE") => {
    setActing(offerId)
    try {
      const res = await fetch(`/api/listings/${listingId}/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? "Something went wrong")
        return
      }
      // Optimistically update local state
      setOffers((prev) =>
        prev.map((o) => {
          if (o.id === offerId)    return { ...o, status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED" }
          if (action === "ACCEPT") return { ...o, status: o.status === "PENDING" ? "DECLINED" : o.status }
          return o
        })
      )
      // Refresh server state (listing becomes SOLD on accept)
      router.refresh()
    } finally {
      setActing(null)
    }
  }

  const pendingCount = offers.filter((o) => o.status === "PENDING").length

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors"
      >
        <span>
          🤝 {initialCount} offer{initialCount !== 1 ? "s" : ""} received
          {pendingCount > 0 && offers.length > 0 && (
            <span className="ml-2 text-xs bg-amber-400 text-white rounded-full px-1.5 py-0.5">
              {pendingCount} pending
            </span>
          )}
        </span>
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : open
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-amber-200 dark:border-amber-700 divide-y divide-amber-100 dark:divide-amber-800">
          {offers.map((offer) => {
            const isPending = offer.status === "PENDING"
            const isActing  = acting === offer.id
            return (
              <div key={offer.id} className="px-4 py-3 space-y-2">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-base">{formatCurrency(offer.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    offer.status === "ACCEPTED" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                    offer.status === "DECLINED"  ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"        :
                    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                  }`}>
                    {offer.status}
                  </span>
                </div>

                {/* Buyer info */}
                <p className="text-xs text-muted-foreground">
                  {offer.buyer.name ?? offer.buyer.email?.split("@")[0] ?? "Anonymous"}
                  {offer.buyer.jobTitle ? ` · ${offer.buyer.jobTitle}` : ""}
                  <span className="ml-2 opacity-60">· {formatRelativeTime(new Date(offer.createdAt))}</span>
                </p>

                {offer.message && (
                  <p className="text-xs text-foreground/80 italic bg-amber-50 dark:bg-amber-950/30 rounded-lg px-2.5 py-2">
                    &ldquo;{offer.message}&rdquo;
                  </p>
                )}

                {/* Action buttons — only for pending offers */}
                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={isActing}
                      onClick={() => respond(offer.id, "ACCEPT")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Accept
                    </button>
                    <button
                      disabled={isActing}
                      onClick={() => respond(offer.id, "DECLINE")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
