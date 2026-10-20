"use client"

import Link from "next/link"

// Poster's declaration, required before a post goes live. Category-specific
// wording per the platform's listing rules (see /prohibited-content §2–4).
const DECLARATIONS = {
  listing:
    "I own this item or am authorised to sell it. It is not stolen, counterfeit, prohibited, or my employer's property, and the description and photos are accurate. I understand Korpo does not verify listings and is not a party to any sale.",
  rental:
    "I am the owner of this property, or authorised by the owner to let it, and the details and photos are accurate. I understand Korpo only publishes listings and does not own, inspect, manage or guarantee any property.",
  skill:
    "I can genuinely provide this service, my stated qualifications and experience are accurate, and I am not offering my employer's confidential work or resources. I understand Korpo only helps clients find me — any agreement, payment or delivery is between me and the client.",
  ride:
    "I hold a valid driving licence, my vehicle is registered and insured, and I am only sharing commute costs — not running a commercial taxi service. I understand Korpo is not a transport provider and does not arrange or control the ride.",
} as const

export function ListingDeclaration({ kind, checked, onChange }: {
  kind: keyof typeof DECLARATIONS
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-muted-foreground rounded-xl border border-border bg-muted/30 p-3.5 cursor-pointer">
      <input
        type="checkbox"
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="leading-relaxed">
        {DECLARATIONS[kind]} I agree to the{" "}
        <Link href="/prohibited-content" target="_blank" className="underline hover:text-foreground">Prohibited Content Policy</Link>{" "}
        and{" "}
        <Link href="/terms" target="_blank" className="underline hover:text-foreground">Terms</Link>.
      </span>
    </label>
  )
}
