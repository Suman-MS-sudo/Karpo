import { cn } from "@/lib/utils"

interface Props {
  icon: React.ComponentType<any>
  color: string      // e.g. "text-blue-600 dark:text-blue-400"
  bg: string          // e.g. "bg-blue-100 dark:bg-blue-500/15"
  size?: "sm" | "md" | "lg"
  active?: boolean
  className?: string
}

const SIZE = {
  sm: { box: "h-8 w-8 rounded-lg",   icon: "h-4 w-4" },
  md: { box: "h-9 w-9 rounded-xl",   icon: "h-4.5 w-4.5" },
  lg: { box: "h-11 w-11 rounded-2xl", icon: "h-5 w-5" },
}

// A bold "duotone" icon tile used anywhere a service/category is represented
// by an icon (as opposed to a real photo) — thicker stroke on the glyph plus
// a soft tinted, slightly glossy backdrop, instead of a bare thin-outline
// icon. Shared so every service icon in the app reads consistently.
export function DuotoneIcon({ icon: Icon, color, bg, size = "md", active, className }: Props) {
  const s = SIZE[size]
  return (
    <span
      className={cn(
        s.box, bg,
        "relative flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-150",
        active && "scale-110",
        className
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent dark:from-white/15 dark:via-white/0" aria-hidden />
      <Icon className={cn(s.icon, color, "relative drop-shadow-sm")} strokeWidth={2.5} />
    </span>
  )
}
