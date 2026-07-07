import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck, Users, MapPin, Star, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SERVICES } from "@/config/services"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag,
  GraduationCap, Shield, Gift,
} from "lucide-react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift,
}

const stats = [
  { value: "50,000+", label: "Verified Employees" },
  { value: "200+", label: "Companies Onboarded" },
  { value: "4", label: "Cities Active" },
  { value: "0", label: "Fake Profiles" },
]

const howItWorks = [
  { step: "01", title: "Enter your corporate email", desc: "We send a 6-digit OTP to your work inbox. No passwords, no OAuth — just your email." },
  { step: "02", title: "Get auto-verified", desc: "Your corporate domain is matched against our approved company list. Instant trust." },
  { step: "03", title: "Access everything", desc: "Buy/sell, find flatmates, get referrals, share rides and more — with verified colleagues." },
]

const testimonials = [
  { name: "Priya K.", role: "Software Engineer", text: "Found my flatmate in 2 days. Knowing they're a verified colleague made all the difference." },
  { name: "Rahul M.", role: "Analyst", text: "Got 3 referral requests within a week of posting. The quality is just better here." },
  { name: "Anjali S.", role: "Product Manager", text: "Sold my laptop in 4 hours. Verified buyers only — zero scammers, zero stress." },
]

const trustPoints = [
  "Every user verifies via OTP sent to their corporate inbox — no fake signups possible",
  "Domain whitelist ensures only approved companies get access",
  "No phone numbers or emails shown publicly — all contact via in-app messaging",
  "Reputation scores and reviews after every transaction",
  "Reported listings reviewed within 24 hours",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-yellow-300 backdrop-blur-sm border-b border-yellow-400/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Korpo" width={44} height={44} priority className="rounded-lg object-contain" />
            <span className="font-bold text-2xl text-gray-900">Korpo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
            <Link href="#services"     className="hover:text-gray-900 transition-colors">Services</Link>
            <Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="#cities"       className="hover:text-gray-900 transition-colors">Cities</Link>
            <Link href="/about"        className="hover:text-gray-900 transition-colors">About</Link>
            <Link href="/contact"      className="hover:text-gray-900 transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin?callbackUrl=/admin" className="text-xs text-gray-700/80 hover:text-gray-900 transition-colors px-2 py-1">
              Admin
            </Link>
            <Button asChild size="sm" className="bg-brand-red-600 hover:bg-brand-red-700 text-white shadow-sm">
              <Link href="/auth/signin">Join with work email <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        {/* Logo watermark — bled off the right edge of the viewport, only the left half visible */}
        <div
          className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 right-0 block w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] lg:w-[640px] lg:h-[640px] opacity-[0.14] dark:opacity-[0.20] pointer-events-none select-none"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-transparent.png"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge className="bg-brand-green-50 text-brand-green-600 border-brand-green-100 mb-6 text-sm px-3 py-1 dark:bg-brand-green-600/10 dark:text-brand-green-400 dark:border-brand-green-600/20">
              🇮🇳 India&apos;s First Verified Corporate Marketplace
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance text-foreground">
              Your work ID.{" "}
              <span className="text-brand-red-600">Your pass to everything else.</span>
            </h1>
            {/* Tri-color underline accent, nodding to the logo's palette */}
            <div className="mt-5 h-1 w-28 rounded-full bg-gradient-to-r from-brand-red-500 via-brand-yellow-500 to-brand-green-500" />
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl">
              Buy and sell, find flatmates, share rides, get referrals — exclusively with verified colleagues from IT, MNC, banking and consulting firms.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="xl" className="bg-brand-red-600 hover:bg-brand-red-700 text-white gap-2 uppercase tracking-wide shadow-sm">
                <Link href="/auth/signin">
                  <ShieldCheck className="h-5 w-5" />
                  Sign in with work email
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-muted-foreground text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-green-600" />
              OTP verification · Gmail, Yahoo &amp; temp addresses blocked
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-surface border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">6 services. One verified network.</h2>
            <p className="mt-3 text-muted-foreground text-lg">Everything you need, with people you can trust.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {SERVICES.filter((s) => s.isActive).map((service) => {
              const Icon = iconMap[service.icon] ?? ShoppingBag
              return (
                <Link key={service.id} href="/auth/signin" className="group">
                  <div className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border bg-card text-center hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    {service.badge && (
                      <Badge variant={service.badge === "Premium" ? "premium" : "default"} className="text-[10px] px-1.5 py-0">
                        {service.badge}
                      </Badge>
                    )}
                    <div className="h-12 w-12 rounded-xl bg-background shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className={`h-6 w-6 ${service.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-tight">{service.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug hidden sm:block">{service.description.split(" ").slice(0, 6).join(" ")}…</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How Korpo works</h2>
            <p className="mt-3 text-muted-foreground">Zero fake profiles. Maximum trust. Always.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => {
              const stepColor = [
                "bg-brand-red-600",
                "bg-brand-yellow-600",
                "bg-brand-green-600",
              ][i]
              return (
                <div key={item.step} className="text-center">
                  <div className={`h-16 w-16 rounded-2xl ${stepColor} text-white flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-sm`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Trust is the product</h2>
              <div className="space-y-4">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-green-600 shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-brand-yellow-500 text-brand-yellow-500" />)}
                  </div>
                  <p className="text-foreground/80 text-sm italic mb-3">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Active across most Indian cities</h2>
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 text-sm font-medium text-foreground">
            <MapPin className="h-4 w-4 text-brand-red-600" />
            New cities added as our network grows
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to join?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Sign in with your corporate email and get instant access. Zero fake profiles, zero scammers — just verified colleagues.
          </p>
          <Button asChild size="xl" className="bg-brand-red-600 hover:bg-brand-red-700 text-white uppercase tracking-wide shadow-sm">
            <Link href="/auth/signin">
              Join with your work email <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 text-muted-foreground text-sm">Free forever for core services · Premium from ₹99/month</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border text-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="Korpo" width={28} height={28} className="rounded-lg object-contain" />
                <span className="font-bold text-lg">Korpo</span>
              </div>
              <p className="text-muted-foreground text-sm">India&apos;s first verified corporate employee marketplace.</p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Services</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {SERVICES.slice(0, 5).map((s) => (
                  <li key={s.id}><Link href="/auth/signin" className="hover:text-foreground transition-colors">{s.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Premium</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {SERVICES.slice(5).map((s) => (
                  <li key={s.id}><Link href="/auth/signin" className="hover:text-foreground transition-colors">{s.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about"   className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="#"        className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#"        className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/auth/signin?callbackUrl=/admin" className="hover:text-foreground transition-colors opacity-50 hover:opacity-100 text-xs">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground text-sm">
            <p>© 2024 Korpo. All rights reserved. Made with ❤️ for India&apos;s corporate community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
