import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck, Users, MapPin, Star, CheckCircle2, Sparkles, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  { step: "01", title: "Verify your corp email", desc: "We send a 6-digit OTP to your work inbox. No passwords, no OAuth — just your email." },
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 mb-4">
      <span className="h-px w-6 bg-gradient-to-r from-brand-red-500 to-brand-yellow-500" />
      {children}
    </p>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Korpo" width={38} height={38} priority className="rounded-xl object-contain" />
            <span className="font-semibold text-xl text-foreground tracking-tight">Korpo</span>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {[
              { href: "#services", label: "Services" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#cities", label: "Cities" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group relative px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
                <span className="absolute left-3 right-3 -bottom-px h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/signin?callbackUrl=/admin" className="hidden sm:block text-xs text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1">
              Admin
            </Link>
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link href="/auth/signin?mode=register">Register</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm">
              <Link href="/auth/signin">Sign in <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        {/* Fine grid texture */}
        <div
          className="pointer-events-none absolute inset-0 -z-20 opacity-[0.4] dark:opacity-[0.25]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        {/* Ambient gradient mesh */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-brand-red-500/15 blur-[130px]" />
          <div className="absolute top-1/3 -left-32 h-[420px] w-[420px] rounded-full bg-brand-green-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full bg-brand-yellow-500/10 blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-4 py-1.5 mb-8 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-yellow-500" />
              <span className="text-sm font-medium text-foreground/90">India&apos;s First Verified Corporate Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold leading-[1.04] tracking-tight text-balance text-foreground">
              Your work ID.{" "}
              <span className="bg-gradient-to-r from-brand-red-600 via-brand-red-500 to-brand-yellow-500 bg-clip-text text-transparent">
                Your pass to everything else.
              </span>
            </h1>
            <p className="mt-7 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Buy and sell, find flatmates, share rides, get referrals — exclusively with verified colleagues from IT, MNC, banking and consulting firms.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button asChild size="xl" className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-xl shadow-foreground/10">
                <Link href="/auth/signin?mode=register">
                  <ShieldCheck className="h-5 w-5" />
                  Register with work email/ID card
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="rounded-full gap-2">
                <Link href="/auth/signin">
                  Already verified? Sign in
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-muted-foreground text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-green-600" />
              OTP verification · Gmail, Yahoo &amp; temp addresses blocked
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y-0 md:divide-x divide-border/60">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center md:px-6 first:md:pl-0 py-2">
                  <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums">{stat.value}</p>
                  <p className="text-muted-foreground text-sm mt-1.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 sm:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center"><Eyebrow>What&apos;s inside</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">6 services. One verified network.</h2>
            <p className="mt-3 text-muted-foreground text-lg">Everything you need, with people you can trust.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-4xl mx-auto items-stretch">
            {SERVICES.filter((s) => s.isActive).map((service) => {
              const Icon = iconMap[service.icon] ?? ShoppingBag
              return (
                <Link key={service.id} href="/auth/signin" className="group h-full block">
                  <div className="relative flex h-full flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]">
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-transparent to-black/[0.02] dark:to-white/[0.03]" />
                    {service.badge && (
                      <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-yellow-50 text-brand-yellow-700 dark:bg-brand-yellow-600/15 dark:text-brand-yellow-400">
                        {service.badge}
                      </span>
                    )}
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-surface to-border/40 flex items-center justify-center group-hover:scale-105 group-hover:bg-foreground group-hover:from-foreground group-hover:to-foreground group-hover:text-background transition-all duration-300">
                      <Icon className={`h-6 w-6 ${service.color} group-hover:text-inherit`} />
                    </div>
                    <div className="flex flex-col flex-1 justify-start">
                      <p className="font-semibold text-sm text-foreground leading-tight">{service.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug hidden sm:block line-clamp-2">{service.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 sm:py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center"><Eyebrow>The process</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">How Korpo works</h2>
            <p className="mt-3 text-muted-foreground">Zero fake profiles. Maximum trust. Always.</p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            <div className="hidden md:block absolute top-[27px] left-[16.5%] right-[16.5%] h-px bg-border" aria-hidden="true" />
            {howItWorks.map((item, i) => {
              const stepColor = [
                "bg-brand-red-600",
                "bg-brand-yellow-600",
                "bg-brand-green-600",
              ][i]
              return (
                <div key={item.step} className="relative h-full rounded-2xl bg-card border border-border p-8 text-center hover:shadow-lg transition-shadow duration-300">
                  <div className={`relative z-10 h-14 w-14 rounded-2xl ${stepColor} text-white flex items-center justify-center text-lg font-bold mx-auto mb-5 shadow-lg`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-24 sm:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <Eyebrow>Why Korpo</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-7 tracking-tight">Trust is the product</h2>
              <div className="space-y-5">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3.5">
                    <div className="h-5 w-5 rounded-full bg-brand-green-50 dark:bg-brand-green-600/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-green-600" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((t) => (
                <div key={t.name} className="relative bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                  <Quote className="absolute top-5 right-5 h-8 w-8 text-border" />
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-brand-yellow-500 text-brand-yellow-500" />)}
                  </div>
                  <p className="text-foreground/85 text-sm mb-4 leading-relaxed max-w-[90%]">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-yellow-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.role}</p>
                    </div>
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
          <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">Active across most Indian cities</h2>
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
            <MapPin className="h-4 w-4 text-brand-red-600" />
            New cities added as our network grows
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-28 bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-brand-red-500/10 blur-[140px]" />
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm shadow-sm p-10 sm:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Ready to join?
            </h2>
            <p className="text-muted-foreground text-lg mb-9">
              Verify your corporate email and get instant access. Zero fake profiles, zero scammers — just verified colleagues.
            </p>
            <Button asChild size="xl" className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10">
              <Link href="/auth/signin">
                Get started <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <p className="mt-5 text-muted-foreground text-sm">Free forever for core services · Premium from ₹99/month</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border text-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="Korpo" width={26} height={26} className="rounded-lg object-contain" />
                <span className="font-semibold text-lg">Korpo</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">India&apos;s first verified corporate employee marketplace.</p>
            </div>
            <div>
              <p className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground/80">Services</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {SERVICES.slice(0, 5).map((s) => (
                  <li key={s.id}><Link href="/auth/signin" className="hover:text-foreground transition-colors">{s.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground/80">Premium</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {SERVICES.slice(5).map((s) => (
                  <li key={s.id}><Link href="/auth/signin" className="hover:text-foreground transition-colors">{s.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground/80">Company</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
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
