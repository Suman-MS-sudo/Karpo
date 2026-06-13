import { auth } from "@/auth"
import Link from "next/link"
import { Shield, FileText, Scale, Heart, TrendingUp, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const services = [
  { id: "TAX",       title: "Tax Filing",          icon: FileText,   desc: "ITR filing, tax planning, form 16 assistance from verified CAs",                   color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",   iconColor: "text-blue-600 dark:text-blue-400" },
  { id: "LEGAL",     title: "Legal Assistance",    icon: Scale,      desc: "Employment contracts, rental agreements, consumer disputes",                       color: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800", iconColor: "text-purple-600 dark:text-purple-400" },
  { id: "INSURANCE", title: "Insurance Advisory",  icon: Heart,      desc: "Health, life, and vehicle insurance guidance and claims support",                  color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",   iconColor: "text-green-600 dark:text-green-400" },
  { id: "FINANCIAL", title: "Financial Planning",  icon: TrendingUp, desc: "Investment planning, mutual funds, retirement and goal planning",                  color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800", iconColor: "text-orange-600 dark:text-orange-400" },
]

export const dynamic = "force-dynamic"

export default async function ConciergePage() {
  const session = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Concierge Services</h1>
            <p className="text-muted-foreground text-sm">Tax, legal, insurance and financial guidance from vetted professionals</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="premium" className="text-xs px-2.5 py-1 flex items-center gap-1">
            <Crown className="h-3 w-3" />Premium Section
          </Badge>
          {!isPremium && (
            <Link href="/membership" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium">
              Upgrade for boosts →
            </Link>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {services.map(({ id, title, icon: Icon, desc, color, iconColor }) => (
          <Link key={id} href={`/concierge/new?type=${id}`}>
            <div className={`p-6 rounded-2xl border-2 hover:shadow-md transition-all cursor-pointer ${color}`}>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm shrink-0">
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{desc}</p>
                  <Button size="sm" className="mt-3">Get Started →</Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
