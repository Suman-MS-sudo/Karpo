import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, ShieldCheck, Users, MapPin, Star, Sparkles, Quote,
  FolderCheck, Gauge, Download, UserPlus, Compass, TrendingUp, Lock, Search,
  Bell, MessageSquare, BadgeCheck, Clock, Building2, PlugZap, Zap,
  Layers, MessageCircle, Briefcase, Home as HomeIcon, Car, GraduationCap,
  Gift, ShoppingBag, Wrench, Tag, Heart, Target, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SERVICES } from "@/config/services"
import { HeroNetworkBackground } from "@/components/home/HeroNetworkBackground"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { ContactForm } from "@/components/shared/ContactForm"
import { prisma } from "@/lib/prisma"

const heroStats = [
  { value: "50,000+", label: "Verified employees" },
  { value: "200+",    label: "Companies onboarded" },
  { value: "4",       label: "Cities active" },
]

const quickSteps = [
  { icon: Download,   label: "Verify corp email" },
  { icon: UserPlus,   label: "Get instant access" },
  { icon: Compass,    label: "Explore services" },
  { icon: TrendingUp, label: "Connect & transact" },
]

const showcaseSections = [
  {
    eyebrow: "Buy & Sell",
    title: "Stay focused, wherever you work",
    desc: "List electronics, furniture, vehicles and more. Every buyer and seller is a verified colleague — no scammers, no strangers off the street.",
    cta: "Browse marketplace",
    img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80&auto=format&fit=crop",
  },
  {
    eyebrow: "Rentals & Referrals",
    title: "Share what matters at the right time",
    desc: "Search PGs and flats near your office, or get your resume in front of an employee already on the inside. Same trusted network, both ways.",
    cta: "See open listings",
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80&auto=format&fit=crop",
  },
  {
    eyebrow: "Carpool & Community",
    title: "Collaborate from anywhere",
    desc: "Share a ride with coworkers heading your way, join events, and build a network that follows you across every company on Korpo.",
    cta: "Join the network",
    img: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80&auto=format&fit=crop",
  },
]

const featureGrid = [
  { icon: Lock,        title: "Protect your data",     desc: "OTP-only auth, no passwords stored, ever." },
  { icon: Search,      title: "Super smart search",    desc: "Typo-tolerant search across every module." },
  { icon: ShieldCheck, title: "Control everything",    desc: "Approve, hide or report any listing instantly." },
  { icon: Users,       title: "Work better together",  desc: "Reputation scores keep every interaction honest." },
  { icon: Clock,       title: "24/7 live support",     desc: "Reports reviewed and actioned within a day." },
  { icon: Compass,     title: "City-first discovery",  desc: "See what's near your office, not just your inbox." },
  { icon: Layers,      title: "Workflow builder",      desc: "Post once, manage every reply from one inbox." },
  { icon: MessageCircle, title: "Bring your team in",  desc: "Invite coworkers and grow the network together." },
]

const integrations = [
  { icon: Briefcase,      color: "text-violet-600 dark:text-violet-400" },
  { icon: HomeIcon,       color: "text-emerald-600 dark:text-emerald-400" },
  { icon: ShoppingBag,    color: "text-blue-600 dark:text-blue-400" },
  { icon: Car,            color: "text-orange-600 dark:text-orange-400" },
  { icon: GraduationCap,  color: "text-pink-600 dark:text-pink-400" },
  { icon: Gift,           color: "text-rose-600 dark:text-rose-400" },
  { icon: Wrench,         color: "text-cyan-600 dark:text-cyan-400" },
  { icon: Tag,            color: "text-amber-600 dark:text-amber-400" },
  { icon: ShieldCheck,    color: "text-indigo-600 dark:text-indigo-400" },
  { icon: Bell,           color: "text-lime-600 dark:text-lime-400" },
]

const productivitySteps = [
  { icon: Zap,     title: "Use a simple way",       desc: "One sign-in for every service on Korpo." },
  { icon: Layers,  title: "A productivity platform", desc: "Six modules, one verified network." },
  { icon: Clock,   title: "Save your time",         desc: "Verified colleagues only — no vetting needed." },
]

