"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

type RsvpStatus = "NONE" | "PENDING" | "CONFIRMED"

interface Props {
  eventId:          string
  eventTitle:       string
  initialStatus:    RsvpStatus
  isFull:           boolean
  fee:              number
  requiresApproval: boolean
}

export function RsvpButton({ eventId, eventTitle, initialStatus, isFull, fee, requiresApproval }: Props) {
  const router = useRouter()
  const [status,  setStatus]  = useState<RsvpStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function rsvpFree() {
    setLoading(true); setError("")
    try {
      const res  = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      setStatus(data.status === "PENDING" ? "PENDING" : "CONFIRMED")
      router.refresh()
    } finally { setLoading(false) }
  }

  async function payAndRsvp() {
    setLoading(true); setError("")
    try {
      const res  = await fetch(`/api/events/${eventId}/pay-order`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't start payment"); setLoading(false); return }

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      data.amount,
        currency:    "INR",
        name:        "Korpo Events",
        description: eventTitle,
        order_id:    data.orderId,
        handler:     async (response: Record<string, string>) => {
          await fetch("/api/payment/verify", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response),
          })
          setStatus(requiresApproval ? "PENDING" : "CONFIRMED")
          router.refresh()
          setLoading(false)
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: "#1E3A5F" },
      }

      const win = window as Window & { Razorpay?: new (opts: typeof options) => { open(): void } }
      if (win.Razorpay) {
        new win.Razorpay(options).open()
      } else {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => { new win.Razorpay!(options).open() }
        document.head.appendChild(script)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  async function cancel() {
    setLoading(true); setError("")
    try {
      await fetch(`/api/events/${eventId}/rsvp`, { method: "DELETE" })
      setStatus("NONE")
      router.refresh()
    } finally { setLoading(false) }
  }

  if (status === "CONFIRMED") {
    return (
      <div className="space-y-2">
        <Button variant="secondary" className="w-full h-11 font-semibold" disabled>
          <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> You&apos;re going!
        </Button>
        <button type="button" onClick={cancel} disabled={loading} className="w-full text-xs text-muted-foreground hover:text-red-500 transition-colors">
          {loading ? "Cancelling…" : "Cancel my RSVP"}
        </button>
      </div>
    )
  }

  if (status === "PENDING") {
    return (
      <div className="space-y-2">
        <Button variant="secondary" className="w-full h-11 font-semibold" disabled>
          <Clock className="h-4 w-4 mr-2 text-amber-500" /> Request sent — awaiting approval
        </Button>
        <button type="button" onClick={cancel} disabled={loading} className="w-full text-xs text-muted-foreground hover:text-red-500 transition-colors">
          {loading ? "Cancelling…" : "Withdraw request"}
        </button>
      </div>
    )
  }

  if (isFull) {
    return <Button disabled className="w-full h-11">Event Full</Button>
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={fee > 0 ? payAndRsvp : rsvpFree}
        disabled={loading}
        className="w-full h-11 font-bold text-base rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 border-0 hover:brightness-110 shadow-[0_4px_20px_rgba(217,70,239,0.35)]"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {fee > 0 ? `Pay & RSVP — ${formatCurrency(fee)}` : "RSVP — It's Free"}
        {requiresApproval && <span className="text-xs opacity-70 ml-1">(needs approval)</span>}
      </Button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
