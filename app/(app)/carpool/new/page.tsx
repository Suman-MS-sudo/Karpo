"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatCurrency } from "@/lib/utils"
import type { RouteData } from "@/components/carpool/CarpoolRouteMapPicker"
import { VehiclePhotoUpload } from "@/components/carpool/VehiclePhotoUpload"

const CarpoolRouteMapPicker = dynamic(
  () => import("@/components/carpool/CarpoolRouteMapPicker").then((m) => m.CarpoolRouteMapPicker),
  { ssr: false, loading: () => <div className="h-[340px] rounded-2xl bg-muted animate-pulse border border-border" /> }
)

const CAR_COLORS = [
  { value: "White",  hex: "#f8fafc" },
  { value: "Silver", hex: "#cbd5e1" },
  { value: "Grey",   hex: "#94a3b8" },
  { value: "Black",  hex: "#1e293b" },
  { value: "Blue",   hex: "#3b82f6" },
  { value: "Navy",   hex: "#1e3a5f" },
  { value: "Red",    hex: "#ef4444" },
  { value: "Maroon", hex: "#7f1d1d" },
  { value: "Green",  hex: "#22c55e" },
  { value: "Yellow", hex: "#eab308" },
  { value: "Orange", hex: "#f97316" },
  { value: "Brown",  hex: "#78350f" },
  { value: "Beige",  hex: "#d4a96a" },
]

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all w-full", checked ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30" : "border-border hover:border-muted-foreground/50")}>
      <span className={cn("h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold", checked ? "bg-primary-600 border-primary-600 text-white" : "border-input bg-background")}>
        {checked && "✓"}
      </span>
      <div>
        <p className={cn("text-sm font-medium", checked ? "text-primary-700 dark:text-primary-300" : "")}>{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </button>
  )
}

const FREQ_TRIPS: Record<string, number> = { DAILY: 30, WEEKDAYS: 22, WEEKENDS: 8, WEEKLY: 4, ONCE: 1 }

