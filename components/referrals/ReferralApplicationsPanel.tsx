"use client"

import { useState, useRef } from "react"
import {
  Users, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  XCircle, Clock, ExternalLink, Download, Star, FileText, Briefcase,
  Building2, IndianRupee, Timer, StickyNote, Save,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, getInitials } from "@/lib/utils"

interface Applicant {
  id:             string
  name:           string | null
  email:          string | null
  phone:          string | null
  avatarUrl:      string | null
  image:          string | null
  isVerified:     boolean
  jobTitle:       string | null
  department:     string | null
  company:        { name: string } | null
}

interface Application {
  id:             string
  type:           "INTEREST" | "APPLICATION"
  status:         string
  coverLetter:    string | null
  linkedIn:       string | null
  resumeUrl:      string | null
  resumeFileName: string | null
  yearsExp:       number | null
  currentCompany: string | null
  currentCtc:     number | null
  expectedCtc:    number | null
  noticePeriod:   number | null
  referrerNotes:  string | null
  createdAt:      string
  user:           Applicant
}

interface Props {
  referralId:   string
  initialCount: number
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:     "Pending",
  SHORTLISTED: "Accepted",
  REFERRED:    "Referred",
  HIRED:       "Hired",
  REJECTED:    "Rejected",
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:     "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  SHORTLISTED: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  REFERRED:    "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  HIRED:       "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  REJECTED:    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
}

const ACTION_STATUS: Record<string, string> = {
  SHORTLIST: "SHORTLISTED",
  REFER:     "REFERRED",
  HIRE:      "HIRED",
  REJECT:    "REJECTED",
}

const PIPELINE_STAGES = [
  { status: "PENDING",     label: "Pending",     icon: Clock,        color: "text-amber-500" },
  { status: "SHORTLISTED", label: "Accepted",    icon: Star,         color: "text-blue-500" },
  { status: "REFERRED",    label: "Referred",    icon: Briefcase,    color: "text-violet-500" },
  { status: "HIRED",       label: "Hired",       icon: CheckCircle2, color: "text-emerald-500" },
  { status: "REJECTED",    label: "Rejected",    icon: XCircle,      color: "text-red-500" },
]

