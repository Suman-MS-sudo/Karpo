"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Star, Calendar, MessageSquare, Users, Check, X,
  Phone, Mail, ChevronDown, ChevronUp, CheckCircle2,
  Loader2, Flag, Handshake, ThumbsDown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import Link from "next/link"

interface Inquirer {
  id: string; name: string | null; email: string | null; phone: string | null
  avatarUrl: string | null; image: string | null; department: string | null
  jobTitle: string | null; company: { name: string } | null
}

interface Inquiry {
  id: string
  type: string           // INTEREST | VISIT | INQUIRY
  message: string | null
  moveInDate: string | Date | null
  visitDate:  string | Date | null
  visitTime:  string | null
  status: string
  createdAt: string | Date
  user: Inquirer
}

interface Props {
  rentalId: string
  inquiries: Inquiry[]
  isFilled: boolean
}

// ─── Action map per type ──────────────────────────────────────────────────

const ACTIONS: Record<string, { primary: string; primaryLabel: string; secondary?: string; secondaryLabel?: string }> = {
  INTEREST: { primary: "ACCEPT",   primaryLabel: "Accept",   secondary: "DECLINE", secondaryLabel: "Decline" },
  VISIT:    { primary: "CONFIRM",  primaryLabel: "Confirm",  secondary: "DECLINE", secondaryLabel: "Decline" },
  INQUIRY:  { primary: "ACCEPT",   primaryLabel: "Accept",   secondary: "DECLINE", secondaryLabel: "Decline" },
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700",
  CONFIRMED: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700",
  ACCEPTED:  "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700",
  DECLINED:  "text-muted-foreground bg-muted/50 border-border",
  DONE:      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700",
}

