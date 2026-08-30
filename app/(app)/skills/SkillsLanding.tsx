import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import {
  Sparkles, Plus, Wrench, Star, Heart, CheckCircle2, ArrowRight,
  Code2, Palette, Megaphone, PenTool, Briefcase, TrendingUp,
  Database, Cpu, Scale, Languages, GraduationCap, HeartPulse,
  MessageSquareText, Handshake, Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SkillsHero } from "@/components/skills/SkillsHero"
import { SkillCategoryStrip } from "@/components/skills/SkillCategoryStrip"

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
  { value: "PHOTOGRAPHY",label: "Photography",Icon: Camera,        iconBg: "bg-fuchsia-100 dark:bg-fuchsia-500/20", iconColor: "text-fuchsia-600 dark:text-fuchsia-400" },
]

const ALL_CATEGORIES = [...PRIMARY_CATEGORIES, ...MORE_CATEGORIES]

function initials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

export async function SkillsLanding({ isLoggedIn }: { isLoggedIn: boolean }) {
  // The 4 scalar aggregates below (count/avg/sum/distinct-count) used to be
  // 4 separate round trips; folded into one raw query since this DB's libsql
  // adapter doesn't pipeline concurrent requests (each prisma call is its
  // own ~30ms network hop regardless of Promise.all). groupBy and the
  // featured-listings join stay as their own queries since they return
  // multi-row/joined shapes that don't fit a single scalar-subquery SELECT.
  const statsQuery = prisma.$queryRaw<Array<{
    total: bigint; avgRating: number | null; completedProjects: bigint; verifiedCount: bigint
  }>>(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM "SkillListing" WHERE status = 'ACTIVE') AS total,
      (SELECT AVG("avgRating") FROM "SkillListing" WHERE status = 'ACTIVE' AND "reviewCount" > 0) AS "avgRating",
      (SELECT COALESCE(SUM("completedOrders"),0) FROM "SkillListing" WHERE status = 'ACTIVE') AS "completedProjects",
      (SELECT COUNT(DISTINCT "userId") FROM "SkillListing" WHERE status = 'ACTIVE') AS "verifiedCount"
  `).then(([r]) => ({
    total: Number(r.total),
    avgRating: r.avgRating,
    completedProjects: Number(r.completedProjects),
    verifiedCount: Number(r.verifiedCount),
  }))

  const [stats, byCategory, featured] = await Promise.all([
    statsQuery,
    prisma.skillListing.groupBy({ by: ["category"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.skillListing.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
      take: 8,
      include: { user: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, isVerified: true } } },
    }),
  ])

  const { total, avgRating, completedProjects, verifiedCount } = stats
  const countByCategory = Object.fromEntries(byCategory.map(c => [c.category, c._count._all]))

  return (
    <div className="min-h-full bg-background">
      <SkillsHero
        totalListings={total}
        verifiedCount={verifiedCount}
        completedProjects={completedProjects}
        avgRating={avgRating}
        isLoggedIn={isLoggedIn}
      />
      <SkillCategoryStrip activeCategory="All" counts={countByCategory} total={total} />

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
