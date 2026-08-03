"use client"

import { useRouter, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CATEGORY_LABELS: Record<string, string> = {
  BUG:             "App Functionality / Error",
  FEATURE_REQUEST: "Feature Request",
  PAYMENT:         "Payment",
  ACCOUNT:         "Account",
  OTHER:           "Other",
}

const STATUS_OPTIONS = [
  { value: "OPEN",        label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED",    label: "Resolved" },
  { value: "DISMISSED",   label: "Dismissed" },
]

const RANGE_OPTIONS = [
  { value: "30",  label: "Last 30 days" },
  { value: "90",  label: "Last 90 days" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
]

export function ConcernsFilterBar({
  category,
  status,
  range,
}: {
  category: string
  status: string
  range: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  function update(next: Partial<{ category: string; status: string; range: string }>) {
    const params = new URLSearchParams({ category, status, range, ...next })
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 bg-card border border-border rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Category</label>
        <Select value={category} onValueChange={(v) => update({ category: v })}>
          <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select value={status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All statuses</SelectItem>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Submitted</label>
        <Select value={range} onValueChange={(v) => update({ range: v })}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
