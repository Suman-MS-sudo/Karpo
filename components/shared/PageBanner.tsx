import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  image: string
  icon: LucideIcon
  title: string
  subtitle: string
  overlayFrom: string
  overlayTo: string
  action?: React.ReactNode
  leading?: React.ReactNode
}

// A compact, image-backed banner for utility pages (Messages, Alerts) —
// lighter than PageHero (no stats/search/CTAs, just identity + one action),
// matching the visual language of the profile/dashboard banners elsewhere.
export function PageBanner({ image, icon: Icon, title, subtitle, overlayFrom, overlayTo, action, leading }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl text-white mb-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", overlayFrom, overlayTo)} aria-hidden />
      <div className="relative flex items-center justify-between gap-3 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex items-center gap-3 min-w-0">
          {leading ?? (
            <span className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-outfit text-xl sm:text-2xl font-extrabold tracking-tight truncate">{title}</h1>
            <p className="text-white/75 text-xs sm:text-sm mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
