"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Zap, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BOOST_TIERS } from "@/config/services"
import { cn } from "@/lib/utils"

interface Props {
  listingId: string
  boostLevel: string
  boostExpiresAt: Date | null
}

type RazorpayOptions = {
  key: string | undefined
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (r: Record<string, string>) => Promise<void>
  theme: { color: string }
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open(): void }
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(); return }
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

export function BoostButton({ listingId, boostLevel, boostExpiresAt }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const now           = new Date()
  const isActiveBoost = boostLevel !== "NONE" && boostExpiresAt && new Date(boostExpiresAt) > now
  const activeTier    = BOOST_TIERS.find((t) => t.level === boostLevel)

  const handleBoost = async (level: string) => {
    setLoading(level)
    try {
      const res  = await fetch(`/api/listings/${listingId}/boost`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ level }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Failed to create order"); return }

      await loadRazorpay()
      const tier = BOOST_TIERS.find((t) => t.level === level)!

      new window.Razorpay!({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      data.amount,
        currency:    "INR",
        name:        "Korpo Boost",
        description: `${tier.label} — ${tier.days} days`,
        order_id:    data.orderId,
        handler: async (response) => {
          await fetch("/api/payment/verify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(response),
          })
          setSuccess(level)
          toast.success("Listing boosted! It will now appear in Featured.")
          router.refresh()
        },
        theme: { color: "#1E3A5F" },
      }).open()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {/* Compact trigger row */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between py-1.5 group"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Boost this listing
          </span>
          {isActiveBoost && activeTier && (
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", activeTier.badgeClass)}>
              {activeTier.icon} Active
            </span>
          )}
          {!isActiveBoost && (
            <span className="text-[10px] text-muted-foreground">from ₹49</span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {/* Expanded tier list */}
      {open && (
        <div className="space-y-2 pt-1">
          {isActiveBoost && activeTier && (
            <div className={cn("rounded-lg px-3 py-2 border text-xs flex items-center gap-2", activeTier.cardClass)}>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span className="font-medium">{activeTier.icon} {activeTier.label} active</span>
              <span className="text-muted-foreground ml-auto">
                expires {new Date(boostExpiresAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          )}

          {BOOST_TIERS.map((tier) => {
            const isCurrentActive = isActiveBoost && tier.level === boostLevel
            const isDone          = success === tier.level

            return (
              <div key={tier.level}
                className={cn(
                  "rounded-lg border px-3 py-2 relative",
                  tier.cardClass,
                  tier.popular && "ring-1 ring-amber-300 dark:ring-amber-600"
                )}>
                {tier.popular && (
                  <span className="absolute -top-2 left-3 text-[10px] font-bold px-1.5 py-0.5 bg-amber-400 text-white rounded-full">
                    Popular
                  </span>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{tier.icon} {tier.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tier.days} days · {tier.description.split(".")[0]}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm font-bold">₹{tier.displayPrice}</span>
                    {isDone ? (
                      <span className="text-[10px] text-green-600 font-semibold">✓ Active</span>
                    ) : isCurrentActive ? (
                      <span className="text-[10px] text-muted-foreground">Running</span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-6 text-[11px] px-2"
                        onClick={() => handleBoost(tier.level)} disabled={loading !== null}>
                        {loading === tier.level ? <Loader2 className="h-3 w-3 animate-spin" /> : "Boost"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <p className="text-[10px] text-muted-foreground">Activates instantly via Razorpay.</p>
        </div>
      )}
    </div>
  )
}