export default function NewCarpoolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  // Route data from map
  const [routeData, setRouteData] = useState<Partial<RouteData>>({})

  const [form, setForm] = useState({
    departureTime:  "",
    returnTime:     "",
    seatsAvailable: "3",
    pricePerSeat:   "",
    monthlyPassPrice: "",
    frequency:      "",
    vehicleType:    "",
    vehicleNumber:  "",
    vehicleModel:   "",
    vehicleColor:   "",
    vehiclePhoto:   "",
    allowedGender:  "",
    musicPolicy:    "",
    luggagePolicy:  "",
    landmarks:      "",
    notes:          "",
  })
  const [returnTrip,           setReturnTrip]           = useState(false)
  const [acAvailable,          setAcAvailable]          = useState(true)
  const [monthlyPassAvailable, setMonthlyPassAvailable] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const onRouteChange = useCallback((data: Partial<RouteData>) => {
    setRouteData((prev) => ({ ...prev, ...data }))
    // Auto-fill text fields if they aren't yet manually set
    if (data.fromLocation) set("_from", data.fromLocation)
    if (data.toLocation)   set("_to",   data.toLocation)
  }, [])

  const pricePerSeat  = parseInt(form.pricePerSeat) || 0
  const freq          = FREQ_TRIPS[form.frequency] ?? 0
  const weeklyEst     = Math.round(pricePerSeat * freq / 4)
  const monthlyEst    = pricePerSeat * freq

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!routeData.fromLat || !routeData.toLat) {
      setError("Please select the route on the map (set From and To points)"); return
    }
    setLoading(true); setError("")
    try {
      const stops = routeData.stops ?? []
      const res = await fetch("/api/carpool", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fromLocation:   routeData.fromLocation,
          fromLat:        routeData.fromLat,
          fromLng:        routeData.fromLng,
          toLocation:     routeData.toLocation,
          toLat:          routeData.toLat,
          toLng:          routeData.toLng,
          stopCoords:     stops,
          pickupPoints:   stops.map((s) => s.name),
          landmarks:      form.landmarks || undefined,
          departureTime:  form.departureTime,
          returnTrip,
          returnTime:     form.returnTime || undefined,
          seatsAvailable: parseInt(form.seatsAvailable),
          pricePerSeat:   parseInt(form.pricePerSeat),
          monthlyPassAvailable,
          monthlyPassPrice: form.monthlyPassPrice ? parseInt(form.monthlyPassPrice) : undefined,
          frequency:      form.frequency,
          vehicleType:    form.vehicleType,
          vehicleNumber:  form.vehicleNumber  || undefined,
          vehicleModel:   form.vehicleModel   || undefined,
          vehicleColor:   form.vehicleColor   || undefined,
          vehiclePhoto:   form.vehiclePhoto   || undefined,
          acAvailable,
          allowedGender:  form.allowedGender || undefined,
          musicPolicy:    form.musicPolicy   || undefined,
          luggagePolicy:  form.luggagePolicy || undefined,
          notes:          form.notes         || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/carpool/${data.id}`)
      else setError(data.error ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/carpool" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Carpool
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Offer a Carpool Ride</h1>
        <p className="text-muted-foreground text-sm mt-1">Pin your route on the map — riders will see exactly where you go and can select their stop.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: Route on map ──────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="font-semibold">Route <span className="text-xs font-normal text-muted-foreground">(required — pin on map)</span></h2>
          </div>

          <CarpoolRouteMapPicker onChange={onRouteChange} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From — confirmed name</Label>
              <Input
                value={routeData.fromLocation ?? ""}
                onChange={(e) => setRouteData((r) => ({ ...r, fromLocation: e.target.value }))}
                placeholder="Auto-filled from map"
              />
            </div>
            <div className="space-y-1.5">
              <Label>To — confirmed name</Label>
              <Input
                value={routeData.toLocation ?? ""}
                onChange={(e) => setRouteData((r) => ({ ...r, toLocation: e.target.value }))}
                placeholder="Auto-filled from map"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Landmarks / waypoints <span className="text-muted-foreground text-xs font-normal">optional</span></Label>
            <Input placeholder="e.g. Passes via Cyber Towers, IKEA signal" value={form.landmarks} onChange={(e) => set("landmarks", e.target.value)} />
          </div>
        </section>

        {/* ── Section 2: Schedule ──────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <h2 className="font-semibold">Schedule</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Departure time <span className="text-red-500">*</span></Label>
              <Input required type="time" value={form.departureTime} onChange={(e) => set("departureTime", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency <span className="text-red-500">*</span></Label>
              <Select required value={form.frequency} onValueChange={(v) => set("frequency", v)}>
                <SelectTrigger><SelectValue placeholder="How often?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily (Mon–Sun)</SelectItem>
                  <SelectItem value="WEEKDAYS">Weekdays (Mon–Fri)</SelectItem>
                  <SelectItem value="WEEKENDS">Weekends (Sat–Sun)</SelectItem>
                  <SelectItem value="WEEKLY">Weekly (same day)</SelectItem>
                  <SelectItem value="ONCE">One-time trip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Toggle label="Return trip available" desc="Riders can also book the return journey" checked={returnTrip} onChange={setReturnTrip} />
          {returnTrip && (
            <div className="ml-4 space-y-1.5">
              <Label>Return departure time</Label>
              <Input type="time" value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} className="w-44" />
            </div>
          )}
        </section>

        {/* ── Section 3: Vehicle & Preferences ─────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <h2 className="font-semibold">Vehicle & Preferences</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vehicle type <span className="text-red-500">*</span></Label>
              <Select required value={form.vehicleType} onValueChange={(v) => set("vehicleType", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="MUV / Van">MUV / Van</SelectItem>
                  <SelectItem value="Electric">Electric vehicle</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Registration plate <span className="text-muted-foreground text-xs font-normal">optional</span></Label>
              <Input placeholder="e.g. KA 01 AB 1234" value={form.vehicleNumber} onChange={(e) => set("vehicleNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle model <span className="text-muted-foreground text-xs font-normal">optional</span></Label>
              <Input placeholder="e.g. Honda City 2022, Maruti Swift" value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Seats available <span className="text-red-500">*</span></Label>
              <Input required type="number" min="1" max="8" value={form.seatsAvailable} onChange={(e) => set("seatsAvailable", e.target.value)} />
              <p className="text-xs text-muted-foreground">Requests exceeding this will be blocked automatically</p>
            </div>
          </div>

          {/* Vehicle color swatches */}
          <div className="space-y-2">
            <Label>Vehicle color <span className="text-muted-foreground text-xs font-normal">optional</span></Label>
            <div className="flex flex-wrap gap-2">
              {CAR_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("vehicleColor", form.vehicleColor === c.value ? "" : c.value)}
                  title={c.value}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    form.vehicleColor === c.value
                      ? "border-primary-500 scale-110 shadow-md"
                      : "border-border hover:scale-105"
                  )}
                  style={{ background: c.hex }}
                />
              ))}
              {form.vehicleColor && (
                <span className="self-center text-sm font-medium ml-1">{form.vehicleColor}</span>
              )}
            </div>
          </div>

          {/* Vehicle photo */}
          <div className="space-y-1.5">
            <Label>Vehicle photo <span className="text-muted-foreground text-xs font-normal">optional — helps riders identify your car</span></Label>
            <VehiclePhotoUpload
              value={form.vehiclePhoto}
              onChange={(url) => set("vehiclePhoto", url)}
            />
          </div>

          <Toggle label="AC available" checked={acAvailable} onChange={setAcAvailable} />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Rider preference</Label>
              <Select value={form.allowedGender} onValueChange={(v) => set("allowedGender", v)}>
                <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_PREFERENCE">No preference</SelectItem>
                  <SelectItem value="MALE">Male only</SelectItem>
                  <SelectItem value="FEMALE">Female only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Music policy</Label>
              <Select value={form.musicPolicy} onValueChange={(v) => set("musicPolicy", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Music OK</SelectItem>
                  <SelectItem value="LIGHT">Soft music only</SelectItem>
                  <SelectItem value="NO_MUSIC">Silent ride</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Luggage policy</Label>
              <Select value={form.luggagePolicy} onValueChange={(v) => set("luggagePolicy", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any luggage OK</SelectItem>
                  <SelectItem value="SMALL">Small bags only</SelectItem>
                  <SelectItem value="NO_LUGGAGE">No extra luggage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ── Section 4: Pricing ───────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
            <h2 className="font-semibold">Pricing</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Price per seat (₹) <span className="text-red-500">*</span></Label>
              <Input required type="number" min="0" placeholder="50" value={form.pricePerSeat} onChange={(e) => set("pricePerSeat", e.target.value)} />
              <p className="text-xs text-muted-foreground">Per trip, per seat</p>
            </div>
          </div>

          {/* Live cost preview */}
          {pricePerSeat > 0 && form.frequency && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost preview for riders</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{formatCurrency(pricePerSeat)}</p>
                  <p className="text-xs text-muted-foreground">per trip</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(weeklyEst)}</p>
                  <p className="text-xs text-muted-foreground">per week (est.)</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(monthlyEst)}</p>
                  <p className="text-xs text-muted-foreground">per month (est.)</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Based on {freq} trips/month for {form.frequency?.toLowerCase().replace("_", " ")}</p>
            </div>
          )}

          <Toggle label="Offer a monthly pass" desc="Riders can pay a flat monthly rate instead of per-trip" checked={monthlyPassAvailable} onChange={setMonthlyPassAvailable} />
          {monthlyPassAvailable && (
            <div className="ml-4 space-y-1.5">
              <Label>Monthly pass price (₹)</Label>
              <Input type="number" min="0" placeholder="800" value={form.monthlyPassPrice} onChange={(e) => set("monthlyPassPrice", e.target.value)} className="w-48" />
              {pricePerSeat > 0 && form.monthlyPassPrice && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Saves rider {formatCurrency(monthlyEst - parseInt(form.monthlyPassPrice))} vs per-trip
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Additional notes <span className="text-muted-foreground text-xs font-normal">optional</span></Label>
            <Textarea rows={3} placeholder="Timing flexibility, contact preference, other rules…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </section>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting…</> : "Post Route"}
        </Button>
      </form>
    </div>
  )
}
