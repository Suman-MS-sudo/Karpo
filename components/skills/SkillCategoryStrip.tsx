"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import {
  LayoutDashboard, Code2, Palette, Megaphone, PenTool, Briefcase, TrendingUp,
  Database, Cpu, Scale, Languages, GraduationCap, HeartPulse, Camera,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"


const CATEGORIES = [
  { value: "All",         label: "All",          Icon: LayoutDashboard, iconBg: "bg-slate-100 dark:bg-white/10",           iconColor: "text-slate-600 dark:text-white"          },
  { value: "TECH",        label: "Development",  Icon: Code2,           iconBg: "bg-blue-100 dark:bg-blue-500/20",         iconColor: "text-blue-600 dark:text-blue-400"        },
  { value: "DESIGN",      label: "Design",       Icon: Palette,         iconBg: "bg-pink-100 dark:bg-pink-500/20",         iconColor: "text-pink-600 dark:text-pink-400"        },
  { value: "MARKETING",   label: "Marketing",    Icon: Megaphone,       iconBg: "bg-purple-100 dark:bg-purple-500/20",     iconColor: "text-purple-600 dark:text-purple-400"    },
  { value: "CREATIVE",    label: "Writing",      Icon: PenTool,         iconBg: "bg-orange-100 dark:bg-orange-500/20",     iconColor: "text-orange-600 dark:text-orange-400"    },
  { value: "BUSINESS",    label: "Business",     Icon: Briefcase,       iconBg: "bg-amber-100 dark:bg-amber-500/20",       iconColor: "text-amber-700 dark:text-amber-400"      },
  { value: "FINANCE",     label: "Finance",      Icon: TrendingUp,      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",   iconColor: "text-emerald-600 dark:text-emerald-400"  },
  { value: "DATA",        label: "Data & AI",    Icon: Database,        iconBg: "bg-indigo-100 dark:bg-indigo-500/20",     iconColor: "text-indigo-600 dark:text-indigo-400"    },
  { value: "ENGINEERING", label: "Engineering",  Icon: Cpu,             iconBg: "bg-cyan-100 dark:bg-cyan-500/20",         iconColor: "text-cyan-600 dark:text-cyan-400"        },
  { value: "LEGAL",       label: "Legal",        Icon: Scale,           iconBg: "bg-slate-100 dark:bg-slate-500/20",       iconColor: "text-slate-600 dark:text-slate-400"      },
  { value: "LANGUAGE",    label: "Languages",    Icon: Languages,       iconBg: "bg-green-100 dark:bg-green-500/20",       iconColor: "text-green-600 dark:text-green-400"      },
  { value: "COACHING",    label: "Coaching",     Icon: GraduationCap,   iconBg: "bg-orange-100 dark:bg-orange-500/20",     iconColor: "text-orange-600 dark:text-orange-400"    },
  { value: "WELLNESS",    label: "Wellness",     Icon: HeartPulse,      iconBg: "bg-rose-100 dark:bg-rose-500/20",         iconColor: "text-rose-600 dark:text-rose-400"        },
  { value: "PHOTOGRAPHY", label: "Photography",  Icon: Camera,          iconBg: "bg-fuchsia-100 dark:bg-fuchsia-500/20",   iconColor: "text-fuchsia-600 dark:text-fuchsia-400"  },
]

export function SkillCategoryStrip({ activeCategory, counts, total }: { activeCategory: string; counts: Record<string, number>; total: number }) {
  const catRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState({ left: false, right: true })

  function scrollCat(dir: "left" | "right") {
    const el = catRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -el.clientWidth : el.clientWidth, behavior: "smooth" })
  }

  function onScroll() {
    const el = catRef.current
    if (!el) return
    setScrolled({ left: el.scrollLeft > 8, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8 })
  }

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <button
          onClick={() => scrollCat("left")}
          disabled={!scrolled.left}
          className="shrink-0 w-7 h-7 my-auto rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div ref={catRef} onScroll={onScroll} className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex">
            {CATEGORIES.map((cat) => {
              const count = cat.value === "All" ? total : (counts[cat.value] ?? 0)
              const isActive = activeCategory === cat.value
              return (
                <Link
                  key={cat.value}
                  href={cat.value === "All" ? "/skills" : `/skills?category=${cat.value}`}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 relative transition-all duration-150 group",
                    "flex-1 min-w-[84px]",
                    isActive ? "opacity-100" : "opacity-40 hover:opacity-75"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-150",
                    isActive ? cn(cat.iconBg, "ring-2 ring-indigo-400 scale-110 shadow-[0_0_12px_rgba(99,102,241,0.4)]") : cn(cat.iconBg, "group-hover:scale-105")
                  )}>
                    <cat.Icon className={cn("h-4.5 w-4.5", cat.iconColor)} style={{ width: 18, height: 18 }} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn("font-outfit", "text-[11px] font-bold tracking-tight whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {cat.label}
                  </span>
                  <span className={cn("text-[10px] tabular-nums leading-none", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                    {count}
                  </span>
                  <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-150", isActive ? "w-8" : "w-0")} />
                </Link>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => scrollCat("right")}
          disabled={!scrolled.right}
          className="shrink-0 w-7 h-7 my-auto rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
