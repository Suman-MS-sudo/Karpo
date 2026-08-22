"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import Link from "next/link"
import { ScrollText, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TermsContent, TERMS_LAST_UPDATED } from "@/components/legal/TermsContent"
import { PrivacyContent, PRIVACY_LAST_UPDATED } from "@/components/legal/PrivacyContent"

type LegalDoc = "terms" | "privacy"

// Lets TermsContent/PrivacyContent cross-link to "the other document" without
// leaving the modal for the (separately-styled, easy-to-forget-to-update)
// standalone /terms or /privacy pages. Outside a modal (e.g. those standalone
// pages themselves) this context is absent, so the link falls back to a real
// page navigation via LegalDocLink below.
const LegalModalSwitchContext = createContext<((doc: LegalDoc) => void) | null>(null)

/** Use inside TermsContent/PrivacyContent to link to the other legal document. */
export function LegalDocLink({ doc, children }: { doc: LegalDoc; children: ReactNode }) {
  const switchTo = useContext(LegalModalSwitchContext)
  if (switchTo) {
    return (
      <button type="button" onClick={() => switchTo(doc)} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
        {children}
      </button>
    )
  }
  return <Link href={`/${doc}`}>{children}</Link>
}

function LegalDialogBody({ doc }: { doc: LegalDoc }) {
  const isTerms = doc === "terms"
  return (
    <>
      <DialogHeader>
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          {isTerms ? (
            <ScrollText className="h-5 w-5 text-primary" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-primary" />
          )}
        </div>
        <DialogTitle className="text-foreground tracking-tight">{isTerms ? "Terms and Conditions" : "Privacy Policy"}</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Last updated: {isTerms ? TERMS_LAST_UPDATED : PRIVACY_LAST_UPDATED}
        </DialogDescription>
      </DialogHeader>
      <div className="legal-content legal-content--modal overflow-y-auto px-6 sm:px-8 py-6 max-h-[60vh]">
        {isTerms ? <TermsContent /> : <PrivacyContent />}
      </div>
    </>
  )
}

/** Wraps a trigger element (e.g. a link/button) and opens the Terms or Privacy Policy in a modal window. */
export function LegalModal({ doc, children }: { doc: LegalDoc; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activeDoc, setActiveDoc] = useState<LegalDoc>(doc)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setActiveDoc(doc) // reset to the doc that was clicked, each time it's reopened
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <LegalModalSwitchContext.Provider value={setActiveDoc}>
          <LegalDialogBody doc={activeDoc} />
        </LegalModalSwitchContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
