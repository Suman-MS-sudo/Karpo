"use client"

import { useState, type ReactNode } from "react"
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

function LegalDialogBody({ doc }: { doc: LegalDoc }) {
  const isTerms = doc === "terms"
  return (
    <>
      <DialogHeader>
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF6FB]">
          {isTerms ? (
            <ScrollText className="h-5 w-5 text-[#1E3A5F]" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-[#1E3A5F]" />
          )}
        </div>
        <DialogTitle>{isTerms ? "Terms and Conditions" : "Privacy Policy"}</DialogTitle>
        <DialogDescription>
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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <LegalDialogBody doc={doc} />
      </DialogContent>
    </Dialog>
  )
}
