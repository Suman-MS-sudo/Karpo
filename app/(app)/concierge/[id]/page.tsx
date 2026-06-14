import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, FileText, XCircle, Shield, PhoneCall, Mail, MessageSquare, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  PENDING:     { label: "Pending Review",   color: "text-amber-600 dark:text-amber-400",   description: "Your request is in the queue. Our team will reach out shortly." },
  IN_REVIEW:   { label: "Under Review",     color: "text-blue-600 dark:text-blue-400",     description: "Our team is reviewing your request and matching you with the right professional." },
  IN_PROGRESS: { label: "In Progress",      color: "text-indigo-600 dark:text-indigo-400", description: "A professional is actively working on your request." },
  COMPLETED:   { label: "Completed",        color: "text-green-600 dark:text-green-400",   description: "Your request has been resolved. Thank you for using Korpo Concierge!" },
  CANCELLED:   { label: "Cancelled",        color: "text-muted-foreground",                description: "This request was cancelled." },
}

const STATUS_STEPS = ["PENDING","IN_REVIEW","IN_PROGRESS","COMPLETED"]

const SERVICE_INFO: Record<string, { label: string; emoji: string; desc: string }> = {
  TAX:       { label: "Tax Filing",         emoji: "📄", desc: "ITR filing, tax planning, form 16 assistance" },
  LEGAL:     { label: "Legal Assistance",   emoji: "⚖️", desc: "Employment contracts, rental agreements, disputes" },
  INSURANCE: { label: "Insurance Advisory", emoji: "🛡️", desc: "Health, life, and vehicle insurance guidance" },
  FINANCIAL: { label: "Financial Planning", emoji: "📈", desc: "Investment planning, mutual funds, retirement" },
}

const CONTACT_ICON: Record<string, React.ElementType> = {
  EMAIL:    Mail,
  PHONE:    PhoneCall,
  WHATSAPP: MessageSquare,
}

const URGENCY_LABEL: Record<string, string> = { URGENT: "Urgent", NORMAL: "Normal", LOW: "Low priority" }

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const lead = await prisma.conciergeLead.findUnique({ where: { id: params.id } })
  if (!lead) notFound()
  if (lead.userId !== session.user.id && session.user.role !== "ADMIN") redirect("/concierge/my-leads")

  const info = SERVICE_INFO[lead.serviceType]
  const cfg  = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.PENDING
  const currentStep = STATUS_STEPS.indexOf(lead.status)
  const ContactIcon = CONTACT_ICON[lead.preferredContact] ?? Mail

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/concierge/my-leads" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to My Requests
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
              {info?.emoji ?? "📋"}
            </div>
            <div>
              <h1 className="text-xl font-bold">{info?.label ?? lead.serviceType}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{info?.desc}</p>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Submitted {formatDateTime(lead.createdAt)}
              </p>
            </div>
          </div>
          <div>
            <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      {lead.status !== "CANCELLED" && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-semibold mb-4">Request Progress</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = currentStep > i
              const isCurrent   = currentStep === i
              const label = STATUS_CONFIG[step]?.label.split(" ")[0] ?? step
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      isCompleted ? "bg-primary-600 border-primary-600 text-white"
                      : isCurrent  ? "bg-primary-100 border-primary-600 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                      : "bg-muted border-border text-muted-foreground"
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : i + 1}
                    </div>
                    <p className={`text-[10px] mt-1 font-medium text-center ${isCurrent ? "text-primary-600 dark:text-primary-400" : "text-muted-foreground"}`}>
                      {label}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${currentStep > i ? "bg-primary-600" : "bg-border"}`} />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4 bg-muted/50 rounded-lg p-3">{cfg.description}</p>
        </div>
      )}

      {/* Request details */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="font-semibold mb-4">Your Request</h2>
        <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{lead.description}</p>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border text-sm">
          {lead.urgency && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Urgency</p>
              <p className={`font-medium ${lead.urgency === "URGENT" ? "text-red-600 dark:text-red-400" : ""}`}>
                {URGENCY_LABEL[lead.urgency] ?? lead.urgency}
              </p>
            </div>
          )}
          {lead.budget && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="font-medium">₹{lead.budget.toLocaleString()}</p>
            </div>
          )}
          {lead.timeline && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timeline</p>
              <p className="font-medium">{lead.timeline}</p>
            </div>
          )}
          {lead.preferredContact && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Preferred Contact</p>
              <p className="font-medium flex items-center gap-1.5">
                <ContactIcon className="h-3.5 w-3.5" />
                {lead.preferredContact.charAt(0) + lead.preferredContact.slice(1).toLowerCase()}
              </p>
            </div>
          )}
          {lead.phone && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">{lead.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes from team */}
      {lead.notes && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <FileText className="h-4 w-4" /> Notes from our team
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {lead.status !== "CANCELLED" && lead.status !== "COMPLETED" && (
          <form action={`/api/concierge/${lead.id}`} method="DELETE">
            <Button variant="outline" className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive">
              <XCircle className="h-4 w-4 mr-1.5" /> Cancel Request
            </Button>
          </form>
        )}
        <Button asChild variant="outline">
          <Link href="/concierge/new">Submit New Request</Link>
        </Button>
      </div>
    </div>
  )
}
