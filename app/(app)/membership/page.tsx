"use client"
import { useSession } from "next-auth/react"
import {
  Crown, Check, Zap, TrendingUp, Star, Shield, Users, MessageSquare,
  Gift, GraduationCap, Tag, ArrowUpCircle, ChevronDown, ChevronUp,
  Rocket, Eye, BadgeCheck, Infinity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import Link from "next/link"

// ── Benefit data ───────────────────────────────────────────────────────────────

const FREE_PERKS = [
  { icon: Users,       text: "Buy & Sell Marketplace — up to 5 active listings" },
  { icon: Shield,      text: "Rental & Flatmate Hub — post & browse rentals" },
  { icon: MessageSquare, text: "Job Referrals — post & apply for referrals" },
  { icon: ArrowUpCircle, text: "Corporate Carpool — offer & join rides" },
  { icon: Star,        text: "Skill Marketplace — list & hire skills" },
  { icon: Users,       text: "Events & Communities — RSVP & join groups" },
  { icon: MessageSquare, text: "In-app Messaging — unlimited messages" },
  { icon: BadgeCheck,  text: "Verified corporate profile" },
]

const PREMIUM_PERKS = [
  {
    icon: Rocket,
    title: "Auto-Boost on Every Listing",
    desc:  "Your listings appear at the top of every browse feed — marketplace, rentals, referrals, carpool, and skills. No manual boost needed, ever.",
    highlight: true,
  },
  {
    icon: Infinity,
    title: "Unlimited Listings",
    desc:  "Post as many listings as you want across all services. Free plan is capped at 5 active marketplace listings.",
  },
  {
    icon: Tag,
    title: "Employee Deals",
    desc:  "Exclusive discounts from curated brands — gadgets, food, travel, subscriptions and more.",
  },
  {
    icon: GraduationCap,
    title: "Learning Hub",
    desc:  "Access workshops, mentoring sessions and certification prep from verified peer professionals.",
  },
  {
    icon: Shield,
    title: "Concierge Services",
    desc:  "Tax filing, legal advice, insurance guidance and financial planning from vetted experts.",
  },
  {
    icon: Gift,
    title: "Employee Benefits",
    desc:  "Salary advances, personal loans, travel packages and investment products — tailored for salaried professionals.",
  },
  {
    icon: Crown,
    title: "Premium Profile Badge",
    desc:  "A visible Premium crown on your profile and all your listings, signalling trust and priority to buyers and hirers.",
  },
  {
    icon: Eye,
    title: "Featured Listing Strip",
    desc:  "All your listings get a distinctive amber gradient strip and golden border so they stand out visually in every feed.",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    desc:  "See view counts, offer rates and engagement trends across all your active listings.",
  },
  {
    icon: MessageSquare,
    title: "Priority Support",
    desc:  "Issues and disputes resolved with priority response from the Korpo team.",
  },
]

const FAQS = [
  { q: "What does 'Auto-Boost' actually mean?", a: "When you post any listing (buy/sell, rental, referral, carpool, or skill), it is automatically marked as boosted. All browse pages sort boosted listings first, so your content appears before free-plan posts." },
  { q: "Can I still use all services for free?", a: "Yes — every core service is free. Premium gives you boostings, priority placement, and exclusive access to Deals, Learning Hub, Concierge, and Employee Benefits. Free users can use everything else with no hard limits except the 5-listing cap on marketplace." },
  { q: "Can I cancel anytime?", a: "Absolutely. You can cancel from your account settings at any time. Your premium features remain active until the end of the current billing month." },
  { q: "Is my payment information secure?", a: "Yes. Payments are processed by Razorpay, a PCI-DSS certified payment gateway. Korpo never stores your card details." },
  { q: "Do my old listings get boosted when I upgrade?", a: "Auto-boost applies to listings created after your upgrade. You can re-post older listings or use manual boost for existing ones." },
]

// ── Razorpay handler ───────────────────────────────────────────────────────────

async function openRazorpay(setLoading: (b: boolean) => void) {
  setLoading(true)
  try {
    const res  = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "MEMBERSHIP" }) })
    const data = await res.json()

    const options = {
      key:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount:       data.amount,
      currency:     "INR",
      name:         "Korpo Premium",
      description:  "Monthly Premium Membership",
      order_id:     data.orderId,
      handler:      async (response: Record<string, string>) => {
        await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) })
        window.location.reload()
      },
      theme: { color: "#1E3A5F" },
    }

    const win = window as Window & { Razorpay?: new (opts: typeof options) => { open(): void } }
    if (win.Razorpay) {
      new win.Razorpay(options).open()
    } else {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => { new win.Razorpay!(options).open() }
      document.head.appendChild(script)
    }
  } finally {
    setLoading(false)
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MembershipPage() {
  const { data: session } = useSession()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const [loading,    setLoading]    = useState(false)
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null)

  if (isPremium) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Premium status hero */}
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-700 rounded-3xl p-8 text-center overflow-hidden mb-8">
          <div className="absolute -top-8 -right-8 h-32 w-32 bg-amber-200/30 dark:bg-amber-600/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 h-20 w-20 bg-orange-200/30 dark:bg-orange-600/10 rounded-full" />
          <div className="relative">
            <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">You're Premium!</h1>
            <p className="text-muted-foreground">Your listings are auto-boosted and all premium features are active.</p>
            <Badge variant="premium" className="mt-4 text-sm px-4 py-1.5">✦ Premium Member</Badge>
          </div>
        </div>

        {/* Active benefits grid */}
        <h2 className="font-semibold text-lg mb-4">Your Active Benefits</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {PREMIUM_PERKS.map((p) => (
            <div key={p.title} className={`rounded-2xl border p-4 flex gap-3 ${p.highlight ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${p.highlight ? "bg-amber-100 dark:bg-amber-900/40" : "bg-muted"}`}>
                <p.icon className={`h-4 w-4 ${p.highlight ? "text-amber-600 dark:text-amber-400" : "text-primary-500"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/deals",     icon: Tag,           label: "Deals"      },
            { href: "/learning",  icon: GraduationCap, label: "Learning"   },
            { href: "/concierge", icon: Shield,         label: "Concierge"  },
            { href: "/benefits",  icon: Gift,           label: "Benefits"   },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors text-center">
              <l.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Crown className="h-4 w-4" />Korpo Premium
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Everything is free.<br />Premium makes you first.</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          All core services are free for every verified employee. Premium unlocks auto-boosting across every service — your listings always appear first — plus four exclusive premium sections.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

        {/* Free */}
        <div className="bg-card border border-border rounded-2xl p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Free</p>
          <div className="flex items-baseline gap-1 mb-1">
            <p className="text-4xl font-bold">₹0</p>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Full access to all core services, always.</p>
          <ul className="space-y-3 mb-8">
            {FREE_PERKS.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>Current Plan</Button>
        </div>

        {/* Premium */}
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/30 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-7 overflow-hidden">
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-amber-200/30 dark:bg-amber-600/10 rounded-full" />
          <div className="absolute top-4 right-4">
            <Badge variant="premium" className="text-xs px-2 py-0.5">⭐ Most Popular</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">Premium</p>
          <div className="flex items-baseline gap-1 mb-1">
            <p className="text-4xl font-bold text-amber-700 dark:text-amber-400">₹99</p>
            <span className="text-amber-600/70 dark:text-amber-400/70 text-sm">/month</span>
          </div>
          <p className="text-amber-700 dark:text-amber-400 text-sm mb-6">Everything free, plus you always come first.</p>
          <ul className="space-y-3 mb-8">
            {PREMIUM_PERKS.map((p) => (
              <li key={p.title} className="flex items-start gap-2.5 text-sm">
                <Zap className={`h-4 w-4 shrink-0 mt-0.5 ${p.highlight ? "text-amber-500" : "text-amber-500"}`} />
                <span className={p.highlight ? "font-semibold text-amber-800 dark:text-amber-300" : ""}>{p.title}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="premium" className="w-full text-base py-6"
            onClick={() => openRazorpay(setLoading)}
            disabled={loading}
          >
            {loading ? "Loading…" : <><Crown className="h-4 w-4" />Upgrade to Premium — ₹99/mo</>}
          </Button>
          <p className="text-xs text-center text-amber-700/70 dark:text-amber-400/70 mt-3">Cancel anytime. No questions asked.</p>
        </div>
      </div>

      {/* How boosting works */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-2">How Auto-Boost Works</h2>
        <p className="text-muted-foreground text-center text-sm mb-8">Premium members' listings are always sorted first. Here's what it means in each service:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { service: "Buy & Sell",      color: "blue",   icon: "🛒", detail: "Your items appear above all free listings in every search and category browse" },
            { service: "Rentals",         color: "emerald",icon: "🏠", detail: "Your rental or PG appears at the top of every city and type filter" },
            { service: "Job Referrals",   color: "violet", icon: "💼", detail: "Your referral posting is pinned first in the job board for maximum visibility" },
            { service: "Carpool",         color: "orange", icon: "🚗", detail: "Your route is shown first to colleagues looking for a commute match" },
            { service: "Skill Marketplace", color: "cyan", icon: "⚡", detail: "Your skill listing is featured with an amber border and appears before free listings" },
            { service: "All Future Services", color: "amber", icon: "✨", detail: "Auto-boost automatically extends to every new service added to Korpo" },
          ].map((item) => (
            <div key={item.service} className={`rounded-2xl p-5 bg-${item.color}-50 dark:bg-${item.color}-950/20 border border-${item.color}-200 dark:border-${item.color}-800`}>
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="font-semibold text-sm mb-1">{item.service}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature detail table */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">Feature Comparison</h2>
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 bg-muted/50 text-sm font-semibold border-b border-border">
            <div className="p-4">Feature</div>
            <div className="p-4 text-center border-l border-border">Free</div>
            <div className="p-4 text-center border-l border-border text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20">Premium</div>
          </div>
          {[
            { feature: "All core services",               free: "✓",        premium: "✓" },
            { feature: "Marketplace listings",            free: "5 max",    premium: "Unlimited" },
            { feature: "Auto-boost (always first)",       free: "✗",        premium: "✓ All services" },
            { feature: "Featured listing strip",          free: "✗",        premium: "✓ Amber border" },
            { feature: "Premium profile crown",           free: "✗",        premium: "✓" },
            { feature: "Employee Deals",                  free: "✗",        premium: "✓" },
            { feature: "Learning Hub",                    free: "✗",        premium: "✓" },
            { feature: "Concierge Services",              free: "✗",        premium: "✓" },
            { feature: "Employee Benefits",               free: "✗",        premium: "✓" },
            { feature: "Priority support",                free: "Standard", premium: "Priority" },
          ].map((row, i) => (
            <div key={i} className={`grid grid-cols-3 text-sm border-b border-border last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
              <div className="p-4 font-medium">{row.feature}</div>
              <div className={`p-4 text-center border-l border-border ${row.free === "✗" ? "text-muted-foreground/50" : "text-foreground"}`}>{row.free}</div>
              <div className={`p-4 text-center border-l border-border bg-amber-50/50 dark:bg-amber-950/10 font-semibold ${row.premium.startsWith("✗") ? "text-muted-foreground/50" : "text-amber-700 dark:text-amber-400"}`}>{row.premium}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-border rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold hover:bg-muted/40 transition-colors"
                onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
              >
                {faq.q}
                {openFaqIdx === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
              {openFaqIdx === i && (
                <div className="px-5 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-10 text-center overflow-hidden max-w-3xl mx-auto">
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 bg-white/10 rounded-full" />
        <div className="relative">
          <Crown className="h-12 w-12 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Start appearing first today</h2>
          <p className="text-white/80 mb-6">Join premium and let your listings reach colleagues before anyone else's.</p>
          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-white/90 font-bold px-8"
            onClick={() => openRazorpay(setLoading)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Upgrade — ₹99/month"}
          </Button>
          <p className="text-white/60 text-xs mt-3">No commitment. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}
