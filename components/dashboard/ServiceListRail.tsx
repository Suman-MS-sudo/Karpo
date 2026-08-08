import Link from "next/link"
import type { ComponentType } from "react"
import { ChevronRight } from "lucide-react"

type ListTile = {
  id: string
  name: string
  route: string
  icon: ComponentType<{ className?: string }>
  color: string
  bgColor: string
  count: number | null
  countLabel: string
}

export function ServiceListRail({ tiles }: { tiles: ListTile[] }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {tiles.map((tile) => {
        const Icon = tile.icon
        return (
          <Link
            key={tile.id}
            href={tile.route}
            className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tile.bgColor} transition-transform duration-200 group-hover:scale-105`}
            >
              <Icon className={`h-5 w-5 ${tile.color}`} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight truncate">{tile.name}</span>
              {tile.count !== null && (
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {tile.count.toLocaleString()} {tile.countLabel}
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )
      })}
    </div>
  )
}
