"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props { rentalId: string }

export function SendInquiryPanel({ rentalId }: Props) {
  const router = useRouter()
  const [message, setMessage]       = useState("")
  const [moveInDate, setMoveInDate] = useState("")
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)
  const [error, setError]           = useState("")

  const handleSend = async () => {
    setSending(true)
    setError("")
    const res = await fetch(`/api/rentals/${rentalId}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() || undefined, moveInDate: moveInDate || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      setSent(true)
      router.refresh()
    } else {
      setError(data.error ?? "Failed to send inquiry")
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">Inquiry sent!</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
          You&apos;ll be notified when the owner responds.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-sm">Send an Inquiry</h3>

      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">
          Preferred move-in date
        </label>
        <input
          type="date"
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-colors"
          value={moveInDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setMoveInDate(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">
          Message to owner <span className="font-normal">(optional)</span>
        </label>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-colors placeholder:text-muted-foreground"
          rows={3}
          placeholder="Hi, I'm interested in viewing the property. I work nearby and looking for a long-term stay…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button className="w-full gap-2" onClick={handleSend} disabled={sending}>
        {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <><Send className="h-4 w-4" />Send Inquiry</>}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center leading-snug">
        The owner will review your profile and respond. Contact details are shared only after acceptance.
      </p>
    </div>
  )
}
