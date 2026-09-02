"use client"
import { cn } from "@/lib/utils"

interface PremiumGateProps {
  children: React.ReactNode
  feature?: string   // e.g. "unlimited boosts"
  className?: string
}

// No longer blocks access — just wraps content. Upgrade/upsell nudges are
// disabled for now (Premium upsell is turned off across the app until it's
// re-enabled), so this just renders children.
export function PremiumGate({ children, className }: PremiumGateProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>
}

// Standalone upsell banner — disabled for now, renders nothing.
export function PremiumNudge(_props: { feature: string; className?: string }) {
  return null
}