function ApplicationCard({ app, referralId, onStatusChange }: { app: Application; referralId: string; onStatusChange: (id: string, status: string) => void }) {
  const [loading, setLoading]   = useState<string | null>(null)
  const [showCover, setShowCover] = useState(false)
  const [notes, setNotes]       = useState(app.referrerNotes ?? "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved]   = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const user = app.user

  const isPending     = app.status === "PENDING"
  const isShortlisted = app.status === "SHORTLISTED"
  const isReferred    = app.status === "REFERRED"
  const isSettled     = app.status === "HIRED" || app.status === "REJECTED"

  async function act(action: string) {
    setLoading(action)
    try {
      const res = await fetch(`/api/referrals/${referralId}/applications/${app.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      })
      // Update local state immediately — this panel's applicant list is
      // client-side state fetched once via load(), so router.refresh()
      // (which only re-renders server components) never reached it, leaving
      // the status looking unchanged until a full page reload.
      if (res.ok && ACTION_STATUS[action]) {
        onStatusChange(app.id, ACTION_STATUS[action])
      }
    } finally {
      setLoading(null)
    }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await fetch(`/api/referrals/${referralId}/applications/${app.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ referrerNotes: notes }),
      })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
      {/* Candidate header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatarUrl ?? user.image ?? ""} />
            <AvatarFallback className="text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{user.name ?? "Anonymous"}</p>
              {user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user.jobTitle ?? user.department ?? ""}
            </p>
            {user.email && <p className="text-[11px] text-muted-foreground/70">{user.email}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            app.type === "APPLICATION"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
          }`}>
            {app.type === "APPLICATION" ? <FileText className="h-2.5 w-2.5" /> : <Star className="h-2.5 w-2.5" />}
            {app.type === "APPLICATION" ? "Application" : "Interest"}
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[app.status] ?? ""}`}>
            {STATUS_LABEL[app.status] ?? app.status}
          </span>
        </div>
      </div>

      {/* Candidate vitals */}
      {app.type === "APPLICATION" && (app.yearsExp != null || app.currentCompany || app.currentCtc || app.expectedCtc || app.noticePeriod) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-muted/40 rounded-lg px-3 py-2.5 text-xs">
          {app.yearsExp != null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span><span className="text-foreground font-medium">{app.yearsExp}</span> yrs exp</span>
            </div>
          )}
          {app.currentCompany && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate text-foreground font-medium">{app.currentCompany}</span>
            </div>
          )}
          {app.currentCtc && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <IndianRupee className="h-3 w-3 shrink-0" />
              <span>Current: <span className="text-foreground font-medium">₹{app.currentCtc} LPA</span></span>
            </div>
          )}
          {app.expectedCtc && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <IndianRupee className="h-3 w-3 shrink-0" />
              <span>Expected: <span className="text-foreground font-medium">₹{app.expectedCtc} LPA</span></span>
            </div>
          )}
          {app.noticePeriod && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="h-3 w-3 shrink-0" />
              <span>Notice: <span className="text-foreground font-medium">{app.noticePeriod} days</span></span>
            </div>
          )}
        </div>
      )}

      {/* Links */}
      {(app.linkedIn || app.resumeUrl) && (
        <div className="flex gap-3">
          {app.linkedIn && (
            <a href={app.linkedIn} target="_blank" rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
              <ExternalLink className="h-3 w-3" />LinkedIn
            </a>
          )}
          {app.resumeUrl && (
            <>
              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                <ExternalLink className="h-3 w-3" />Resume / Portfolio
              </a>
              <a href={app.resumeUrl} download={app.resumeFileName ?? true} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                <Download className="h-3 w-3" />Download
              </a>
            </>
          )}
        </div>
      )}

      {/* Cover letter */}
      {app.coverLetter && (
        <div>
          <button onClick={() => setShowCover((p) => !p)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            {showCover ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showCover ? "Hide" : "Show"} cover note
          </button>
          {showCover && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mt-1.5 italic">"{app.coverLetter}"</p>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" /> Applied {formatRelativeTime(app.createdAt)}
        {user.phone && <><span className="text-border mx-1">·</span>{user.phone}</>}
      </p>

      {/* Pipeline actions */}
      {!isSettled && (
        <div className="pt-2 border-t border-border space-y-2">
          {isPending && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => act("SHORTLIST")} disabled={!!loading}>
                {loading === "SHORTLIST" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                Accept
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50"
                onClick={() => act("REJECT")} disabled={!!loading}>
                {loading === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Pass
              </Button>
            </div>
          )}
          {isShortlisted && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="gap-1.5 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => act("REFER")} disabled={!!loading}>
                {loading === "REFER" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Briefcase className="h-3.5 w-3.5" />}
                Submit Referral
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50"
                onClick={() => act("REJECT")} disabled={!!loading}>
                {loading === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Pass
              </Button>
            </div>
          )}
          {isReferred && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => act("HIRE")} disabled={!!loading}>
                {loading === "HIRE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Mark Hired
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50"
                onClick={() => act("REJECT")} disabled={!!loading}>
                {loading === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Rejected by company
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Private referrer notes */}
      <div className="pt-2 border-t border-dashed border-border/60">
        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <StickyNote className="h-3 w-3" />Private notes (only you see this)
        </p>
        <div className="relative">
          <textarea
            ref={notesRef}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add private notes about this candidate…"
            className="w-full text-xs px-2.5 py-2 rounded-lg border border-dashed border-border/60 bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none pr-16"
          />
          <button
            onClick={saveNotes}
            disabled={savingNotes || notes === (app.referrerNotes ?? "")}
            className="absolute right-2 bottom-2 text-[10px] flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
            {savingNotes
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : notesSaved
                ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                : <Save className="h-3 w-3" />}
            {notesSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ReferralApplicationsPanel({ referralId, initialCount }: Props) {
  const [open, setOpen]            = useState(false)
  const [applications, setApps]    = useState<Application[]>([])
  const [loadingPanel, setLoading] = useState(false)
  const [count, setCount]          = useState(initialCount)

  async function load() {
    if (applications.length > 0) { setOpen(true); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/referrals/${referralId}/applications`)
      const data = await res.json()
      setApps(data.applications ?? [])
      setCount((data.applications ?? []).length)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  function updateStatus(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const pending  = applications.filter((a) => a.status === "PENDING")
  const active   = applications.filter((a) => ["SHORTLISTED", "REFERRED"].includes(a.status))
  const settled  = applications.filter((a) => ["HIRED", "REJECTED"].includes(a.status))
  const actionableCount = applications.filter((a) => !["HIRED", "REJECTED"].includes(a.status)).length

  return (
    <div className="pt-4 border-t border-border">
      <button
        onClick={() => (open ? setOpen(false) : load())}
        className="flex items-center justify-between w-full text-sm font-semibold hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-600" />
          Applicants
          {count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              actionableCount > 0
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                : "bg-muted text-muted-foreground"
            }`}>{count}</span>
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
          {/* Pipeline summary bar */}
          {applications.length > 0 && (
            <div className="grid grid-cols-5 gap-1 bg-muted/40 rounded-xl p-3">
              {PIPELINE_STAGES.map((stage) => {
                const stageCount = applications.filter((a) => a.status === stage.status).length
                const Icon = stage.icon
                return (
                  <div key={stage.status} className="text-center">
                    <div className="text-base font-bold">{stageCount}</div>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      <Icon className={`h-2.5 w-2.5 ${stage.color}`} />
                      <span className="text-[9px] text-muted-foreground">{stage.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {applications.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No applications yet</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Pending Review ({pending.length})</p>
                  <div className="space-y-3">{pending.map((a) => <ApplicationCard key={a.id} app={a} referralId={referralId} onStatusChange={updateStatus} />)}</div>
                </div>
              )}
              {active.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">In Pipeline ({active.length})</p>
                  <div className="space-y-3">{active.map((a) => <ApplicationCard key={a.id} app={a} referralId={referralId} onStatusChange={updateStatus} />)}</div>
                </div>
              )}
              {settled.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Resolved ({settled.length})</p>
                  <div className="space-y-3">{settled.map((a) => <ApplicationCard key={a.id} app={a} referralId={referralId} onStatusChange={updateStatus} />)}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
