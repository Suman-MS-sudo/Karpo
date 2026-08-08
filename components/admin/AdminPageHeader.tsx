import type { LucideIcon } from "lucide-react"

interface AdminPageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  gradient?: string // tailwind gradient classes, e.g. "from-indigo-500 to-violet-600"
  action?: React.ReactNode
}

export function AdminPageHeader({ icon: Icon, title, subtitle, gradient = "from-indigo-500 to-violet-600", action }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
      <div className="flex items-center gap-3">
        <span className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
