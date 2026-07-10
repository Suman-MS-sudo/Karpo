"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"

export function RentalCityFilter({ activeCity }: { activeCity: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (city: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (city) params.set("city", city)
    else params.delete("city")
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <CityAutocomplete
      value={activeCity}
      onChange={handleChange}
      placeholder="Search city…"
      className="w-full sm:w-64"
    />
  )
}