const aboutStats = [
  { value: "50,000+", label: "Verified employees" },
  { value: "200+",    label: "Companies onboarded" },
  { value: "10+",     label: "Services on platform" },
  { value: "0",       label: "Fake profiles" },
]

const aboutValues = [
  { icon: ShieldCheck, title: "Trust first",        desc: "Every member is verified via their corporate email. No exceptions, no shortcuts." },
  { icon: Users,       title: "Community driven",   desc: "We build the features our members ask for, and measure success by their satisfaction." },
  { icon: Heart,       title: "Privacy respected",  desc: "Phone numbers and personal details stay private — all contact happens in-app." },
  { icon: Target,      title: "Quality over quantity", desc: "A smaller, verified network beats a massive, fake one every time." },
]

const contactMethods = [
  { icon: MessageSquare, title: "Email us",       desc: "General enquiries & partnerships", value: "collaboration@korpo.in" },
  { icon: Bell,          title: "Support",        desc: "Account issues & technical help",  value: "support@korpo.in" },
  { icon: Clock,         title: "Response time",  desc: "We typically respond within",      value: "24 business hours" },
  { icon: MapPin,        title: "Based in",       desc: "Built and operated from",          value: "Chennai, India" },
]

const contactFaqs = [
  { q: "How do I get my company added to Korpo?", a: "Request it from the sign-in page. We review company domain requests within 1–2 business days." },
  { q: "Can I use a personal Gmail or Yahoo account?", a: "No — Korpo is exclusively for verified corporate emails. Free email providers are blocked by design." },
  { q: "How do I report a listing or a user?", a: "Every listing has a Report button for signed-in users. Reports are reviewed within 24 hours." },
]

