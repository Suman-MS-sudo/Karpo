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
        scrolled
          ? "bg-[#dadce0]/80 border-[#bdc1c6]/60 shadow-sm"
          : "bg-yellow-300 border-yellow-400/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Korpo" width={32} height={32} priority className="rounded-lg object-contain" />
          <span className="font-bold text-xl text-[#1E3A5F]">Korpo</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/#services"     className="hover:text-[#1E3A5F] transition-colors">Services</Link>
          <Link href="/#how-it-works" className="hover:text-[#1E3A5F] transition-colors">How it works</Link>
          <Link href="/about"         className="hover:text-[#1E3A5F] transition-colors font-medium">About</Link>
          <Link href="/contact"       className="hover:text-[#1E3A5F] transition-colors font-medium">Contact</Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/auth/signin">Join with work email <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </header>
  )
}
