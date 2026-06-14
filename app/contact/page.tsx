import { PublicHeader } from "@/components/layout/PublicHeader"
import { PublicFooter } from "@/components/layout/PublicFooter"
import { ContactForm } from "@/components/shared/ContactForm"
import { Mail, MessageSquare, Clock, MapPin, ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "How do I get my company added to Korpo?",
    a: "If your company isn't on our approved list yet, you can request it from the sign-in page. We review company domain requests within 1–2 business days. All we need is a valid corporate domain (e.g., yourcompany.com).",
  },
  {
    q: "I verified my email but my account says 'unknown company'. What now?",
    a: "Your corporate domain may not be approved yet. Use the Contact form below or email us directly with your company name and domain. We'll review and approve it within 24 hours.",
  },
  {
    q: "Can I use a personal Gmail or Yahoo account?",
    a: "No — and that's intentional. Korpo is exclusively for verified corporate emails. Gmail, Yahoo, Outlook personal, Hotmail and all free email providers are blocked by design.",
  },
  {
    q: "How do I report a listing or a user?",
    a: "Every listing has a 'Report' button visible to signed-in users. Reports are reviewed within 24 hours. For urgent safety issues, email us at safety@korpo.in.",
  },
  {
    q: "Is there an app available?",
    a: "Korpo is currently a progressive web app (PWA) — you can add it to your home screen from Chrome or Safari. Dedicated iOS and Android apps are on our roadmap for 2025.",
  },
  {
    q: "How does Premium billing work?",
    a: "Premium is a monthly subscription at ₹99/month, billed through Razorpay. You can cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period.",
  },
]

const contactMethods = [
  {
    icon: Mail,
    title: "Email us",
    desc: "For general enquiries and partnership requests",
    value: "hello@korpo.in",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: MessageSquare,
    title: "Support",
    desc: "For account issues and technical help",
    value: "support@korpo.in",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Clock,
    title: "Response time",
    desc: "We typically respond within",
    value: "24 business hours",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: MapPin,
    title: "Based in",
    desc: "Korpo is built and operated from",
    value: "Bangalore, India",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
]

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the Korpo team. We respond within 24 business hours.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#2E86AB] text-white py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <MessageSquare className="h-4 w-4 text-blue-300" />
            We&apos;re here to help
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Get in touch
          </h1>
          <p className="mt-5 text-lg text-blue-100 max-w-xl mx-auto">
            A question, a problem, or just want to say hi? We read every message and respond within one business day.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="py-14 bg-[#F8FAFC] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {contactMethods.map((m) => (
              <div key={m.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className={`h-10 w-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">{m.desc}</p>
                <p className={`text-sm font-medium ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14">

            {/* Contact form */}
            <div>
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">Send us a message</h2>
              <p className="text-gray-500 mb-8">Fill in the form and we&apos;ll get back to you at the email you provide.</p>
              <ContactForm />
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">Frequently asked questions</h2>
              <p className="text-gray-500 mb-8">Quick answers to the most common questions.</p>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <details
                    key={faq.q}
                    className="group border border-gray-200 rounded-2xl bg-[#F8FAFC] overflow-hidden"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-gray-900 text-sm hover:bg-gray-50 transition-colors">
                      {faq.q}
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-3 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
