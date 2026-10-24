import type { Metadata } from "next"
import Link from "next/link"
import { Building2, MapPin, Clock, ExternalLink, MonitorSmartphone, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DEPARTMENTS } from "@/config/services"
import { formatRelativeTime } from "@/lib/utils"
import openingsData from "@/data/job-openings.json"

export const metadata: Metadata = {
  title: "Job Openings",
  description: "Currently open roles from company career sites — apply directly, or ask a member for a referral.",
}

interface Opening {
  id: string
  company: string
  companyDomain: string
  title: string
  department: string
  team: string | null
  location: string
  workMode: string | null
  jobType: string
  postedAt: string | null
  applyUrl: string
}

const WORK_MODE_LABELS: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" }
const JOB_TYPE_LABELS: Record<string, string> = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship" }
const PAGE_SIZE = 30

// Source feeds spell locations inconsistently ("Bangalore", "Bengaluru-VTP",
// "Mumbai (ex Bombay)", "Hyderabad, TS, IN"), so each filter city matches any
// of its aliases within a posting's location string.
const CITY_ALIASES: Record<string, RegExp> = {
  "Bengaluru":     /bengaluru|bangalore/i,
  "Hyderabad":     /hyderabad/i,
  "Pune":          /pune/i,
  "Mumbai":        /mumbai|bombay/i,
  "Chennai":       /chennai|madras/i,
  "Delhi NCR":     /delhi|noida|gurgaon|gurugram|ghaziabad|faridabad/i,
  "Gandhinagar":   /gandhinagar/i,
  "Kolkata":       /kolkata|calcutta/i,
  "Coimbatore":    /coimbatore/i,
  "Jaipur":        /jaipur/i,
  "Bhubaneswar":   /bhubaneswar/i,
  "Kochi":         /kochi|cochin/i,
  "Indore":        /indore/i,
}
const matchesCity = (location: string, city: string) => CITY_ALIASES[city]?.test(location) ?? false

interface Props {
  searchParams: { q?: string; company?: string; dept?: string; city?: string; page?: string }
}

export default function JobOpeningsPage({ searchParams }: Props) {
  const all = openingsData.jobs as Opening[]
  const query   = searchParams.q?.trim().toLowerCase()
  const company = searchParams.company
  const dept    = searchParams.dept
  const cities  = (searchParams.city ?? "").split(",").filter((c) => c in CITY_ALIASES)
  const page    = Math.max(1, Number(searchParams.page) || 1)

  const companyCounts = new Map<string, number>()
  for (const j of all) companyCounts.set(j.company, (companyCounts.get(j.company) ?? 0) + 1)
  const companies = Array.from(companyCounts.entries()).sort((a, b) => b[1] - a[1])

  const cityCounts = Object.keys(CITY_ALIASES)
    .map((c) => [c, all.filter((j) => matchesCity(j.location, c)).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])

  const filtered = all
    .filter((j) => !company || j.company === company)
    .filter((j) => !cities.length || cities.some((c) => matchesCity(j.location, c)))
    .filter((j) => !dept || j.department === dept)
    .filter((j) => !query || `${j.title} ${j.company} ${j.location} ${j.team ?? ""}`.toLowerCase().includes(query))
    .sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { q: searchParams.q, company, dept, city: cities.join(",") || undefined, ...over }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const qs = p.toString()
    return `/referrals/openings${qs ? `?${qs}` : ""}`
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active ? "bg-sky-600 text-white border-sky-600" : "bg-card border-border hover:border-sky-400/60"
    }`

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/referrals" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Job Referrals
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Job Openings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {all.length.toLocaleString()} open roles in India from {companies.length} companies, collected from their own career sites
          {openingsData.fetchedAt && <> · updated {formatRelativeTime(new Date(openingsData.fetchedAt))}</>}.
          Apply on the company site, or post a referral request.
        </p>

        <form action="/referrals/openings" className="mt-5 flex gap-2">
          {company && <input type="hidden" name="company" value={company} />}
          {dept && <input type="hidden" name="dept" value={dept} />}
          {cities.length > 0 && <input type="hidden" name="city" value={cities.join(",")} />}
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search title, company, location…"
            className="flex-1 h-10 rounded-xl border border-border bg-card px-4 text-sm"
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link href={href({ company: undefined, page: undefined })} className={chip(!company)}>All companies</Link>
          {companies.map(([name, n]) => (
            <Link key={name} href={href({ company: name, page: undefined })} className={chip(company === name)}>
              {name} ({n})
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Link href={href({ dept: undefined, page: undefined })} className={chip(!dept)}>All departments</Link>
          {DEPARTMENTS.map((d) => (
            <Link key={d} href={href({ dept: d, page: undefined })} className={chip(dept === d)}>{d}</Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
          <Link href={href({ city: undefined, page: undefined })} className={chip(cities.length === 0)}>All locations</Link>
          {cityCounts.map(([c, n]) => {
            const next = cities.includes(c) ? cities.filter((x) => x !== c) : [...cities, c]
            return (
              <Link key={c} href={href({ city: next.join(",") || undefined, page: undefined })} className={chip(cities.includes(c))}>
                {c} ({n})
              </Link>
            )
          })}
        </div>

        <p className="text-sm text-muted-foreground mt-5 mb-3">
          {filtered.length.toLocaleString()} opening{filtered.length !== 1 ? "s" : ""}
        </p>

        {visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No openings match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((j) => (
              <a
                key={j.id}
                href={j.applyUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group bg-card border-2 border-border rounded-3xl p-5 flex flex-col hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-[0_12px_36px_rgba(56,189,248,0.15)] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-sky-500" />
                </div>
                <h3 className="font-semibold leading-snug mt-3 group-hover:text-sky-600 dark:group-hover:text-sky-400">{j.title}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{j.company} · {j.department}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="outline" className="text-[11px]">{JOB_TYPE_LABELS[j.jobType] ?? j.jobType}</Badge>
                  {j.workMode && (
                    <Badge variant="outline" className="text-[11px] flex items-center gap-1">
                      <MonitorSmartphone className="h-2.5 w-2.5" />{WORK_MODE_LABELS[j.workMode] ?? j.workMode}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2 line-clamp-1">
                  <MapPin className="h-3 w-3 shrink-0" />{j.location}
                </span>
                {j.postedAt && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-auto pt-3">
                    <Clock className="h-3 w-3" /> {formatRelativeTime(new Date(j.postedAt))}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {page > 1 && <Button variant="outline" asChild><Link href={href({ page: String(page - 1) })}>Previous</Link></Button>}
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            {page < totalPages && <Button variant="outline" asChild><Link href={href({ page: String(page + 1) })}>Next</Link></Button>}
          </div>
        )}
      </div>
    </div>
  )
}
