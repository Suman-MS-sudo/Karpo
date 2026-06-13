import { Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumBadgeProps {
  variant?: "boosted" | "member" | "seller" | "compact"
  className?: string
}

export function PremiumBadge({ variant = "boosted", className }: PremiumBadgeProps) {
  if (variant === "compact") {
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider",
        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
        "border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded-full",
        className
      )}>
        <Crown className="h-2.5 w-2.5" />Pro
      </span>
    )
  }

  if (variant === "member") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
        "border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-full",
        className
      )}>
        <Crown className="h-3 w-3" />Premium Member
      </span>
    )
  }

  if (variant === "seller") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
        "text-amber-700 dark:text-amber-400",
        className
      )}>
        <Crown className="h-3 w-3" />Premium
      </span>
    )
  }

  // boosted (default)
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      "px-2 py-0.5 rounded-full shadow-sm",
      className
    )}>
      <Zap className="h-2.5 w-2.5" />Boosted
    </span>
  )
}

// Top-strip used by cards — full-width gradient line
export function PremiumStrip({ className }: { className?: string }) {
  return (
    <div className={cn(
      "h-0.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300",
      className
    )} />
  )
}
