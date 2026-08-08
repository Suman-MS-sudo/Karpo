"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef } from "react"
import { ArrowRight, ShoppingBag, Home, Briefcase } from "lucide-react"

// Icons are resolved from a string key rather than passed as component
// references — passing component functions as props from the server-rendered
// dashboard page into this "use client" component isn't serializable across
// the RSC boundary.
const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase,
}

type HeroCard = {
  id: string
  title: string
  subtitle: string
  count: number
  countLabel: string
  href: string
  icon: string
  image: string
  from: string
  to: string
}

function TiltCard({ card }: { card: HeroCard }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const Icon = ICON_REGISTRY[card.icon] ?? ShoppingBag

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rotateX = ((y / rect.height) - 0.5) * -10
    const rotateY = ((x / rect.width) - 0.5) * 10
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
    el.style.setProperty("--glow-x", `${x}px`)
    el.style.setProperty("--glow-y", `${y}px`)
  }

  function handleMouseLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  }

  return (
    <Link
      ref={ref}
      href={card.href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative isolate overflow-hidden rounded-3xl bg-gradient-to-br ${card.from} ${card.to} p-5 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out will-change-transform`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <Image
        src={card.image}
        alt=""
        fill
        className="object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: "radial-gradient(180px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.15), transparent 60%)",
        }}
      />

      <div className="relative flex flex-col h-full min-h-[168px]" style={{ transform: "translateZ(30px)" }}>
        <p className="text-lg font-extrabold tracking-tight">{card.title}</p>
        <p className="text-xs font-medium text-white/75 mt-0.5">{card.subtitle}</p>

        {card.count > 0 ? (
          <span className="mt-3 inline-block w-fit rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-bold">
            {card.count.toLocaleString()} {card.countLabel}
          </span>
        ) : (
          <span className="mt-3 inline-block w-fit rounded-full bg-white text-zinc-900 px-3 py-1 text-[11px] font-bold shadow-sm">
            Be the first — post now
          </span>
        )}

        <div className="mt-auto flex items-end justify-between pt-8">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-45"
            style={{ transform: "translateZ(20px)" }}
          >
            <ArrowRight className="h-4 w-4" />
          </span>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"
            style={{ transform: "translateZ(45px)" }}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ServiceHeroCards({ cards }: { cards: HeroCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ perspective: "1000px" }}>
      {cards.map((card) => (
        <TiltCard key={card.id} card={card} />
      ))}
    </div>
  )
}
