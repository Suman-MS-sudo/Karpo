"use client"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PremiumGateProps {
  children: React.ReactNode
  blur?: boolean
  className?: string
}

export function PremiumGate({ children, blur = true, className }: PremiumGateProps) {
  const { data: session } = useSession()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  if (isPremium) return <>{children}</>

  return (
    <div className={cn("relative", className)}>
      {blur && (
        <div className="pointer-events-none select-none opacity-40 blur-sm">
          {children}
        </div>
      )}
      <div className={cn(
        "flex flex-col items-center justify-center gap-4 text-center p-8 rounded-xl",
        blur ? "absolute inset-0 bg-card/80 backdrop-blur-none" : "bg-gradient-to-br from-amber-50 dark:from-amber-950/40 to-yellow-50 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-700"
      )}>
        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Premium Feature</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upgrade to Premium to unlock this feature
          </p>
        </div>
        <Button variant="premium" asChild>
          <Link href="/membership">
            <Sparkles className="h-4 w-4" />
            Upgrade for ₹99/month
          </Link>
        </Button>
      </div>
    </div>
  )
}
