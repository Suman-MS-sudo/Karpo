import Link from "next/link"
import Image from "next/image"
import { SERVICES } from "@/config/services"

export function PublicFooter() {
  return (
    <footer className="bg-[#1E3A5F] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Karpo" width={28} height={28} className="rounded-lg object-contain" />
              <span className="font-bold text-lg">Karpo</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              India&apos;s first verified corporate employee marketplace.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-3 text-sm">Services</p>
            <ul className="space-y-2 text-sm text-blue-200">
              {SERVICES.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link href="/auth/signin" className="hover:text-white transition-colors">{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-3 text-sm">Premium</p>
            <ul className="space-y-2 text-sm text-blue-200">
              {SERVICES.slice(5).map((s) => (
                <li key={s.id}>
                  <Link href="/auth/signin" className="hover:text-white transition-colors">{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-3 text-sm">Company</p>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/about"   className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#"        className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#"        className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-300 text-sm">
          <p>© 2025 Karpo. All rights reserved.</p>
          <p>Made with ❤️ for India&apos;s corporate community.</p>
        </div>
      </div>
    </footer>
  )
}
