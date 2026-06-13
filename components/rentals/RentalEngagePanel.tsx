"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Star, Calendar, MessageSquare, CheckCircle2, Clock,
  Loader2, ChevronRight, X, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ─── Types ─────────────────────────────────────────────────────────────────

interface MyEngagement {
  id: string
  type: string        // INTEREST | VISIT | INQUIRY
  status: string      // PENDING | CONFIRMED | ACCEPTED | DECLINED | DONE
  visitDate?: string | null
  visitTime?: string | null
  message?: string | null
}

interface Props {
  rentalId: string
  myEngagement: MyEngagement | null
  ownerName: string
  ownerAvatar?: string | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { key: "MORNING",   label: "Morning",   sub: "9 AM – 12 PM" },
  { key: "AFTERNOON", label: "Afternoon", sub: "12 PM – 5 PM"  },
  { key: "EVENING",   label: "Evening",   sub: "5 PM – 8 PM"   },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: {
    label: "Awaiting owner response",
    color: "text-amber-600 dark:text-amber-400",
    bg:    "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    icon:  Clock,
  },
  CONFIRMED: {
    label: "Visit confirmed!",
    color: "text-emerald-600 dark:text-emerald-400",
    bg:    "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    icon:  CheckCircle2,
  },
  ACCEPTED: {
    label: "Accepted — contact details unlocked!",
    color: "text-emerald-600 dark:text-emerald-400",
    bg:    "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    icon:  CheckCircle2,
  },
  DECLINED: {
    label: "Not a match this time",
    color: "text-muted-foreground",
    bg:    "bg-muted/50 border-border",
    icon:  AlertCircle,
  },
  DONE: {
    label: "Visit completed",
    color: "text-blue-600 dark:text-blue-400",
    bg:    "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    icon:  CheckCircle2,
  },
}

const TYPE_LABEL: Record<string, string> = {
  INTEREST: "Interest",
  VISIT:    "Visit Request",
  INQUIRY:  "Message",
}

// ─── Sub-forms ─────────────────────────────────────────────────────────────