const TYPE_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  INTEREST: { icon: Star,          label: "Interested",      color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/15"   },
  VISIT:    { icon: Calendar,      label: "Visit Request",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  INQUIRY:  { icon: MessageSquare, label: "Message",         color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-500/15"     },
}

// ─── Single inquiry card ──────────────────────────────────────────────────

function InquiryCard({
  inquiry, rentalId, onUpdate,
}: {
  inquiry: Inquiry
  rentalId: string
  onUpdate: (id: string, newStatus: string) => void
}) {
  const [acting, setActing] = useState<string | null>(null)

  const act = async (action: string) => {
    setActing(action)
    const res = await fetch(`/api/rentals/${rentalId}/inquiries/${inquiry.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    })
    if (res.ok) {
      const { status } = await res.json()
      onUpdate(inquiry.id, status)
    }
    setActing(null)
  }

  const typeMeta = TYPE_META[inquiry.type] ?? TYPE_META.INQUIRY
  const actions  = ACTIONS[inquiry.type]  ?? ACTIONS.INQUIRY
  const isPending    = inquiry.status === "PENDING"
  const isConfirmed  = inquiry.status === "CONFIRMED"
  const isDone       = inquiry.status === "DONE"
  const isSettled    = ["ACCEPTED", "DECLINED"].includes(inquiry.status)

  return (
    <div className="border border-border rounded-xl p-3.5 space-y-3">
      {/* User row */}
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={inquiry.user.avatarUrl ?? inquiry.user.image ?? ""} />
          <AvatarFallback className="text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700">{getInitials(inquiry.user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{inquiry.user.name}</p>
          <p className="text-xs text-muted-foreground">{inquiry.user.jobTitle ?? inquiry.user.department}</p>

          {/* Visit date */}
          {inquiry.type === "VISIT" && inquiry.visitDate && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(inquiry.visitDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              {inquiry.visitTime && ` · ${inquiry.visitTime.charAt(0) + inquiry.visitTime.slice(1).toLowerCase()}`}
            </p>
          )}

          {/* Move-in date */}
          {inquiry.moveInDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Move-in: {new Date(inquiry.moveInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}

          {/* Message */}
          {inquiry.message && (
            <p className="text-xs text-foreground mt-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 leading-relaxed">{inquiry.message}</p>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{formatRelativeTime(new Date(inquiry.createdAt))}</span>
      </div>

      {/* Status badge for settled */}
      {isSettled && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium w-fit ${STATUS_COLOR[inquiry.status]}`}>
          <span className="capitalize">{inquiry.status.toLowerCase()}</span>
        </div>
      )}

      {/* Contact info if accepted */}
      {(inquiry.status === "ACCEPTED" || inquiry.status === "CONFIRMED") && (
        <div className="space-y-1 pt-1 border-t border-border">
          {inquiry.user.phone && (
            <a href={`tel:${inquiry.user.phone}`} className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary-600 transition-colors">
              <Phone className="h-3 w-3 text-muted-foreground" />{inquiry.user.phone}
            </a>
          )}
          {inquiry.user.email && (
            <a href={`mailto:${inquiry.user.email}`} className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary-600 transition-colors">
              <Mail className="h-3 w-3 text-muted-foreground" />{inquiry.user.email}
            </a>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-full gap-1.5 text-xs mt-1" asChild>
            <Link href={`/messages/${inquiry.user.id}`}><MessageSquare className="h-3 w-3" /> Message</Link>
          </Button>
        </div>
      )}

      {/* Action buttons */}
      {(isPending || isConfirmed) && (
        <div className="flex gap-2">
          <Button size="sm"
            className={`flex-1 gap-1.5 h-8 ${isPending ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            disabled={!!acting}
            onClick={() => act(isPending ? actions.primary : "DONE")}>
            {acting === (isPending ? actions.primary : "DONE")
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Check className="h-3.5 w-3.5" />}
            {isPending ? actions.primaryLabel : "Mark Visit Done"}
          </Button>
          {isPending && actions.secondary && (
            <Button size="sm" variant="outline"
              className="flex-1 gap-1.5 h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={!!acting}
              onClick={() => act(actions.secondary!)}>
              {acting === actions.secondary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              {actions.secondaryLabel}
            </Button>
          )}
        </div>
      )}

      {/* Post-visit decision (DONE state) */}
      {isDone && inquiry.type === "VISIT" && (
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground">Did they agree to the deal?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm"
              className="gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              disabled={!!acting}
              onClick={() => act("CLOSE_DEAL")}>
              {acting === "CLOSE_DEAL" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5" />}
              Deal Agreed
            </Button>
            <Button size="sm" variant="outline"
              className="gap-1.5 h-9 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
              disabled={!!acting}
              onClick={() => act("DECLINE")}>
              {acting === "DECLINE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
              Didn't Work Out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────

function Section({
  type, inquiries, rentalId, onUpdate,
}: {
  type: string
  inquiries: Inquiry[]
  rentalId: string
  onUpdate: (id: string, status: string) => void
}) {
  const [open, setOpen] = useState(true)
  const meta    = TYPE_META[type]
  const Icon    = meta.icon
  const pending = inquiries.filter(i => ["PENDING", "CONFIRMED", "DONE"].includes(i.status))
  const settled = inquiries.filter(i => ["ACCEPTED", "DECLINED"].includes(i.status))

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${meta.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
        </div>
        <span className="font-medium text-sm">{meta.label}</span>
        {pending.length > 0 && (
          <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
            {pending.length}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto mr-1">{inquiries.length} total</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
          {inquiries.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">None yet.</p>
          )}
          {pending.map(inq => (
            <InquiryCard key={inq.id} inquiry={inq} rentalId={rentalId} onUpdate={onUpdate} />
          ))}
          {settled.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-1">Responded</p>
              {settled.map(inq => (
                <InquiryCard key={inq.id} inquiry={inq} rentalId={rentalId} onUpdate={onUpdate} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

export function RentalInquiryPanel({ rentalId, inquiries: initial, isFilled }: Props) {
  const router = useRouter()
  const [inquiries, setInquiries]   = useState(initial)
  const [expanded, setExpanded]     = useState(true)
  const [markingFilled, setMarkingFilled] = useState(false)

  const update = (id: string, newStatus: string) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))
    router.refresh()
  }

  const markFilled = async () => {
    setMarkingFilled(true)
    await fetch(`/api/rentals/${rentalId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "FILLED" }),
    })
    router.refresh()
    setMarkingFilled(false)
  }

  const interests = inquiries.filter(i => i.type === "INTEREST")
  const visits    = inquiries.filter(i => i.type === "VISIT")
  const messages  = inquiries.filter(i => i.type === "INQUIRY")

  const pendingTotal = inquiries.filter(i => ["PENDING", "CONFIRMED"].includes(i.status)).length

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Leads</span>
          {pendingTotal > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingTotal}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {inquiries.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {interests.length > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" />{interests.length}</span>}
              {visits.length    > 0 && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3 text-emerald-500" />{visits.length}</span>}
              {messages.length  > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3 text-blue-500" />{messages.length}</span>}
            </div>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {inquiries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No leads yet. Share your listing to get responses.</p>
          )}

          {interests.length > 0 && (
            <Section type="INTEREST" inquiries={interests} rentalId={rentalId} onUpdate={update} />
          )}
          {visits.length > 0 && (
            <Section type="VISIT" inquiries={visits} rentalId={rentalId} onUpdate={update} />
          )}
          {messages.length > 0 && (
            <Section type="INQUIRY" inquiries={messages} rentalId={rentalId} onUpdate={update} />
          )}

          {/* Deal closing */}
          {!isFilled && inquiries.some(i => i.status === "ACCEPTED") && (
            <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 flex-1">You have an accepted lead. Ready to close?</p>
              <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                onClick={markFilled} disabled={markingFilled}>
                {markingFilled ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
                Mark Filled
              </Button>
            </div>
          )}

          {!isFilled && !inquiries.some(i => i.status === "ACCEPTED") && inquiries.length > 0 && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={markFilled} disabled={markingFilled}>
              {markingFilled ? "Marking…" : "Mark listing as Filled"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
