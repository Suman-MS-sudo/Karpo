import Link from "next/link"
import { ArrowRight, ShieldCheck, Users, MapPin, Star, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SERVICES, CITIES } from "@/config/services"
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
  { name: "Priya K.", role: "Software Engineer, TCS", text: "Found my flatmate in 2 days. Knowing they're a TCS colleague made all the difference." },
  { name: "Rahul M.", role: "Analyst, Deloitte", text: "Got 3 referral requests within a week of posting. The quality is just better here." },
  { name: "Anjali S.", role: "PM, Infosys", text: "Sold my laptop in 4 hours. Verified buyers only — zero scammers, zero stress." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#1E3A5F] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-xl text-[#1E3A5F]">Korpo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="#services"     className="hover:text-[#1E3A5F] transition-colors">Services</Link>
            <Link href="#how-it-works" className="hover:text-[#1E3A5F] transition-colors">How it works</Link>
            <Link href="#cities"       className="hover:text-[#1E3A5F] transition-colors">Cities</Link>
            <Link href="/about"        className="hover:text-[#1E3A5F] transition-colors">About</Link>
            <Link href="/contact"      className="hover:text-[#1E3A5F] transition-colors">Contact</Link>
          </nav>
          <Button asChild size="sm">
            <Link href="/auth/signin">Join with work email <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#2E86AB] text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge className="bg-white/10 text-white border-white/20 mb-6 text-sm px-3 py-1">
              🇮🇳 India&apos;s First Verified Corporate Marketplace
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Your work ID.{" "}
              <span className="text-[#7DD3F8]">Your pass to everything else.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl">
              Buy and sell, find flatmates, share rides, get referrals — exclusively with verified colleagues from IT, MNC, banking and consulting firms.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="xl" className="bg-white text-[#1E3A5F] hover:bg-blue-50 gap-2">
                <Link href="/auth/signin">
                  <ShieldCheck className="h-5 w-5" />
                  Sign in with work email →
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-blue-200 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              OTP verification · Gmail, Yahoo &amp; temp addresses blocked
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">10 services. One verified network.</h2>
            <p className="mt-3 text-gray-600 text-lg">Everything you need, with people you can trust.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {SERVICES.filter((s) => s.isActive).map((service) => {
              const Icon = iconMap[service.icon] ?? ShoppingBag
              return (
                <Link key={service.id} href="/auth/signin" className="group">
                  <div className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center hover:shadow-md transition-all duration-200 hover:-translate-y-1 ${service.bgColor} ${service.borderColor}`}>
                    {service.badge && (
                      <Badge variant={service.badge === "Premium" ? "premium" : "default"} className="text-[10px] px-1.5 py-0">
                        {service.badge}
                      </Badge>
                    )}
                    <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className={`h-6 w-6 ${service.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 leading-tight">{service.name}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-snug hidden sm:block">{service.description.split(" ").slice(0, 6).join(" ")}…</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">How Korpo works</h2>
            <p className="mt-3 text-gray-600">Zero fake profiles. Maximum trust. Always.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-[#1E3A5F] text-white flex items-center justify-center text-xl font-bold mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-20 bg-gradient-to-br from-[#1E3A5F] to-[#2E86AB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Trust is the product</h2>
              <div className="space-y-4">
                {[
                  "Every user verifies via OTP sent to their corporate inbox — no fake signups possible",
                  "Domain whitelist ensures only approved companies get access",
                  "No phone numbers or emails shown publicly — all contact via in-app messaging",
                  "Reputation scores and reviews after every transaction",
                  "Reported listings reviewed within 24 hours",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#7DD3F8] shrink-0 mt-0.5" />
                    <p className="text-blue-100">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-blue-100 text-sm italic mb-3">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-blue-300 text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[#1E3A5F] mb-6">Active in your city</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CITIES.map((city) => (
              <div key={city} className="flex items-center gap-2 bg-surface border border-gray-200 rounded-full px-5 py-2.5 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 text-[#2E86AB]" />
                {city}
              </div>
            ))}
          </div>
          <p className="mt-4 text-gray-500 text-sm">More cities launching soon</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-4">
            Ready to join?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Sign in with your corporate email and get instant access. Zero fake profiles, zero scammers — just verified colleagues.
          </p>
          <Button asChild size="xl">
            <Link href="/auth/signin">
              Join with your work email <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 text-gray-500 text-sm">Free forever for core services · Premium from ₹99/month</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="font-bold text-lg">Korpo</span>
              </div>
              <p className="text-blue-200 text-sm">India&apos;s first verified corporate employee marketplace.</p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Services</p>
              <ul className="space-y-2 text-sm text-blue-200">
                {SERVICES.slice(0, 5).map((s) => (
                  <li key={s.id}><Link href="/auth/signin" className="hover:text-white transition-colors">{s.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Premium</p>
              <ul className="space-y-2 text-sm text-blue-200">
                {SERVICES.slice(5).map((s) => (
                  <li key={s.id}><Link href="/auth/signin" className="hover:text-white transition-colors">{s.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Company</p>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link href="/about"   className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#"        className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#"        className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/auth/signin?callbackUrl=/admin" className="hover:text-white transition-colors opacity-50 hover:opacity-100 text-xs">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-blue-300 text-sm">
            <p>© 2024 Korpo. All rights reserved. Made with ❤️ for India&apos;s corporate community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
