"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileText, Loader2, CheckCircle2, XCircle, Clock,
  ArrowRight, ExternalLink, MessageSquare, Upload, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_RESUME_BYTES = 5 * 1024 * 1024 // 5MB

function ResumeUpload({ value, fileName, onChange }: { value: string; fileName: string; onChange: (url: string, name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      setError("Only PDF, DOC, or DOCX files are allowed")
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError("File is too large — max 5MB")
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/referrals/resume-upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      onChange(data.url, data.name ?? file.name)
    } catch (err: any) {
      setError(err.message ?? "Upload failed")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function clear() {
    onChange("", "")
  }

  return (
    <div className="space-y-1.5">
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-input bg-muted/40 text-sm">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate flex-1">{fileName || "Resume uploaded"}</span>
          <a href={value} download={fileName || undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">View</a>
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-950/10 transition-all text-muted-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary-500" /> : <Upload className="h-6 w-6" />}
          <p className="text-sm font-medium">{loading ? "Uploading…" : "Upload your resume/CV"}</p>
          <p className="text-xs">PDF, DOC, or DOCX — max 5MB</p>
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

type AppStatus = "PENDING" | "SHORTLISTED" | "REFERRED" | "HIRED" | "REJECTED"
type AppType   = "INTEREST" | "APPLICATION"

interface MyApplication {
  id:             string
  type:           AppType
  status:         AppStatus
  coverLetter:    string | null
  linkedIn:       string | null
  resumeUrl:      string | null
  resumeFileName: string | null
  yearsExp:       number | null
  currentCompany: string | null
  currentCtc:     number | null
  expectedCtc:    number | null
  noticePeriod:   number | null
}

interface Props {
  referralId:    string
  myApplication: MyApplication | null
  referrerName:  string
  referralTitle: string
}

function getStatusMeta(status: AppStatus) {
  const map: Record<AppStatus, { label: string; icon: any; color: string; bg: string }> = {
    PENDING:     { label: "Application received — awaiting review",   icon: Clock,        color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    SHORTLISTED: { label: "You've been accepted! 🎯",                 icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
    REFERRED:    { label: "Formally referred to the company 🚀",       icon: CheckCircle2, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
    HIRED:       { label: "You got the job! Congratulations! 🎉",      icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
    REJECTED:    { label: "Not selected this time — keep going!",       icon: XCircle,      color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
  }
  return map[status]
}

const JOURNEY_STEPS = [
  { label: "Interest shown",       statuses: ["PENDING", "SHORTLISTED", "REFERRED", "HIRED"] },
  { label: "Application reviewed", statuses: ["SHORTLISTED", "REFERRED", "HIRED"] },
  { label: "Accepted",             statuses: ["SHORTLISTED", "REFERRED", "HIRED"] },
  { label: "Referred to company",  statuses: ["REFERRED", "HIRED"] },
  { label: "Hired",                statuses: ["HIRED"] },
]

export function ReferralApplyPanel({ referralId, myApplication, referrerName, referralTitle }: Props) {
  const router = useRouter()
  const [mode, setMode]       = useState<"options" | "apply">("options")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  // Form state — Show Interest only ever needs a resume/CV
  const [resumeUrl, setResumeUrl] = useState("")
  const [resumeFileName, setResumeFileName] = useState("")

  async function submit(type: AppType) {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/referrals/${referralId}/applications`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type,
          resumeUrl:      resumeUrl      || undefined,
          resumeFileName: resumeFileName || undefined,
        }),
      })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON error page */ }
      if (!res.ok) {
        if (data?.existing) { router.refresh(); return }
        setError(data?.error ?? `Something went wrong (${res.status}). Please try again.`)
        return
      }
      router.refresh()
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  async function revoke() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/referrals/${referralId}/applications`, { method: "DELETE" })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON error page */ }
      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (${res.status}). Please try again.`)
        return
      }
      router.refresh()
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // Already applied
  if (myApplication) {
    const meta       = getStatusMeta(myApplication.status)
    const Icon       = meta.icon
    const isRejected = myApplication.status === "REJECTED"
    const canUpgrade = myApplication.type === "INTEREST" && myApplication.status === "PENDING"
    const canRevoke  = myApplication.status === "PENDING"

    return (
      <div className="space-y-3">
        <div className={`rounded-xl border p-4 ${meta.bg}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm ${meta.color}`}>
            <Icon className="h-4 w-4 shrink-0" />
            {meta.label}
          </div>
          {myApplication.type === "INTEREST" && myApplication.status === "PENDING" && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-6">
              You expressed interest. Submit a full application to stand out.
            </p>
          )}
        </div>

        {/* What I submitted */}
        {myApplication.type === "APPLICATION" && (
          <div className="space-y-1 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
            {myApplication.yearsExp != null && <p>Experience: <span className="text-foreground font-medium">{myApplication.yearsExp} years</span></p>}
            {myApplication.currentCompany  && <p>Currently at: <span className="text-foreground font-medium">{myApplication.currentCompany}</span></p>}
            {myApplication.currentCtc      && <p>Current CTC: <span className="text-foreground font-medium">₹{myApplication.currentCtc} LPA</span></p>}
            {myApplication.expectedCtc     && <p>Expected CTC: <span className="text-foreground font-medium">₹{myApplication.expectedCtc} LPA</span></p>}
            {myApplication.noticePeriod    && <p>Notice period: <span className="text-foreground font-medium">{myApplication.noticePeriod} days</span></p>}
            {myApplication.linkedIn && (
              <a href={myApplication.linkedIn} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                <ExternalLink className="h-3 w-3" />LinkedIn profile
              </a>
            )}
            {myApplication.resumeUrl && (
              <a href={myApplication.resumeUrl} download={myApplication.resumeFileName ?? undefined} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />View submitted resume
              </a>
            )}
          </div>
        )}

        {!isRejected && (
          <div className="space-y-1.5 px-1">
            {JOURNEY_STEPS.map((step, i) => {
              const done = step.statuses.includes(myApplication.status)
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                    done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>{done ? "✓" : ""}</div>
                  <span className={`text-xs ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {canUpgrade && (
          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setMode("apply")}>
            <FileText className="h-4 w-4" />Show Interest
          </Button>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button variant="outline" className="w-full gap-2" asChild>
          <a href="/messages">
            <MessageSquare className="h-4 w-4" />Message {referrerName.split(" ")[0]}
          </a>
        </Button>

        {canRevoke && (
          <Button
            variant="outline"
            className="w-full gap-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            disabled={loading}
            onClick={revoke}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Revoke Interest
          </Button>
        )}
      </div>
    )
  }

  // Show Interest form — just a resume/CV, nothing else
  if (mode === "apply") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Show Interest</p>
          <button onClick={() => setMode("options")} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">Cancel</button>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Resume / CV <span className="text-red-500">*</span>
          </label>
          <ResumeUpload
            value={resumeUrl}
            fileName={resumeFileName}
            onChange={(url, name) => { setResumeUrl(url); setResumeFileName(name) }}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button className="w-full gap-2" disabled={!resumeUrl.trim() || loading} onClick={() => submit("APPLICATION")}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Show Interest
        </Button>
      </div>
    )
  }

  // Initial options
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interested in this role?</p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button disabled={loading} onClick={() => setMode("apply")}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-all text-left group disabled:opacity-50">
        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">Show Interest</p>
          <p className="text-xs text-muted-foreground">Upload your resume/CV — that's all it takes</p>
        </div>
      </button>

      <button className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-violet-200 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-950/20 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 transition-all text-left group">
        <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <a href="/messages" className="flex-1">
          <p className="font-semibold text-sm">Ask a Question</p>
          <p className="text-xs text-muted-foreground">Message the referrer directly</p>
        </a>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}
