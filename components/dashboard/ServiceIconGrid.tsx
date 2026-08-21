import Link from "next/link"
import Image from "next/image"
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
  image?:      string // real logo/photo — takes priority over the lucide icon when set
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
            className={cn(
              "relative aspect-square w-full rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform",
              tile.bgColor
            )}
          >
            {tile.image ? (
              <Image
                src={tile.image}
                alt={tile.name}
                fill
                sizes="(max-width: 640px) 33vw, 200px"
                quality={90}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={cn("h-9 w-9", tile.color)} />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pt-6 pb-2">
              <p className="text-[11px] font-semibold text-white text-center leading-tight">{tile.name}</p>
              <p className="text-[10px] text-white/80 text-center tabular-nums">{tile.count} {tile.countLabel}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
