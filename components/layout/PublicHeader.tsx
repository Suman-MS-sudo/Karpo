import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Karpo" width={32} height={32} className="rounded-lg object-contain" />
          <span className="font-bold text-xl text-[#1E3A5F]">Karpo</span>
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
