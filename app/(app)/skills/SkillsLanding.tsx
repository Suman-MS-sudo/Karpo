import Link from "next/link"
import { prisma } from "@/lib/prisma"
import {
  Sparkles, Plus, Wrench, Star, Heart, Users, CheckCircle2, Smile, ArrowRight,
  Code2, Palette, Megaphone, PenTool, Briefcase, TrendingUp, ShieldCheck,
  Database, Cpu, Calculator, Scale, Languages, GraduationCap, HeartPulse,
  MessageSquareText, Handshake,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Primary 6 categories, styled and labeled to match the reference design.
// The remaining real SkillListing categories still exist and are browsable — shown as a second, smaller row.
const PRIMARY_CATEGORIES = [
  { value: "TECH",     label: "Development",     Icon: Code2,      iconBg: "bg-blue-100 dark:bg-blue-500/20",     iconColor: "text-blue-600 dark:text-blue-400"   },
  { value: "DESIGN",   label: "Design & Creative",Icon: Palette,    iconBg: "bg-pink-100 dark:bg-pink-500/20",     iconColor: "text-pink-600 dark:text-pink-400"   },
  { value: "MARKETING",label: "Marketing",        Icon: Megaphone,  iconBg: "bg-purple-100 dark:bg-purple-500/20", iconColor: "text-purple-600 dark:text-purple-400" },
  { value: "CREATIVE", label: "Writing & Content",Icon: PenTool,    iconBg: "bg-orange-100 dark:bg-orange-500/20", iconColor: "text-orange-600 dark:text-orange-400" },
  { value: "BUSINESS", label: "Business",         Icon: Briefcase,  iconBg: "bg-amber-100 dark:bg-amber-500/20",   iconColor: "text-amber-700 dark:text-amber-400" },
  { value: "FINANCE",  label: "Finance",          Icon: TrendingUp, iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400" },
]

const MORE_CATEGORIES = [
  { value: "DATA",       label: "Data & AI",  Icon: Database,      iconBg: "bg-indigo-100 dark:bg-indigo-500/20", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { value: "ENGINEERING",label: "Engineering",Icon: Cpu,           iconBg: "bg-cyan-100 dark:bg-cyan-500/20",     iconColor: "text-cyan-600 dark:text-cyan-400"     },
  { value: "LEGAL",      label: "Legal",      Icon: Scale,         iconBg: "bg-slate-100 dark:bg-slate-500/20",   iconColor: "text-slate-600 dark:text-slate-400"   },
  { value: "LANGUAGE",   label: "Languages",  Icon: Languages,     iconBg: "bg-green-100 dark:bg-green-500/20",   iconColor: "text-green-600 dark:text-green-400"   },
  { value: "COACHING",   label: "Coaching",   Icon: GraduationCap, iconBg: "bg-orange-100 dark:bg-orange-500/20", iconColor: "text-orange-600 dark:text-orange-400" },
  { value: "WELLNESS",   label: "Wellness",   Icon: HeartPulse,    iconBg: "bg-rose-100 dark:bg-rose-500/20",     iconColor: "text-rose-600 dark:text-rose-400"     },
]

const ALL_CATEGORIES = [...PRIMARY_CATEGORIES, ...MORE_CATEGORIES]

function initials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

export async function SkillsLanding({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [total, byCategory, ratingAgg, orderAgg, verifiedUsers, featured] = await Promise.all([
    prisma.skillListing.count({ where: { status: "ACTIVE" } }),
    prisma.skillListing.groupBy({ by: ["category"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.skillListing.aggregate({ where: { status: "ACTIVE", reviewCount: { gt: 0 } }, _avg: { avgRating: true } }),
    prisma.skillListing.aggregate({ where: { status: "ACTIVE" }, _sum: { completedOrders: true } }),
    prisma.skillListing.findMany({ where: { status: "ACTIVE" }, select: { userId: true }, distinct: ["userId"] }),
    prisma.skillListing.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
      take: 8,
      include: { user: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, isVerified: true } } },
    }),
  ])

  const countByCategory = Object.fromEntries(byCategory.map(c => [c.category, c._count._all]))
  const avgRating         = ratingAgg._avg.avgRating
  const completedProjects = orderAgg._sum.completedOrders ?? 0
  const satisfactionPct   = avgRating ? Math.round((avgRating / 5) * 100) : null

  const heroStats = [
    { icon: Users,        value: `${verifiedUsers.length.toLocaleString()}+`, label: "Verified Professionals" },
    { icon: CheckCircle2, value: `${completedProjects.toLocaleString()}+`,    label: "Projects Completed"     },
    { icon: Star,         value: avgRating ? `${avgRating.toFixed(1)}/5` : "—", label: "Average Rating"      },
    { icon: Smile,        value: satisfactionPct != null ? `${satisfactionPct}%` : "—", label: "Client Satisfaction" },
  ]

  return (
    <div className="min-h-full bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Soft lavender wash + decorative blobs — the "background things" */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-primary/[0.07] via-accent/[0.05] to-background" aria-hidden />
        <div
          className="absolute inset-0 -z-20 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 60% at 60% 20%, black 40%, transparent 100%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 right-0 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[100px]" />
          <div className="absolute top-1/3 -left-20 h-[320px] w-[320px] rounded-full bg-accent/10 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-[260px] w-[260px] rounded-full bg-amber-400/10 blur-[100px]" />
          {/* Floating particles */}
          <div className="absolute top-16 left-[15%] h-2 w-2 rounded-full bg-primary/40" />
          <div className="absolute top-40 left-[8%] h-1.5 w-1.5 rounded-full bg-accent/40" />
          <div className="absolute bottom-24 left-[22%] h-2.5 w-2.5 rounded-full bg-primary/30" />
          <div className="absolute top-24 right-[38%] h-1.5 w-1.5 rounded-full bg-amber-400/40" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
          <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-center">
            <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 ring-1 ring-primary/20 px-4 py-1.5 mb-7 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">AI Powered Marketplace</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] drop-shadow-sm">
                <span className="block">Find the right</span>
                <span className="block">professionals.</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]">Faster.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Connect with verified experts in minutes. AI matched. Human approved.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="h-14 rounded-full px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
                  <Link href={`/skills?category=${PRIMARY_CATEGORIES[0].value}`}>Browse Professionals</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-8 ring-1 ring-border/60 hover:shadow-md transition-all">
                  <Link href={isLoggedIn ? "/skills/new" : "/auth/signin"}>Offer a Skill</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Verified corporate colleagues only</span>
                <span className="flex items-center gap-1.5"><Handshake className="h-3.5 w-3.5 text-primary" />Secure in-app hiring &amp; payments</span>
              </div>

              <p className="mt-5 text-xs text-muted-foreground flex flex-wrap items-center lg:justify-start justify-center gap-x-2 gap-y-1.5">
                <span className="font-medium text-foreground/70">Popular:</span>
                {PRIMARY_CATEGORIES.slice(0, 5).map(c => (
                  <Link key={c.value} href={`/skills?category=${c.value}`} className="px-3 py-1 rounded-full bg-card ring-1 ring-border/60 hover:ring-primary/40 hover:text-primary hover:shadow-sm transition-all">
                    {c.label}
                  </Link>
                ))}
              </p>
            </div>

            {/* Decorative abstract mesh-gradient composition */}
            <div className="hidden lg:block relative h-[380px] -mr-6">
              {/* Layered mesh-gradient blobs, offset to feel painterly rather than symmetric */}
              <div className="absolute inset-0" aria-hidden>
                <div className="absolute top-4 right-0 h-64 w-64 rounded-[40%_60%_60%_40%/50%_40%_60%_50%] bg-gradient-to-br from-primary/70 to-primary/10 dark:from-primary/40 dark:to-primary/5 blur-xl animate-[spin_30s_linear_infinite]" />
                <div className="absolute bottom-6 left-2 h-56 w-56 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-tr from-accent/60 to-accent/10 dark:from-accent/35 dark:to-accent/5 blur-xl animate-[spin_24s_linear_infinite_reverse]" />
                <div className="absolute top-1/3 left-1/3 h-40 w-40 rounded-full bg-gradient-to-br from-amber-400/50 dark:from-amber-300/30 to-transparent blur-xl" />
              </div>

              {/* Fine grid texture, masked to a soft circle */}
              <div
                className="absolute inset-0 opacity-70 dark:opacity-20"
                style={{
                  backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                  maskImage: "radial-gradient(circle at 55% 45%, black 0%, transparent 65%)",
                }}
                aria-hidden
              />

              {/* Orbit rings around the focal badge */}
              <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
                <div className="h-64 w-64 rounded-full border border-dashed border-primary/40 dark:border-primary/25" />
                <div className="absolute h-48 w-48 rounded-full border border-accent/35 dark:border-accent/20" />
              </div>

              {/* Central AI badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-28 w-28 rounded-full bg-card ring-1 ring-primary/20 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.45)] flex items-center justify-center">
                  <span className="absolute -inset-3 rounded-full border-2 border-primary/30 dark:border-primary/20 animate-pulse" />
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  <Sparkles className="h-10 w-10 text-primary relative" />
                </div>
              </div>

              {/* Floating category icon chips, orbiting the badge */}
              {[
                { Icon: Code2,     pos: "top-2 left-6",      bg: "bg-blue-100 dark:bg-blue-500/20",     color: "text-blue-600 dark:text-blue-400" },
                { Icon: Palette,   pos: "top-8 right-2",     bg: "bg-pink-100 dark:bg-pink-500/20",     color: "text-pink-600 dark:text-pink-400" },
                { Icon: Megaphone, pos: "bottom-10 left-0",  bg: "bg-purple-100 dark:bg-purple-500/20", color: "text-purple-600 dark:text-purple-400" },
                { Icon: TrendingUp,pos: "bottom-2 right-8",  bg: "bg-emerald-100 dark:bg-emerald-500/20", color: "text-emerald-600 dark:text-emerald-400" },
                { Icon: Database,  pos: "top-1/2 left-[-8px] -translate-y-1/2", bg: "bg-indigo-100 dark:bg-indigo-500/20", color: "text-indigo-600 dark:text-indigo-400" },
                { Icon: Briefcase, pos: "top-1/2 right-[-8px] -translate-y-1/2", bg: "bg-amber-100 dark:bg-amber-500/20", color: "text-amber-700 dark:text-amber-400" },
              ].map(({ Icon, pos, bg, color }, i) => (
                <div key={i} className={cn("absolute h-11 w-11 rounded-2xl shadow-lg ring-1 ring-border/50 flex items-center justify-center", bg, pos)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
              ))}
            </div>
          </div>

          {/* Promo widget card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent text-white p-6 sm:p-7 shadow-xl shadow-primary/25 mt-12">
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 85% 15%, white 0%, transparent 45%)" }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div>
                <h3 className="text-lg sm:text-xl font-bold leading-snug">Find the right expert for your next project</h3>
                <Button asChild size="sm" className="mt-4 bg-white text-primary hover:bg-white/90 rounded-full shadow-lg">
                  <Link href={`/skills?category=${PRIMARY_CATEGORIES[0].value}`}>Explore Now</Link>
                </Button>
              </div>
              <div className="shrink-0 text-center ml-auto">
                <div className="flex -space-x-3 justify-center">
                  {featured.slice(0, 3).map(l => {
                    const img = l.user.avatarUrl ?? l.user.image
                    return (
                      <div key={l.id} className="h-10 w-10 rounded-full ring-2 ring-white overflow-hidden bg-white/20 flex items-center justify-center text-xs font-semibold">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : initials(l.user.name)}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs font-medium mt-2 whitespace-nowrap">{verifiedUsers.length.toLocaleString()}+ Professionals</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 rounded-3xl bg-card/80 backdrop-blur-sm ring-1 ring-border/60 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
            {heroStats.map(stat => (
              <div key={stat.label} className="group flex flex-col items-center gap-2.5 px-5 py-6 text-center hover:bg-primary/[0.03] transition-colors">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight tabular-nums leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-muted-foreground text-[11px] mt-2 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute top-24 -left-32 h-[300px] w-[300px] rounded-full bg-primary/[0.04] blur-[110px]" />
          <div className="absolute top-1/2 -right-32 h-[340px] w-[340px] rounded-full bg-accent/[0.05] blur-[110px]" />
          <div className="absolute bottom-0 left-1/3 h-[260px] w-[260px] rounded-full bg-amber-400/[0.04] blur-[110px]" />
        </div>

        {/* ── How it works ─────────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-2">
            <span className="h-px w-5 bg-primary/50" />Process
          </p>
          <h2 className="text-2xl font-bold tracking-tight">How SkillHub Works</h2>
          <p className="text-sm text-muted-foreground mb-6 mt-1">From request to hire, in three simple steps</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { Icon: MessageSquareText, title: "Describe what you need", desc: "Post a request or search a category to find the right expertise." },
              { Icon: Sparkles,          title: "Get AI-matched",        desc: "We rank verified colleagues by reputation, skills, and availability." },
              { Icon: Handshake,         title: "Hire & collaborate securely", desc: "Chat, agree on a package, and track delivery — all inside Korpo." },
            ].map(({ Icon, title, desc }, i) => (
              <div key={title} className="relative rounded-3xl bg-card ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-6">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-primary/70 mb-1">Step {i + 1}</p>
                <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ───────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-2">
                <span className="h-px w-5 bg-primary/50" />Categories
              </p>
              <h2 className="text-2xl font-bold tracking-tight">Explore Top Categories</h2>
            </div>
            <Link href={`/skills?category=${PRIMARY_CATEGORIES[0].value}`} className="group flex items-center gap-1 text-sm font-medium text-primary">
              View all <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Browse professionals by category</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRIMARY_CATEGORIES.map(c => (
              <Link
                key={c.value}
                href={`/skills?category=${c.value}`}
                className="group relative flex flex-col items-center gap-3 p-5 rounded-3xl bg-card ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.25)] hover:-translate-y-1.5 transition-all duration-300 text-center overflow-hidden"
              >
                <span className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden />
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-sm group-hover:scale-110 transition-transform duration-300", c.iconBg)}>
                  <c.Icon className={cn("h-6 w-6", c.iconColor)} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{countByCategory[c.value] ?? 0} experts</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            {MORE_CATEGORIES.map(c => (
              <Link
                key={c.value}
                href={`/skills?category=${c.value}`}
                className="group relative flex flex-col items-center gap-3 p-5 rounded-3xl bg-card ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.25)] hover:-translate-y-1.5 transition-all duration-300 text-center overflow-hidden"
              >
                <span className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden />
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-sm group-hover:scale-110 transition-transform duration-300", c.iconBg)}>
                  <c.Icon className={cn("h-6 w-6", c.iconColor)} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{countByCategory[c.value] ?? 0} experts</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recommended ──────────────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-2">
              <span className="h-px w-5 bg-primary/50" />Recommended
            </p>
            <h2 className="text-2xl font-bold tracking-tight">AI Recommended for You</h2>
            <p className="text-sm text-muted-foreground mb-6 mt-1">Based on verified reputation across the network</p>
            <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
              {featured.map((l, i) => {
                const img = l.user.avatarUrl ?? l.user.image
                return (
                  <Link
                    key={l.id}
                    href={`/skills/${l.id}`}
                    className="group shrink-0 w-64 rounded-3xl bg-card ring-1 ring-black/5 dark:ring-white/10 overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_48px_-12px_rgba(99,102,241,0.28)] hover:ring-primary/30 hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Photo block */}
                    <div className="relative h-36 bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <span className="text-4xl font-bold text-white/90">{initials(l.user.name)}</span>
                      )}
                      {i === 0 && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400/95 backdrop-blur-sm text-amber-950 shadow-lg ring-1 ring-white/40 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />Top Match
                        </span>
                      )}
                      <span className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg ring-1 ring-white/50 group-hover:scale-110 transition-transform">
                        <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold truncate">{l.user.name}</p>
                        {l.user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{l.title}</p>

                      <div className="flex items-center justify-between mt-3">
                        {l.avgRating && l.reviewCount > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{l.avgRating.toFixed(1)} ({l.reviewCount})
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">New listing</span>
                        )}
                        <span className="text-sm font-bold">
                          {l.pricingModel === "HOURLY" && l.hourlyRate ? `₹${l.hourlyRate.toLocaleString()}/hr` : "View pricing"}
                        </span>
                      </div>

                      {(l.skills as unknown as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(l.skills as unknown as string[]).slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />Available
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────────── */}
        <section className="group/cta relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-primary/[0.08] via-accent/[0.06] to-primary/[0.08] ring-1 ring-primary/10 shadow-[0_2px_16px_-6px_rgba(99,102,241,0.15)] p-7">
          <div
            className="absolute inset-0 -z-10 opacity-[0.4] dark:opacity-[0.25]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse 60% 100% at 100% 50%, black 30%, transparent 100%)",
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" aria-hidden />
          <div className="flex items-center gap-4 relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/25 group-hover/cta:rotate-6 transition-transform duration-300">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Have a skill to offer?</p>
              <p className="text-xs text-muted-foreground mt-0.5">List your services and get discovered by verified colleagues.</p>
            </div>
          </div>
          <Button asChild className="shrink-0 relative rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            <Link href={isLoggedIn ? "/skills/new" : "/auth/signin"}><Plus className="h-4 w-4 mr-1.5" />Offer a Skill</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
