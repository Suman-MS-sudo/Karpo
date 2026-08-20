import Link from "next/link"
import { PackageX, ArrowLeft } from "lucide-react"

export function GoneNotice({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <PackageX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">This post is no longer available</h1>
      <p className="text-muted-foreground text-sm mb-6">
        It may have been removed, sold, or closed by its owner.
      </p>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
    </div>
  )
}
