"use client"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PremiumGateProps {
  children: React.ReactNode
  feature?: string   // e.g. "unlimited boosts"
  className?: string
}

// No longer blocks access — just wraps content and optionally shows an
// upgrade nudge for free users. Pass `feature` to get a contextual message.
export function PremiumGate({ children, feature, className }: PremiumGateProps) {
  const { data: session } = useSession()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  return (
    <div className={cn("space-y-3", className)}>
      {children}
      {!isPremium && feature && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm">
          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-amber-700 dark:text-amber-300 flex-1">
            Upgrade to Premium for {feature}
          </span>
          <Button variant="outline" size="sm" asChild className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0">
            <Link href="/membership">₹99/mo</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// Standalone upsell banner — use when you want just the nudge without wrapping content
export function PremiumNudge({ feature, className }: { feature: string; className?: string }) {
  const { data: session } = useSession()
  if (session?.user?.membershipPlan === "PREMIUM") return null
  return (
    <div className={cn("flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm", className)}>
      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
      <span className="text-amber-700 dark:text-amber-300 flex-1">
        Free plan limit reached for {feature}. Premium removes all limits.
      </span>
      <Button variant="outline" size="sm" asChild className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0">
        <Link href="/membership">Upgrade ₹99/mo</Link>
      </Button>
    </div>
  )
}
