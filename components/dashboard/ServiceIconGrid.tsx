import Link from "next/link"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Users, Tag, Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Users, Tag,
}

export interface ServiceTile {
  id:          string
  name:        string
  icon:        string
  route:       string
  color:       string
  bgColor:     string
  count:       number
  countLabel:  string
}

export function ServiceIconGrid({ tiles }: { tiles: ServiceTile[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => {
        const Icon = ICON_REGISTRY[tile.icon] ?? Package
        return (
          <Link
            key={tile.id}
            href={tile.route}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-card shadow-sm py-3 px-1 active:scale-95 transition-transform"
          >
            <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", tile.bgColor)}>
              <Icon className={cn("h-5 w-5", tile.color)} />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">{tile.name}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{tile.count} {tile.countLabel}</span>
          </Link>
        )
      })}
    </div>
  )
}
