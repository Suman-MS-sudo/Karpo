import Link from "next/link"
import { Sparkles, Plus, Package, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


interface Props {
  totalListings:     number
  verifiedCount:     number
  completedProjects: number
  avgRating:         number | null
  isLoggedIn:         boolean
  defaultQuery?:       string
  compact?:            boolean
}

export function SkillsHero({ totalListings, verifiedCount, completedProjects, avgRating, isLoggedIn, defaultQuery = "", compact }: Props) {
  return (
    <div className="relative text-white overflow-hidden" style={{ minHeight: compact ? 260 : 320 }}>
      {/* Background image — professionals collaborating */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=85&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 via-transparent to-violet-950/40" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-white border border-white/30 rounded-full px-3 py-1 backdrop-blur-sm bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-purple-400/30 shadow-[0_0_20px_rgba(99,102,241,0.35)]">
                <Sparkles className="h-3 w-3 text-indigo-300" /> AI Powered Marketplace
              </span>
            </div>
            <h1 className={cn("font-outfit", "text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-lg")}>
              <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-200 bg-clip-text text-transparent">Skill</span>
              {" "}<span className="bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Marketplace</span>
            </h1>
            <p className="text-white/60 mt-2 text-sm">Hire verified colleagues for freelance work — AI matched, human approved.</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Button asChild variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-medium rounded-full">
              <Link href="/my-postings"><Package className="h-4 w-4 mr-1.5" /> My Listings</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-400 text-white hover:brightness-110 font-bold shadow-[0_4px_20px_rgba(99,102,241,0.4)] backdrop-blur-sm rounded-full border-0">
              <Link href={isLoggedIn ? "/skills/new" : "/auth/signin"}><Plus className="h-4 w-4 mr-1.5" /> Offer a Skill</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mb-8">
          <div>
            <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-indigo-300 to-blue-200 bg-clip-text text-transparent")}>{verifiedCount.toLocaleString()}+</p>
            <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Professionals</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div>
            <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-violet-300 to-purple-200 bg-clip-text text-transparent")}>{completedProjects.toLocaleString()}+</p>
            <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Projects Done</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div>
            <p className={cn("font-outfit", "text-3xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent")}>{avgRating ? `${avgRating.toFixed(1)}/5` : "—"}</p>
            <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Avg Rating</p>
          </div>
          {!compact && (
            <>
              <div className="w-px h-10 bg-white/15" />
              <div>
                <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-fuchsia-300 to-pink-200 bg-clip-text text-transparent")}>{totalListings.toLocaleString()}</p>
                <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Live Listings</p>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <form action="/skills" className="flex gap-2 items-center pb-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={defaultQuery}
              placeholder="Search skills, titles, expertise…"
              className="w-full h-12 pl-11 pr-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:bg-white/15 transition-all"
            />
          </div>
          <Button type="submit" className="h-12 px-6 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-400 text-white hover:brightness-110 font-bold shadow-[0_4px_20px_rgba(99,102,241,0.4)] border-0">
            Search
          </Button>
        </form>
      </div>
    </div>
  )
}