function VisitForm({
  onSubmit, onCancel, loading,
}: {
  onSubmit: (date: string, time: string, note: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [note, setNote] = useState("")

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Preferred date</label>
        <input
          type="date" min={today}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-primary-600 transition-colors"
          value={date} onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Preferred time</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button key={slot.key} type="button"
              onClick={() => setTime(slot.key)}
              className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                time === slot.key
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-950/20 text-primary-600"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              }`}>
              <span className="text-xs font-semibold">{slot.label}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{slot.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Note for owner <span className="font-normal">(optional)</span></label>
        <input
          type="text" maxLength={200}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-primary-600 transition-colors"
          placeholder="e.g. I'll be coming from office, can arrive by 6PM"
          value={note} onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button size="sm" className="flex-1 gap-2" disabled={loading || !date || !time}
          onClick={() => onSubmit(date, time, note)}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
          {loading ? "Sending…" : "Request Visit"}
        </Button>
      </div>
    </div>
  )
}

function MessageForm({
  onSubmit, onCancel, loading,
}: {
  onSubmit: (msg: string, moveIn: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const today = new Date().toISOString().split("T")[0]
  const [msg,    setMsg]    = useState("")
  const [moveIn, setMoveIn] = useState("")

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Your message</label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-primary-600 transition-colors placeholder:text-muted-foreground"
          placeholder="Hi, I'm interested in viewing the property. I work nearby and looking for a long-term stay…"
          value={msg} onChange={(e) => setMsg(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Preferred move-in date <span className="font-normal">(optional)</span></label>
        <input
          type="date" min={today}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-primary-600 transition-colors"
          value={moveIn} onChange={(e) => setMoveIn(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button size="sm" className="flex-1 gap-2" disabled={loading || !msg.trim()}
          onClick={() => onSubmit(msg, moveIn)}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
          {loading ? "Sending…" : "Send Message"}
        </Button>
      </div>
    </div>
  )
}

// ─── Status Card ───────────────────────────────────────────────────────────

function StatusCard({
  engagement, ownerName, ownerAvatar, onUpgrade,
}: {
  engagement: MyEngagement
  ownerName: string
  ownerAvatar?: string | null
  onUpgrade: (mode: "visit" | "message") => void
}) {
  const meta   = STATUS_META[engagement.status] ?? STATUS_META.PENDING
  const Icon   = meta.icon
  const isPending   = engagement.status === "PENDING"
  const isConfirmed = engagement.status === "CONFIRMED"
  const isDone      = engagement.status === "DONE"
  const isDeclined  = engagement.status === "DECLINED"

  const steps = [
    { done: true,                label: TYPE_LABEL[engagement.type] + " Sent" },
    { done: isConfirmed || isDone || engagement.status === "ACCEPTED", label: "Owner Responded" },
    { done: engagement.status === "ACCEPTED" || isDone,                label: "Deal Closed" },
  ]

  return (
    <div className="space-y-3">
      {/* Status pill */}
      <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border ${meta.bg}`}>
        <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
          {engagement.type === "VISIT" && engagement.visitDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(engagement.visitDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              {engagement.visitTime && ` · ${engagement.visitTime.charAt(0) + engagement.visitTime.slice(1).toLowerCase()}`}
            </p>
          )}
        </div>
      </div>

      {/* Progress steps */}
      {!isDeclined && (
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1 gap-1 min-w-0">
              <div className={`h-2 w-2 rounded-full shrink-0 ${step.done ? "bg-emerald-500" : "bg-border"}`} />
              <div className={`flex-1 h-px ${step.done && i < steps.length - 1 ? "bg-emerald-300 dark:bg-emerald-700" : "bg-border"}`} />
            </div>
          ))}
          <div className={`h-2 w-2 rounded-full shrink-0 ${steps[steps.length - 1].done ? "bg-emerald-500" : "bg-border"}`} />
        </div>
      )}

      {/* Owner card */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
        <Avatar className="h-8 w-8">
          <AvatarImage src={ownerAvatar ?? ""} />
          <AvatarFallback className="text-xs font-semibold">{ownerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{ownerName}</p>
          <p className="text-[10px] text-muted-foreground">Property Owner</p>
        </div>
      </div>

      {/* Upgrade options */}
      {engagement.type === "INTEREST" && (isPending || engagement.status === "ACCEPTED") && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {engagement.status === "ACCEPTED" ? "Next step — book your visit:" : "Want to do more?"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onUpgrade("visit")}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-left group">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Schedule Visit</span>
            </button>
            <button onClick={() => onUpgrade("message")}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:border-primary-600/50 hover:bg-primary-50 dark:hover:bg-primary-950/10 transition-all text-left group">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-600 shrink-0" />
              <span className="text-xs font-medium">Send Message</span>
            </button>
          </div>
        </div>
      )}

      {engagement.type === "VISIT" && (isPending || engagement.status === "CONFIRMED") && (
        <button onClick={() => onUpgrade("message")}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-border hover:border-primary-600/50 hover:bg-primary-50 dark:hover:bg-primary-950/10 transition-all text-left group">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-600 shrink-0" />
          <span className="text-xs font-medium">Also send a message</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
        </button>
      )}

      {isDeclined && (
        <p className="text-xs text-muted-foreground text-center">
          You can reach out via the Messages tab.
        </p>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

type Mode = "options" | "visit" | "message"

export function RentalEngagePanel({ rentalId, myEngagement: initial, ownerName, ownerAvatar }: Props) {
  const router = useRouter()
  const [engagement, setEngagement] = useState<MyEngagement | null>(initial)
  const [mode,    setMode]    = useState<Mode>("options")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const submit = async (payload: Record<string, any>) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/rentals/${rentalId}/inquiries`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok || res.status === 200) {
        setEngagement(data.existing ?? data)
        setMode("options")
        router.refresh()
      } else if (data.existing) {
        setEngagement(data.existing)
        setMode("options")
      } else {
        setError(data.error ?? "Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  const showInterest = () => submit({ type: "INTEREST" })

  const requestVisit = (date: string, time: string, note: string) =>
    submit({ type: "VISIT", visitDate: date, visitTime: time, message: note || undefined })

  const sendMessage = (msg: string, moveIn: string) =>
    submit({ type: "INQUIRY", message: msg, moveInDate: moveIn || undefined })

  // After any engagement exists, show status + upgrade options
  if (engagement && mode === "options") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Your Status</h3>
        <StatusCard
          engagement={engagement}
          ownerName={ownerName}
          ownerAvatar={ownerAvatar}
          onUpgrade={(m) => setMode(m)}
        />
      </div>
    )
  }

  // Upgrade forms (reached from StatusCard)
  if (engagement && mode === "visit") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary-600" />Schedule a Visit</h3>
          <button onClick={() => setMode("options")}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <VisitForm onSubmit={requestVisit} onCancel={() => setMode("options")} loading={loading} />
      </div>
    )
  }

  if (engagement && mode === "message") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary-600" />Send a Message</h3>
          <button onClick={() => setMode("options")}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <MessageForm onSubmit={sendMessage} onCancel={() => setMode("options")} loading={loading} />
      </div>
    )
  }

  // Initial: no engagement yet — 3 action options
  if (mode === "options") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2.5 mb-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={ownerAvatar ?? ""} />
            <AvatarFallback className="text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700">{ownerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{ownerName}</p>
            <p className="text-xs text-muted-foreground">Property Owner</p>
          </div>
        </div>

        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connect with owner</h3>

        {/* Show Interest */}
        <button onClick={showInterest} disabled={loading}
          className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all text-left disabled:opacity-50">
          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {loading ? <Loader2 className="h-4 w-4 text-amber-600 animate-spin" /> : <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Show Interest</p>
            <p className="text-xs text-muted-foreground mt-0.5">Quick tap — no commitment required</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Schedule Visit */}
        <button onClick={() => setMode("visit")} disabled={loading}
          className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-left">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Request a Visit</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pick a date and time to see the property</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Send Message */}
        <button onClick={() => setMode("message")} disabled={loading}
          className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-left">
          <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Ask a Question</p>
            <p className="text-xs text-muted-foreground mt-0.5">Introduce yourself or ask about the property</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}

        <p className="text-[11px] text-muted-foreground text-center leading-snug pt-1">
          Contact details are shared only after the owner accepts your request.
        </p>
      </div>
    )
  }

  // Visit form (first time, no existing engagement)
  if (mode === "visit") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-600" />Request a Visit</h3>
          <button onClick={() => setMode("options")}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <VisitForm onSubmit={requestVisit} onCancel={() => setMode("options")} loading={loading} />
      </div>
    )
  }

  // Message form (first time)
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-600" />Ask a Question</h3>
        <button onClick={() => setMode("options")}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <MessageForm onSubmit={sendMessage} onCancel={() => setMode("options")} loading={loading} />
    </div>
  )
}
