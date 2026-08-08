import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


export interface HeroStat {
  value: string
  label: string
  gradient: string // tailwind gradient classes for the number's bg-clip-text
}

export interface HeroCta {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface Props {
  imageUrl:      string
  eyebrow:       string
  titleWhite:    string   // first part of the title, rendered in a white→pastel gradient
  titleAccent:   string   // second part, rendered in the accent gradient
  description:   string
  overlayFrom:   string   // e.g. "from-blue-950/50"
  overlayTo:     string   // e.g. "to-cyan-950/40"
  blobFrom:      string   // e.g. "bg-blue-500/30"
  blobTo:        string   // e.g. "bg-cyan-400/20"
  eyebrowGradient: string // e.g. "from-blue-500/30 via-cyan-500/30 to-teal-400/30"
  ctaGradient:   string   // e.g. "from-blue-500 via-cyan-500 to-teal-400"
  focusRing:     string   // e.g. "focus:ring-blue-400/50"
  stats:         HeroStat[]
  primaryCta:    HeroCta
  secondaryCta?: HeroCta
  searchAction?: string
  searchPlaceholder?: string
  defaultQuery?: string
  compact?:      boolean
}

export function PageHero({
  imageUrl, eyebrow, titleWhite, titleAccent, description,
  overlayFrom, overlayTo, blobFrom, blobTo, eyebrowGradient, ctaGradient, focusRing,
  stats, primaryCta, secondaryCta, searchAction, searchPlaceholder, defaultQuery = "", compact,
}: Props) {
  return (
    <div className="relative text-white overflow-hidden" style={{ minHeight: compact ? 260 : 320 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/80" />
      <div className={cn("absolute inset-0 bg-gradient-to-r via-transparent", overlayFrom, overlayTo)} />
      <div className={cn("absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl pointer-events-none", blobFrom)} />
      <div className={cn("absolute -bottom-32 -right-16 h-80 w-80 rounded-full blur-3xl pointer-events-none", blobTo)} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-white border border-white/30 rounded-full px-3 py-1 backdrop-blur-sm bg-gradient-to-r", eyebrowGradient)}>
                {eyebrow}
              </span>
            </div>
            <h1 className={cn("font-outfit", "text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-lg")}>
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">{titleWhite}</span>
              {" "}<span className={cn("bg-gradient-to-r bg-clip-text text-transparent", ctaGradient)}>{titleAccent}</span>
            </h1>
            <p className="text-white/60 mt-2 text-sm max-w-md">{description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {secondaryCta && (
              <Button asChild variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-medium rounded-full">
                <Link href={secondaryCta.href}>
                  {secondaryCta.icon && <secondaryCta.icon className="h-4 w-4 mr-1.5" />}
                  {secondaryCta.label}
                </Link>
              </Button>
            )}
            <Button asChild className={cn("text-white hover:brightness-110 font-bold backdrop-blur-sm rounded-full border-0 bg-gradient-to-r", ctaGradient)}>
              <Link href={primaryCta.href}>
                {primaryCta.icon && <primaryCta.icon className="h-4 w-4 mr-1.5" />}
                {primaryCta.label}
              </Link>
            </Button>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="flex items-center gap-8 mb-8 flex-wrap">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10 bg-white/15" />}
                <div>
                  <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r bg-clip-text text-transparent", s.gradient)}>{s.value}</p>
                  <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchAction && (
        <form action={searchAction} className="flex gap-2 items-center pb-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={defaultQuery}
              placeholder={searchPlaceholder}
              className={cn("w-full h-12 pl-11 pr-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:bg-white/15 transition-all", focusRing)}
            />
          </div>
          <Button type="submit" className={cn("h-12 px-6 rounded-full text-white hover:brightness-110 font-bold border-0 bg-gradient-to-r", ctaGradient)}>
            Search
          </Button>
        </form>
        )}
      </div>
    </div>
  )
}
