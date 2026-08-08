import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"


interface PageTitleProps {
  badge: string
  badgeIcon: LucideIcon
  title: string
  subtitle: string
}

export function PageTitle({ badge, badgeIcon: BadgeIcon, title, subtitle }: PageTitleProps) {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1 bg-violet-50 dark:bg-violet-950/30 mb-3">
        <BadgeIcon className="h-3 w-3" /> {badge}
      </span>
      <h1 className={cn("font-outfit", "text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-600")}>
        {title}
      </h1>
      <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>
    </div>
  )
}
