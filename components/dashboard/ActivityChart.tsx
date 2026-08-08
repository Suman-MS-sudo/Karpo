import Link from "next/link"
import { ShoppingBag, Home, Briefcase, Car, Wrench, Users } from "lucide-react"

const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Users,
}

type Stat = {
  label: string
  value: number
  href: string
  icon: string
  iconBg: string
  iconColor: string
}

export function ActivityChart({ stats }: { stats: Stat[] }) {
  const total = stats.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return (
      <div className="rounded-2xl bg-muted/40 py-10 px-4 text-center">
        <p className="text-sm font-medium text-foreground">No activity here yet</p>
        <p className="text-xs text-muted-foreground mt-1">Be the first to post something in your city.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => {
        const Icon = ICON_REGISTRY[s.icon] ?? ShoppingBag
        return (
          <Link
            key={s.label}
            href={s.href}
            className="group flex flex-col items-center text-center gap-2 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors py-4 px-2"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} transition-transform group-hover:scale-110`}>
              <Icon className={`h-5 w-5 ${s.iconColor}`} />
            </span>
            <span className={`text-xl font-bold tabular-nums ${s.value === 0 ? "text-muted-foreground/50" : "text-foreground"}`}>
              {s.value}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground leading-tight">{s.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
