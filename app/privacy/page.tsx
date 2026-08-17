import { PublicHeader } from "@/components/layout/PublicHeader"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { FileText, ShieldCheck } from "lucide-react"
import { PrivacyContent, PRIVACY_SECTIONS as SECTIONS, PRIVACY_LAST_UPDATED as LAST_UPDATED } from "@/components/legal/PrivacyContent"

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy describing how Korpo collects, uses, shares and protects your personal data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#2E86AB] text-white py-16 lg:py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-blue-300" />
            Legal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-blue-100">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-4 gap-10">

          {/* Table of contents */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-[#F8FAFC] border border-gray-100 rounded-2xl p-5">
              <p className="font-semibold text-[#1E3A5F] text-sm mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" /> On this page
              </p>
              <ul className="space-y-2 text-sm">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-gray-600 hover:text-[#1E3A5F] transition-colors">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Body */}
          <div className="lg:col-span-3 legal-content">

            <PrivacyContent />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
