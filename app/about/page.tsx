import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Users, Zap, Heart, Target, Globe, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/PublicHeader"
import { PublicFooter } from "@/components/layout/PublicFooter"

const stats = [
  { value: "50,000+", label: "Verified Employees"   },
  { value: "200+",    label: "Companies Onboarded"  },
  { value: "10+",     label: "Services on Platform" },
  { value: "0",       label: "Fake Profiles"        },
]

const values = [
  {
    icon: ShieldCheck,
    title: "Trust First",
    desc: "Every member is verified via their corporate email. No exceptions. No shortcuts. Trust is the foundation everything else is built on.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "Karpo exists because of the people who use it. We build features our members ask for, and we measure success by their satisfaction.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Zap,
    title: "Radically Simple",
    desc: "Complex problems deserve simple solutions. Whether you're buying a phone or finding a flatmate, Karpo makes it feel effortless.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Heart,
    title: "Privacy Respected",
    desc: "Your phone number, email and personal details are never shown publicly. All contact happens through our secure in-app messaging.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Target,
    title: "Quality over Quantity",
    desc: "A smaller, verified network beats a massive, fake one every time. We'd rather have 1,000 real users than 100,000 bots.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Globe,
    title: "Built for India",
    desc: "Designed around how Indian professionals actually live and work — cities, companies, communities, and the hustle that connects them all.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
]

const milestones = [
  { year: "2023", title: "The idea", desc: "Two engineers frustrated by sketchy OLX listings realised the problem: no way to verify who you're dealing with." },
  { year: "2024", title: "Private beta", desc: "Launched to 500 employees across 3 Bangalore IT companies. Marketplace, rentals and referrals went live." },
  { year: "2025", title: "Scale & expand", desc: "10 services, 4 cities, 200+ companies. Premium launched. Rides, events, deals and more went live." },
  { year: "2026+", title: "The vision", desc: "Every major Indian city. Every Fortune 500 company with an India office. One verified corporate network." },
]

export const metadata = {
  title: "About Us",
  description: "Learn about Karpo — India's first verified corporate employee marketplace built on trust.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#2E86AB] text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <Heart className="h-4 w-4 text-rose-300" />
            Our story
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance">
            Built for people who show up<br />
            <span className="text-[#7DD3F8]">with a badge every day.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
            Karpo started with a simple question: why should you trust a stranger online when you already trust your colleague sitting two floors above you?
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Origin story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-6">
                The problem we set out to solve
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  India has millions of corporate employees — engineers, analysts, consultants, bankers — who work in the same buildings, commute the same routes, and live in the same neighbourhoods. Yet when they needed to sell a laptop, find a flatmate or get a job referral, they had to turn to public marketplaces filled with strangers, scammers and fake listings.
                </p>
                <p>
                  The existing solutions had no way to distinguish a verified Infosys engineer from an anonymous fraudster. Trust was luck, not structure.
                </p>
                <p>
                  <span className="font-semibold text-[#1E3A5F]">Karpo changes that.</span> Your corporate email is your identity. Your badge is your reputation. Everyone on Karpo is who they say they are — because they&apos;ve already proved it to their employer.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                {[
                  "Verified via OTP sent to corporate inbox — no fake signups possible",
                  "Domain whitelist: only approved companies get access",
                  "Reputation scores and reviews after every transaction",
                  "Zero phone/email exposed publicly — all contact is in-app",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-gray-600 text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-[#1E3A5F] to-[#2E86AB] flex items-center justify-center shadow-2xl">
                  <Image
                    src="/logo.png"
                    alt="Karpo"
                    width={180}
                    height={180}
                    className="object-contain drop-shadow-xl"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white border border-gray-100 rounded-2xl shadow-lg px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-[#1E3A5F]">0</p>
                  <p className="text-xs text-gray-500">Fake profiles<br />ever</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-6">Our mission</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            To make every interaction between corporate professionals — buying, selling, renting, commuting, hiring, learning — as safe and straightforward as talking to a trusted colleague.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-6 text-left">
            {[
              { title: "For individuals", desc: "Access a verified peer network that makes every transaction safer, faster and less stressful." },
              { title: "For companies",   desc: "Give employees a trusted private marketplace as part of their benefits — at zero cost to the organisation." },
              { title: "For India",       desc: "Build the trust layer that corporate India has always needed but never had." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-semibold text-[#1E3A5F] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">What we stand for</h2>
            <p className="mt-3 text-gray-500">The principles we refuse to compromise on.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-[#F8FAFC] rounded-2xl p-6 border border-gray-100">
                <div className={`h-11 w-11 rounded-xl ${v.bg} flex items-center justify-center mb-4`}>
                  <v.icon className={`h-5 w-5 ${v.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-br from-[#1E3A5F] to-[#2E86AB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Our journey</h2>
            <p className="mt-3 text-blue-200">From an idea to India&apos;s most trusted corporate network.</p>
          </div>
          <div className="relative">
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-white/20" />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={m.year} className={`relative flex gap-6 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? "sm:text-right sm:pr-10" : "sm:pl-10"} pl-16 sm:pl-0`}>
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-5">
                      <span className="text-[#7DD3F8] text-xs font-bold uppercase tracking-widest">{m.year}</span>
                      <h3 className="font-semibold text-lg mt-1 mb-2">{m.title}</h3>
                      <p className="text-blue-200 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                  <div className="absolute left-3 sm:static sm:flex-none sm:flex sm:items-start sm:pt-5">
                    <div className="h-6 w-6 rounded-full bg-[#7DD3F8] border-4 border-[#1E3A5F] shadow-lg" />
                  </div>
                  <div className="hidden sm:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-4">
            Join the verified network
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Sign in with your corporate email and become part of India&apos;s most trusted professional community. It takes under a minute.
          </p>
          <Button asChild size="xl">
            <Link href="/auth/signin">
              Get started with your work email <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 text-gray-500 text-sm">Free forever for core services · Premium from ₹99/month</p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
