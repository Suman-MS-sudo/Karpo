import Link from "next/link"
import {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift, ArrowRight,
} from "lucide-react"
import { SERVICES, type ServiceConfig } from "@/config/services"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users,
  GraduationCap, Shield, Gift,
}

interface ServiceGridProps {
  variant?: "home" | "sidebar" | "picker"
  isPremium?: boolean
  activeId?: string
  onSelect?: (service: ServiceConfig) => void
}

export function ServiceGrid({ variant = "home", isPremium = false, activeId, onSelect }: ServiceGridProps) {
  if (variant === "home") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {SERVICES.filter((s) => s.isActive).map((service) => {
          const Icon = iconMap[service.icon] ?? ShoppingBag
          const locked = service.isPremium && !isPremium

          return (
            <Link
              key={service.id}
              href={service.route}
              className="group"
            >
              <div className={cn(
                "relative flex flex-col gap-3 p-4 rounded-2xl border bg-card",
                "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                service.isPremium
                  ? "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700"
                  : "border-border hover:border-foreground/20"
              )}>
                {/* Top row: icon + badge/lock */}
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    service.bgColor
                  )}>
                    <Icon className={cn("h-5 w-5", service.color)} />
                  </div>

                  {service.badge === "Popular" ? (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Hot
                    </span>
                  ) : service.badge === "Premium" ? (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Pro
                    </span>
                  ) : null}
                </div>

                {/* Name + description */}
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{service.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {service.description}
                  </p>
                </div>

                {/* Arrow on hover */}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all absolute bottom-3.5 right-3.5" />
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  if (variant === "picker") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {SERVICES.filter((s) => s.isActive).map((service) => {
          const Icon = iconMap[service.icon] ?? ShoppingBag
          return (
            <button
              key={service.id}
              onClick={() => onSelect?.(service)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-left",
                "hover:bg-muted transition-all",
                service.isPremium
                  ? "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700"
                  : "border-border hover:border-foreground/20"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", service.bgColor)}>
                <Icon className={cn("h-4 w-4", service.color)} />
              </div>
              <span className="text-sm font-medium text-foreground leading-tight flex-1">{service.name}</span>
              {service.isPremium && (
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 px-1.5 py-0.5 rounded-full shrink-0">Pro</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // sidebar variant
  return (
    <nav className="space-y-0.5">
      {SERVICES.filter((s) => s.isActive).map((service) => {
        const Icon = iconMap[service.icon] ?? ShoppingBag
        const isActive = service.id === activeId

        return (
          <Link
            key={service.id}
            href={service.route}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group",
              isActive
                ? "bg-primary-600 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className={cn(
              "h-6 w-6 rounded-lg flex items-center justify-center shrink-0",
              isActive ? "bg-white/20" : service.bgColor
            )}>
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : service.color)} />
            </div>
            <span className="truncate flex-1">{service.name}</span>
            {service.badge === "Popular" && !isActive && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                Hot
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
