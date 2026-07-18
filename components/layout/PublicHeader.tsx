"use client"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${
        scrolled ? "bg-background/90 border-border shadow-sm" : "bg-background/70 border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Korpo" width={32} height={32} priority className="rounded-lg object-contain" />
          <span className="font-bold text-xl text-foreground">Korpo</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/#services"     className="hover:text-foreground transition-colors">Find Talent</Link>
          <Link href="/#categories"   className="hover:text-foreground transition-colors">Categories</Link>
          <Link href="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
          <Link href="/about"         className="hover:text-foreground transition-colors">For Business</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/signin">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/signin">Sign up <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
