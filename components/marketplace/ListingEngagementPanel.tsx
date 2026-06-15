"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Star, Calendar, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, XCircle, User, Clock, Package, Handshake, ThumbsDown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, getInitials } from "@/lib/utils"

interface Buyer {
  id:         string
  name:       string | null
  email:      string | null
  phone:      string | null
  avatarUrl:  string | null
  image:      string | null
  isVerified: boolean
  jobTitle:   string | null
  department: string | null
  company:    { name: string } | null
}

interface Engagement {
  id:        string
  type:      "INTEREST" | "VISIT"
  status:    string
  visitDate: string | null
  visitTime: string | null
  message:   string | null
  createdAt: string
  user:      Buyer
}

interface Props {
  listingId:    string
  initialCount: number
}

const TYPE_META = {
  INTEREST: { icon: Star,     label: "Interested",    color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-900/40" },
  VISIT:    { icon: Calendar, label: "Visit Request",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  CONFIRMED: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  ACCEPTED:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  DECLINED:  "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  DONE:      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
}

const TIME_LABELS: Record<string, string> = {
  MORNING:   "Morning (9am–12pm)",
  AFTERNOON: "Afternoon (12pm–5pm)",
  EVENING:   "Evening (5pm–8pm)",
}

function EngagementCard({ engagement, listingId }: { engagement: Engagement; listingId: string }) {
  const router    = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const meta      = TYPE_META[engagement.type]
  const Icon      = meta.icon
  const buyer     = engagement.user
  const isPending = engagement.status === "PENDING"
  const isDone    = engagement.status === "DONE"

  async function act(action: string) {
    setLoading(action)
    try {
      await fetch(`/api/listings/${listingId}/engagements/${engagement.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
      {/* Buyer info */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={buyer.avatarUrl ?? buyer.image ?? ""} />
            <AvatarFallback className="text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700">
              {getInitials(buyer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{buyer.name ?? "Anonymous"}</p>
              {buyer.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {buyer.jobTitle ?? buyer.department ?? ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[engagement.status] ?? ""}`}>
            {engagement.status.charAt(0) + engagement.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Visit details */}
      {engagement.type === "VISIT" && engagement.visitDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {new Date(engagement.visitDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            {engagement.visitTime ? ` · ${TIME_LABELS[engagement.visitTime]}` : ""}
          </span>
        </div>
      )}

      {/* Message */}
      {engagement.message && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 italic">"{engagement.message}"</p>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" /> {formatRelativeTime(engagement.createdAt)}
      </p>

      {/* Actions */}
      {isPending && engagement.type === "INTEREST" && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button size="sm" className="gap-1.5 h-8 text-xs"
            onClick={() => act("ACCEPT")} disabled={!!loading}>
            {loading === "ACCEPT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Accept
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => act("DECLINE")} disabled={!!loading}>
            {loading === "DECLINE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Decline
          </Button>
        </div>
      )}

      {isPending && engagement.type === "VISIT" && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => act("CONFIRM")} disabled={!!loading}>
            {loading === "CONFIRM" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Confirm
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => act("DECLINE")} disabled={!!loading}>
            {loading === "DECLINE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Decline
          </Button>
        </div>
      )}

      {engagement.status === "CONFIRMED" && engagement.type === "VISIT" && (
        <Button size="sm" className="w-full h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => act("DONE")} disabled={!!loading}>
          {loading === "DONE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Mark Visit Done
        </Button>
      )}

      {isDone && engagement.type === "VISIT" && (
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground">Did they agree to the deal?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm"
              className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!!loading}
              onClick={() => act("CLOSE_DEAL")}>
              {loading === "CLOSE_DEAL" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5" />}
              Deal Agreed
            </Button>
            <Button size="sm" variant="outline"
              className="gap-1.5 h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={!!loading}
              onClick={() => act("DECLINE")}>
              {loading === "DECLINE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
              Didn't Work Out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, iconClass, count, children }: {
  title: string; icon: any; iconClass: string; count: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  if (count === 0) return null
  return (
    <div>
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-foreground transition-colors group">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          {title}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground ml-1">{count}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="space-y-3 mt-2">{children}</div>}
    </div>
  )
}

export function ListingEngagementPanel({ listingId, initialCount }: Props) {
  const [open, setOpen]                     = useState(false)
  const [engagements, setEngagements]       = useState<Engagement[]>([])
  const [loadingPanel, setLoadingPanel]     = useState(false)
  const [count, setCount]                   = useState(initialCount)

  async function loadEngagements() {
    if (engagements.length > 0) { setOpen(true); return }
    setLoadingPanel(true)
    try {
      const res  = await fetch(`/api/listings/${listingId}/engagements`)
      const data = await res.json()
      setEngagements(data.engagements ?? [])
      setCount((data.engagements ?? []).length)
      setOpen(true)
    } finally {
      setLoadingPanel(false)
    }
  }

  const interests   = engagements.filter((e) => e.type === "INTEREST")
  const visits      = engagements.filter((e) => e.type === "VISIT")
  const pendingCount = engagements.filter((e) => ["PENDING", "CONFIRMED", "DONE"].includes(e.status)).length

  return (
    <div className="pt-4 border-t border-border">
      <button
        onClick={() => (open ? setOpen(false) : loadEngagements())}
        className="flex items-center justify-between w-full text-sm font-semibold hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary-600" />
          Buyer Engagement
          {count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              pendingCount > 0
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                : "bg-muted text-muted-foreground"
            }`}>
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {loadingPanel && (
        <div className="mt-3 flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {open && !loadingPanel && (
        <div className="mt-3 space-y-5">
          {engagements.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No buyer engagement yet</p>
            </div>
          ) : (
            <>
              <Section title="Interested Buyers" icon={Star} iconClass="text-amber-500" count={interests.length}>
                {interests.map((e) => <EngagementCard key={e.id} engagement={e} listingId={listingId} />)}
              </Section>
              <Section title="Visit Requests" icon={Calendar} iconClass="text-emerald-500" count={visits.length}>
                {visits.map((e) => <EngagementCard key={e.id} engagement={e} listingId={listingId} />)}
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  )
}
