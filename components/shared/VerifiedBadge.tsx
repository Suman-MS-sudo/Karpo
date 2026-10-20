import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

// Wording is deliberately narrow ("Corporate email verified", never "Verified
// employee"): OTP proves access to a corporate inbox, not identity, current
// employment, or anything about the member's listings — see Terms §11.
export const VERIFICATION_SCOPE_NOTE =
  "This member proved access to a corporate email address via a one-time code. Korpo does not verify identity, employment, or any listing, product, property, job, service, ride or transaction."

export function VerifiedBadge({ size = "sm", className }: VerifiedBadgeProps) {
  return (
    <span
      title={VERIFICATION_SCOPE_NOTE}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400",
        size === "sm" && "px-1 sm:px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-1.5 sm:px-2 py-0.5 text-xs",
        size === "lg" && "px-2 sm:px-2.5 py-1 text-sm",
        className
      )}
    >
      <ShieldCheck className={cn(size === "sm" ? "h-3 w-3" : size === "md" ? "h-3.5 w-3.5" : "h-4 w-4")} aria-label="Corporate email verified" />
      {/* Icon-only on mobile — in compact contexts (listing card footers,
          narrow 2-column grids) the label was overlapping adjacent text like
          the city/timestamp. Label returns from sm: up where there's room. */}
      <span className="hidden sm:inline whitespace-nowrap">{size === "sm" ? "Email verified" : "Corporate email verified"}</span>
    </span>
  )
}