const testimonials = [
  { name: "Priya K.", role: "Software Engineer", text: "Found my flatmate in 2 days. Knowing they're a verified colleague made all the difference." },
  { name: "Rahul M.", role: "Analyst", text: "Got 3 referral requests within a week of posting. The quality is just better here." },
  { name: "Anjali S.", role: "Product Manager", text: "Sold my laptop in 4 hours. Verified buyers only — zero scammers, zero stress." },
]

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] mb-4 ${dark ? "text-white/70" : "text-muted-foreground/80"}`}>
      <span className="h-px w-6 bg-gradient-to-r from-primary to-accent" />
      {children}
    </p>
  )
}

// Public marketing page — keep it statically served for anonymous visitors.
// Re-fetch the verified-user count at most once an hour instead of on every
// request (force-dynamic would hit Prisma on every anonymous page view).
export const revalidate = 3600

export default async function LandingPage() {
  const verifiedUserCount = await prisma.user.count({ where: { isVerified: true } })
  const verifiedEmployeesLabel = verifiedUserCount > 0 ? `${verifiedUserCount.toLocaleString("en-IN")}+` : "0"

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
              { href: "#showcase", label: "What you can do" },
              { href: "#integrations", label: "Integrations" },
              { href: "#about", label: "About" },
              { href: "#contact", label: "Contact" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="group relative px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
                <span className="absolute left-3 right-3 -bottom-px h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 sm:px-3 py-1.5">
              Login
            </Link>
            <Button asChild size="sm" className="rounded-full shadow-sm">
              <Link href="/auth/signin?mode=register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero copy */}
      <section className="relative overflow-hidden bg-background pt-16 pb-10 sm:pt-20">
        {/* Full-bleed background photo */}
        <div className="absolute inset-0 -z-30" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2400&q=80&auto=format&fit=crop"
            alt="Abstract office workspace background"
            fill
            priority
            className="object-cover opacity-[0.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </div>
        {/* Animated background mesh, faded into the page */}
        <div
          className="pointer-events-none absolute inset-0 -z-20 opacity-[0.25] animate-grid-pan"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        {/* Ambient gradient glow, slowly drifting */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[130px] animate-blob-float" />
          <div className="absolute top-1/3 -left-32 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[120px] animate-blob-float-slow" />
        </div>
        {/* Connected-network canvas — nodes drift and link, echoing "verified network" */}
        <div className="pointer-events-none absolute inset-0 -z-10 h-[560px]" aria-hidden="true">
          <HeroNetworkBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 backdrop-blur-sm px-4 py-1.5 mb-7">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/90">Your work ID. Your pass to everything else.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-balance text-foreground">
            The best way to{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient-x_6s_ease_infinite]">
              organize your network
            </span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Organize your whole professional network in one place — buy and sell, find flatmates, share rides, and get referrals, exclusively with verified colleagues from IT, MNC, banking and consulting firms.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-7 shadow-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all">
              <Link href="/auth/signin?mode=register">Signup</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-xl px-9 text-base bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5 transition-all">
              <Link href="/auth/signin">
                Login
              </Link>
            </Button>
          </div>

          <p className="mt-14 text-xs font-medium uppercase tracking-wide text-muted-foreground">Number of verified employees are using Korpo</p>
        </div>

        {/* Dark hero banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/20 border border-border shadow-2xl shadow-primary/5 min-h-[340px] sm:min-h-[420px]">
            <Image
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80&auto=format&fit=crop"
              alt="Modern office workspace"
              fill
              priority
              className="object-cover opacity-30"
            />
            <div className="absolute -top-16 right-0 h-72 w-72 rounded-full bg-primary/30 blur-[110px] animate-blob-float" aria-hidden="true" />
            <div className="absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-accent/25 blur-[120px] animate-blob-float-slow" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
            <div className="relative flex flex-col justify-center h-full p-8 sm:p-14 max-w-md">
              <p className="text-foreground font-bold text-2xl sm:text-3xl tracking-tight">Keeping it all together</p>
              <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
                One verified network for everything you need at work — and outside it. No fake profiles, no strangers, ever.
              </p>
              <Button asChild size="lg" className="mt-7 rounded-xl w-fit">
                <Link href="/auth/signin?mode=register">Register</Link>
              </Button>
            </div>
            <div className="absolute top-8 right-8 hidden sm:flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg animate-blob-float-slow">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">OTP Verified</span>
            </div>
            <div className="absolute bottom-8 right-8 hidden sm:flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg animate-blob-float-slow" style={{ animationDelay: "-6s" }}>
              <Users className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-foreground">{verifiedEmployeesLabel} members</span>
            </div>
          </div>
        </div>

        {/* Split-color stat band */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 sm:grid-cols-3">
            {heroStats.map((stat, i) => (
              <div
                key={stat.label}
                className={`px-8 py-8 text-center ${i === 1 ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"}`}
              >
                <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                  {stat.label === "Verified employees" ? verifiedEmployeesLabel : stat.value}
                </p>
                <p className="text-xs sm:text-sm mt-1.5 opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Icon strip: fast, simple, effortless */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center"><Eyebrow>Get set up in minutes</Eyebrow></div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-12">Fast, simple &amp; effortless.</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {quickSteps.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-surface border border-border flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <span className="text-[10px] font-semibold text-muted-foreground/50 tracking-widest">STEP {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="relative py-20 sm:py-24 bg-surface overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 h-[380px] w-[380px] rounded-full bg-primary/10 blur-[120px] animate-blob-float-slow" />
          <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-accent/10 blur-[110px] animate-blob-float" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center"><Eyebrow>What&apos;s inside</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">6 services. One verified network.</h2>
            <p className="mt-3 text-muted-foreground text-lg">Everything you need, with people you can trust.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-4xl mx-auto items-stretch">
            {SERVICES.filter((s) => s.isActive).map((service) => (
              <Link key={service.id} href="/auth/signin" className="group h-full block">
                <div className="relative flex h-full flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]">
                  {service.badge && (
                    <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {service.badge}
                    </span>
                  )}
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-surface to-border/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground transition-all duration-300">
                    <BadgeCheck className={`h-6 w-6 ${service.color} group-hover:text-inherit`} />
                  </div>
                  <div className="flex flex-col flex-1 justify-start">
                    <p className="font-semibold text-sm text-foreground leading-tight">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug hidden sm:block line-clamp-2">{service.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase — 3 stacked photo(left)/text(right) rows */}
      <section id="showcase" className="relative py-24 sm:py-28 bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/4 -left-20 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[130px] animate-blob-float" />
          <div className="absolute bottom-1/4 -right-20 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[130px] animate-blob-float-slow" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center"><Eyebrow>Inside the app</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">See what you can do in one app</h2>
          </div>
          <div className="space-y-20 lg:space-y-28">
            {showcaseSections.map((s) => (
              <div key={s.title} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className="group relative rounded-[1.75rem] overflow-hidden bg-slate-900 aspect-[5/4] shadow-xl">
                  <Image src={s.img} alt={s.title} fill className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                  <div className="absolute top-5 left-5 flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-3 py-2 shadow-lg">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">Verified colleagues only</span>
                  </div>
                </div>
                <div>
                  <Eyebrow>{s.eyebrow}</Eyebrow>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-7 max-w-md">{s.desc}</p>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/auth/signin">{s.cta} <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History / search — light card, image right */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-card border border-border shadow-sm overflow-hidden grid lg:grid-cols-2 items-center">
            <div className="p-10 sm:p-14">
              <Eyebrow>Full history</Eyebrow>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">History you can see and search</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
                Every listing, referral, ride and message stays searchable — so you never lose track of a conversation or a deal.
              </p>
              <Link href="/auth/signin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="group relative aspect-[5/3] lg:aspect-auto lg:h-full min-h-[260px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80&auto=format&fit=crop"
                alt="Searchable history"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 sm:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center"><Eyebrow>Why Korpo</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Trust is the product</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">Every feature exists to keep the network honest, fast and useful.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featureGrid.map((f) => (
              <div key={f.title} className="rounded-2xl bg-card border border-border p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground mb-1.5">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="relative py-24 sm:py-28 bg-surface overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 right-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[120px] animate-blob-float" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow>Everything connects</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">Powerful integrations</h2>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Every module on Korpo shares one verified identity — sign in once and every service just works.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-4 max-w-md lg:ml-auto">
            {integrations.map((it, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center hover:-translate-y-1.5 hover:scale-110 hover:shadow-md transition-all duration-300">
                <it.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${it.color}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About — condensed on-page version of the story, mirrors the /about page */}
      <section id="about" className="relative py-24 sm:py-28 bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/3 h-[380px] w-[380px] rounded-full bg-primary/10 blur-[120px] animate-blob-float-slow" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex justify-center"><Eyebrow>Our story</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Built for people who show up with a badge every day</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              Korpo started with a simple question: why trust a stranger online when you already trust the colleague sitting two floors above you?
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto mb-16">
            {aboutStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.label === "Verified employees" ? verifiedEmployeesLabel : stat.value}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {aboutValues.map((v) => (
              <div key={v.title} className="rounded-2xl bg-card border border-border p-6">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground mb-1.5">{v.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your busy life deserves this */}
      <section className="py-24 sm:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="group relative rounded-[1.75rem] overflow-hidden bg-slate-900 aspect-[5/4] shadow-xl order-2 lg:order-1">
            <Image
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80&auto=format&fit=crop"
              alt="Desk workspace"
              fill
              className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>Wherever you are</Eyebrow>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">Your busy life deserves this</h3>
            <p className="text-muted-foreground leading-relaxed mb-7 max-w-md">
              We're a growing family of 50,000+ designers and makers from around the world, always ready to help.
            </p>
            <Button asChild className="rounded-full">
              <Link href="/auth/signin"><PlugZap className="h-4 w-4" />Launch Korpo now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Never forget anything */}
      <section className="py-24 sm:py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="group relative rounded-[1.75rem] overflow-hidden bg-slate-900 aspect-[5/4] shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=1200&q=80&auto=format&fit=crop"
              alt="Notebook and calendar on desk"
              fill
              className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          </div>
          <div>
            <Eyebrow>Always in reach</Eyebrow>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">Never forget anything, ever again</h3>
            <p className="text-muted-foreground leading-relaxed mb-7 max-w-md">
              Notifications, reminders and saved listings keep every deal, ride and referral on track — even weeks later.
            </p>
            <Link href="/auth/signin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
              Read more <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Productivity ring */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-card border border-border shadow-sm p-10 sm:p-14 grid md:grid-cols-[auto,1fr] gap-10 md:gap-16 items-center">
            <div
              className="mx-auto h-40 w-40 rounded-full shrink-0"
              style={{ background: "conic-gradient(hsl(var(--primary)) 0% 78%, hsl(var(--border)) 78% 100%)" }}
            >
              <div className="h-full w-full flex items-center justify-center">
                <div className="h-28 w-28 rounded-full bg-card flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">78%</span>
                  <span className="text-[10px] text-muted-foreground">faster hiring</span>
                </div>
              </div>
            </div>
            <div>
              <Eyebrow>Do more, worry less</Eyebrow>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6">Increase productivity</h3>
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                {productivitySteps.map((p) => (
                  <div key={p.title} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <p.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild className="rounded-full">
                <Link href="/auth/signin?mode=register">Sign up now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 sm:py-28 bg-surface overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-accent/10 blur-[120px] animate-blob-float-slow" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex justify-center"><Eyebrow>Voices from the network</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">What people are saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="relative bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <Quote className="absolute top-5 right-5 h-8 w-8 text-border" />
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-foreground/85 text-sm mb-4 leading-relaxed max-w-[90%]">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
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
      </section>

      {/* Cities */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">Active across most Indian cities</h2>
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
            <MapPin className="h-4 w-4 text-primary" />
            New cities added as our network grows
          </div>
        </div>
      </section>

      {/* Contact — condensed on-page version of the /contact page */}
      <section id="contact" className="relative py-24 sm:py-28 bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-accent/10 blur-[120px] animate-blob-float" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex justify-center"><Eyebrow>Get in touch</Eyebrow></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">A question, a problem, or just want to say hi?</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">We read every message and respond within one business day.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-14">
            {contactMethods.map((m) => (
              <div key={m.title} className="rounded-2xl bg-card border border-border p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">{m.desc}</p>
                <p className="text-sm font-medium text-primary">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-14 max-w-5xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Send us a message</h3>
              <p className="text-muted-foreground text-sm mb-6">Fill in the form and we&apos;ll get back to you at the email you provide.</p>
              <ContactForm />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Frequently asked questions</h3>
              <p className="text-muted-foreground text-sm mb-6">Quick answers to the most common questions.</p>
              <div className="space-y-3">
                {contactFaqs.map((faq) => (
                  <details key={faq.q} className="group border border-border rounded-2xl bg-card overflow-hidden">
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-foreground text-sm hover:bg-muted transition-colors">
                      {faq.q}
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-3 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — dark banner */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/10 via-muted to-primary/25 border border-border shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80&auto=format&fit=crop"
              alt="City skyline"
              fill
              className="object-cover opacity-15"
            />
            <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-primary/30 blur-[110px] animate-blob-float" aria-hidden="true" />
            <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-accent/25 blur-[120px] animate-blob-float-slow" aria-hidden="true" />
            <div className="relative grid md:grid-cols-[1.3fr,1fr] gap-8 items-center p-10 sm:p-14">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
                  Get started with Korpo today
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  Verify your corporate email and get instant access. Zero fake profiles, zero scammers — just verified colleagues.
                </p>
                <p className="mt-5 text-muted-foreground/70 text-sm">Free forever for core services · Premium from ₹99/month</p>
              </div>
              <div className="flex md:justify-end">
                <Button asChild size="xl" className="rounded-full shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all">
                  <Link href="/auth/signin?mode=register">
                    Get started <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
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
                <li><Link href="#about"   className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="#contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms"   className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground text-sm">
            <p>© 2026 Arka India Technology Solutions LLP. All rights reserved. Made with ❤️ for India&apos;s corporate community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
