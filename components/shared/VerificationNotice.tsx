import Link from "next/link"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

// What each kind of post is, for the "Korpo does not verify the …" sentence.
const SUBJECT = {
  listing:  { thing: "the item, its condition, ownership or price",          role: "seller"     },
  rental:   { thing: "the property, its ownership or the poster's authority to let it", role: "poster" },
  skill:    { thing: "the freelancer's qualifications, work quality or delivery", role: "freelancer" },
  ride:     { thing: "the driver, vehicle, licence or insurance",            role: "driver"     },
  event:    { thing: "the event, its organiser, safety or ticketing",        role: "organiser"  },
} as const

/**
 * Standard intermediary / verification-scope disclaimer for detail pages.
 * Korpo only facilitates discovery and communication; "Corporate email
 * verified" is the *only* check performed (Terms §4, §11).
 */
export function VerificationNotice({ kind, className }: { kind: keyof typeof SUBJECT; className?: string }) {
  const s = SUBJECT[kind]
  return (
    <div className={cn("flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-xl px-4 py-3", className)}>
      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p className="leading-relaxed">
        Korpo only connects members and is not a party to any arrangement between them. &quot;Corporate email
        verified&quot; means the {s.role} could receive a code at a corporate email address — Korpo does not
        verify their identity or employment, {s.thing}, or any payment. Check things yourself before you commit,
        and use Report if something looks wrong. See our{" "}
        <Link href="/terms#nature-of-platform" className="underline hover:text-foreground">Terms</Link>{" "}and{" "}
        <Link href="/prohibited-content" className="underline hover:text-foreground">Prohibited Content Policy</Link>.
      </p>
    </div>
  )
}
