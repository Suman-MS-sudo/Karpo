"use client"
import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  listingId: string
  defaultAmount: number
  existingOffer?: { amount: number; status: string } | null
}

export function OfferButton({ listingId, defaultAmount, existingOffer }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(defaultAmount))
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ amount: number } | null>(
    existingOffer ? { amount: existingOffer.amount } : null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseInt(amount)
    if (!parsed || parsed < 1) return
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed, message: message.trim() || undefined }),
      })
      if (res.ok) {
        setDone({ amount: parsed })
        setOpen(false)
        toast.success("Offer sent! The seller will respond shortly.")
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Failed to submit offer")
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="w-full rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Offer Sent</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            You offered ₹{done.amount.toLocaleString("en-IN")}. The seller will respond shortly.
          </p>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <Button
        id="offer-button-trigger"
        variant="outline"
        className="w-full border-success/30 hover:bg-success/5 text-success"
        onClick={() => setOpen(true)}
      >
        🤝 Make an Offer
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-4 bg-surface">
      <p className="text-sm font-semibold">Make an Offer</p>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
        <Input
          required
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="pl-7"
        />
      </div>
      <Textarea
        placeholder="Add a note to the seller (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        maxLength={300}
        className="text-sm resize-none"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={loading}>
          {loading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending…</>
            : "Send Offer"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
