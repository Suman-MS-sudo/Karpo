"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import {
  ArrowLeft, Upload, X, Loader2, Home, MapPin,
  IndianRupee, Wrench, Car, Zap, Droplets, Flame,
  Wifi, ShieldCheck, Users, ChevronRight,
  BedDouble, Bath, Building2, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CITIES } from "@/config/services"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"

const MapPicker = dynamic(
  () => import("@/components/rentals/MapPicker").then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-[300px] rounded-xl bg-muted animate-pulse border border-border" /> }
)

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES     = ["APARTMENT","ROOM","PG","FLATMATE","STUDIO","VILLA"]
const BHK_OPTS  = ["1BHK","2BHK","3BHK","4BHK+","Studio","Room","PG Room"]
const FURNISHED = ["UNFURNISHED","SEMI","FULLY"]
const GENDER    = ["ANY","MALE","FEMALE"]
const OCCUPANCY = ["SINGLE","DOUBLE","TRIPLE"]
const FACING    = ["North","South","East","West","North-East","North-West","South-East","South-West"]
const PROP_AGE  = [{ value:"LESS_1",label:"< 1 Year" },{ value:"1_5",label:"1–5 Years" },{ value:"5_10",label:"5–10 Years" },{ value:"10_PLUS",label:"10+ Years" }]
const PARKING_OPTS = [{ value:"NONE",label:"None" },{ value:"OPEN",label:"Open" },{ value:"COVERED",label:"Covered" }]
const WATER_OPTS   = [{ value:"24_7",label:"24/7" },{ value:"SCHEDULED",label:"Scheduled" },{ value:"TANKER",label:"Tanker" },{ value:"CORPORATION",label:"Corporation" }]
const POWER_OPTS   = [{ value:"NONE",label:"None" },{ value:"FULL",label:"Full Backup" },{ value:"PARTIAL",label:"Partial" },{ value:"GENERATOR",label:"Generator" },{ value:"INVERTER",label:"Inverter" }]
const GAS_OPTS     = [{ value:"NONE",label:"None" },{ value:"PIPED",label:"Piped" },{ value:"CYLINDER",label:"Cylinder" }]
const INTERNET_OPTS= [{ value:"NOT_INCLUDED",label:"Not Included" },{ value:"INCLUDED",label:"Included" },{ value:"NEGOTIABLE",label:"Negotiable" }]
const BROKERAGE_OPTS=[{ value:"NONE",label:"No Brokerage" },{ value:"ONE_MONTH",label:"1 Month Rent" },{ value:"NEGOTIABLE",label:"Negotiable" }]

const AMENITIES = [
  "WiFi","AC","Parking","Laundry","Gym","Power Backup",
  "Lift","Security","Meals","Geyser","CCTV",
  "Swimming Pool","Garden","Balcony","Modular Kitchen","Club House",
]

const FURNISHING_ITEMS = [
  { key:"BED",     label:"Bed",            icon:"🛏" },
  { key:"SOFA",    label:"Sofa",           icon:"🛋" },
  { key:"WARDROBE",label:"Wardrobe",       icon:"🚪" },
  { key:"AC",      label:"AC",             icon:"❄️" },
  { key:"TV",      label:"TV",             icon:"📺" },
  { key:"FRIDGE",  label:"Refrigerator",   icon:"🧊" },
  { key:"WASHING", label:"Washing Machine",icon:"🫧" },
  { key:"MICRO",   label:"Microwave",      icon:"📡" },
  { key:"GEYSER",  label:"Geyser",         icon:"🚿" },
  { key:"STUDY",   label:"Study Table",    icon:"📚" },
  { key:"DINING",  label:"Dining Table",   icon:"🍽" },
  { key:"CURTAIN", label:"Curtains",       icon:"🪞" },
]

const SECTIONS = [
  { id:"basic",      label:"Basic Info",    icon: Home },
  { id:"location",   label:"Location",      icon: MapPin },
  { id:"finances",   label:"Finances",      icon: IndianRupee },
  { id:"property",   label:"Property",      icon: Building2 },
  { id:"furnishings",label:"Furnishings",   icon: BedDouble },
  { id:"parking",    label:"Parking",       icon: Car },
  { id:"utilities",  label:"Utilities",     icon: Zap },
  { id:"amenities",  label:"Amenities",     icon: Wrench },
  { id:"rules",      label:"Rules",         icon: ShieldCheck },
  { id:"description",label:"Description",   icon: Info },
  { id:"photos",     label:"Photos",        icon: Upload },
]

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const SECTION_CLASS = "bg-card border border-border rounded-2xl overflow-hidden"
const SH = "px-6 py-4 border-b border-border flex items-center gap-2.5"
const BODY  = "p-6 space-y-5"
const LABEL = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5"
const INPUT = "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-colors"
const SELECT = `${INPUT} cursor-pointer`

function SectionHeader({ id, icon: Icon, label, num }: { id:string; icon:any; label:string; num:number }) {
  return (
    <div className={SH} id={id}>
      <div className="h-7 w-7 rounded-lg bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary-600" />
      </div>
      <h2 className="font-semibold text-sm">{label}</h2>
      <span className="ml-auto text-xs text-muted-foreground font-medium">{num}/{SECTIONS.length}</span>
    </div>
  )
}

function Segmented({ value, options, onChange }: { value:string; options:{value:string;label:string}[]; onChange:(v:string)=>void }) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-xl">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            value === o.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function RuleRow({ label, desc, checked, onChange }: { label:string; desc?:string; checked:boolean; onChange:(v:boolean)=>void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-colors group">
      <div>
        <p className="text-sm font-medium group-hover:text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ml-3 ${checked ? "bg-primary-600" : "bg-muted-foreground/25"}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormState = {
  title: string; type: string; phone: string
  city: string; area: string; societyName: string; landmark: string; fullAddress: string
  latitude: number | null; longitude: number | null
  rent: string; deposit: string; maintenanceAmt: string; maintenanceIncluded: boolean
  brokerage: string; availableFrom: string
  bhk: string; furnished: string; carpetArea: string
  floor: string; totalFloors: string; bathrooms: string; balconies: string
  propertyAge: string; facing: string
  gender: string; occupancy: string
  twoWheelerParking: string; fourWheelerParking: string; visitorParking: boolean
  waterSupply: string; powerBackup: string; gasType: string; internet: string
  workingProfOnly: boolean; studentsAllowed: boolean; couplesAllowed: boolean
  familiesAllowed: boolean; smokingAllowed: boolean; alcoholAllowed: boolean
  vegetarianOnly: boolean; visitorsAllowed: boolean; nonVegAllowed: boolean; petsAllowed: boolean
  description: string
}

export default function NewRentalPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading]         = useState(false)
  const [images, setImages]           = useState<string[]>([])
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef                  = useRef<HTMLInputElement>(null)
  const [amenities, setAmenities]     = useState<string[]>([])
  const [furnishingItems, setFurnishingItems] = useState<string[]>([])

  const [form, setForm] = useState<FormState>({
    title:"", type:"APARTMENT", phone:"",
    city: session?.user?.city ?? "", area:"", societyName:"", landmark:"", fullAddress:"",
    latitude: null, longitude: null,
    rent:"", deposit:"", maintenanceAmt:"", maintenanceIncluded: false,
    brokerage:"NONE", availableFrom:"",
    bhk:"", furnished:"UNFURNISHED", carpetArea:"",
    floor:"", totalFloors:"", bathrooms:"1", balconies:"0",
    propertyAge:"", facing:"",
    gender:"ANY", occupancy:"SINGLE",
    twoWheelerParking:"NONE", fourWheelerParking:"NONE", visitorParking: false,
    waterSupply:"24_7", powerBackup:"NONE", gasType:"NONE", internet:"NOT_INCLUDED",
    workingProfOnly:false, studentsAllowed:true, couplesAllowed:false,
    familiesAllowed:true, smokingAllowed:false, alcoholAllowed:false,
    vegetarianOnly:false, visitorsAllowed:true, nonVegAllowed:true, petsAllowed:false,
    description:"",
  })

  const set = (k: keyof FormState, v: any) => setForm((p) => ({ ...p, [k]: v }))
  const setStr = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(k, e.target.value)

  const toggleAmenity = (a: string) => setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a])
  const toggleFurnishing = (k: string) => setFurnishingItems((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot files immediately — do NOT reference e.target after any await
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    const remaining = 10 - images.length
    const files = selected.slice(0, remaining)
    setUploadError(selected.length > remaining ? `Only ${remaining} more photo${remaining === 1 ? "" : "s"} can be added — max 10 total.` : "")
    if (!files.length) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res  = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.url) {
          setUploadError(data?.error ?? `Upload failed (HTTP ${res.status})`)
          continue
        }
        setImages((prev) => [...prev, data.url as string])
      }
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed — check your connection")
    } finally {
      setUploading(false)
      // Clear via ref so we never touch e.target after awaits
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rent:         parseInt(form.rent),
          deposit:      form.deposit      ? parseInt(form.deposit)      : undefined,
          maintenanceAmt: form.maintenanceAmt ? parseInt(form.maintenanceAmt) : undefined,
          carpetArea:   form.carpetArea   ? parseInt(form.carpetArea)   : undefined,
          floor:        form.floor        ? parseInt(form.floor)        : undefined,
          totalFloors:  form.totalFloors  ? parseInt(form.totalFloors)  : undefined,
          bathrooms:    parseInt(form.bathrooms),
          balconies:    parseInt(form.balconies),
          availableFrom: new Date(form.availableFrom),
          amenities,
          images,
          furnishingItems,
        }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/rentals/${data.id}`)
      else alert(data.error ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const needsGender    = ["PG","FLATMATE"].includes(form.type)
  const needsOccupancy = form.type === "PG"
  const showFurnishings = ["SEMI","FULLY"].includes(form.furnished)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" })
  }

  const hasProgress = images.length > 0 || form.title.trim() !== "" || form.rent.trim() !== "" || form.area.trim() !== ""

  const handleLeave = () => {
    if (hasProgress && !confirm("You have unsaved progress on this listing. Leave without saving?")) return
    router.push("/rentals")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        type="button"
        onClick={handleLeave}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rentals
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Home className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Post a Rental / Flatmate</h1>
          <p className="text-sm text-muted-foreground">Fill in all details to attract the right tenants</p>
        </div>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Sticky section nav ─────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-0.5 w-44 sticky top-8 shrink-0">
          {SECTIONS.map(({ id, label, icon: Icon }, i) => (
            <button key={id} type="button" onClick={() => scrollTo(id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-left group">
              <Icon className="h-3.5 w-3.5 shrink-0 group-hover:text-primary-600 transition-colors" />
              <span>{label}</span>
            </button>
          ))}
        </aside>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 min-w-0">

          {/* ① Basic Info */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="basic" icon={Home} label="Basic Info" num={1} />
            <div className={BODY}>
              <div>
                <label className={LABEL}>Listing Title *</label>
                <input required className={INPUT} placeholder="e.g. Spacious 2BHK near Metro, Whitefield" value={form.title} onChange={setStr("title")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Property Type *</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => set("type", t)}
                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                          form.type === t ? "bg-primary-600 text-white border-primary-600 shadow-sm" : "border-border text-muted-foreground hover:border-primary-400 hover:text-foreground"
                        }`}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Contact Phone</label>
                  <input type="tel" className={INPUT} placeholder="+91 98765 43210" value={form.phone} onChange={setStr("phone")} />
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Shared only with accepted inquirers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ② Location */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="location" icon={MapPin} label="Location" num={2} />
            <div className={BODY}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>City *</label>
                  <CityAutocomplete
                    required
                    value={form.city}
                    onChange={(city) => set("city", city)}
                    placeholder="Select city"
                  />
                </div>
                <div>
                  <label className={LABEL}>Area / Locality *</label>
                  <input required className={INPUT} placeholder="e.g. Whitefield" value={form.area} onChange={setStr("area")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Society / Building Name</label>
                  <input className={INPUT} placeholder="e.g. Brigade Gateway" value={form.societyName} onChange={setStr("societyName")} />
                </div>
                <div>
                  <label className={LABEL}>Landmark</label>
                  <input className={INPUT} placeholder="e.g. Near Forum Mall" value={form.landmark} onChange={setStr("landmark")} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Full Address</label>
                <input className={INPUT} placeholder="Flat no, building, street, area…" value={form.fullAddress} onChange={setStr("fullAddress")} />
              </div>
              <div>
                <label className={LABEL}>Pin Location on Map</label>
                <MapPicker
                  cityHint={form.city}
                  latitude={form.latitude ?? undefined}
                  longitude={form.longitude ?? undefined}
                  onSelect={(lat, lng, addr) => {
                    set("latitude", lat)
                    set("longitude", lng)
                    if (!form.fullAddress) set("fullAddress", addr)
                  }}
                />
              </div>
            </div>
          </div>

          {/* ③ Finances */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="finances" icon={IndianRupee} label="Finances" num={3} />
            <div className={BODY}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Monthly Rent (₹) *</label>
                  <input required type="number" min="0" className={INPUT} placeholder="15,000" value={form.rent} onChange={setStr("rent")} />
                </div>
                <div>
                  <label className={LABEL}>Security Deposit (₹)</label>
                  <input type="number" min="0" className={INPUT} placeholder="30,000" value={form.deposit} onChange={setStr("deposit")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Maintenance (₹/month)</label>
                  <input type="number" min="0" className={INPUT} placeholder="500" value={form.maintenanceAmt} onChange={setStr("maintenanceAmt")} />
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-primary-600 rounded"
                      checked={form.maintenanceIncluded} onChange={(e) => set("maintenanceIncluded", e.target.checked)} />
                    <span className="text-xs text-muted-foreground">Included in rent</span>
                  </label>
                </div>
                <div>
                  <label className={LABEL}>Available From *</label>
                  <input required type="date" className={INPUT} value={form.availableFrom}
                    min={new Date().toISOString().split("T")[0]} onChange={setStr("availableFrom")} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Brokerage</label>
                <Segmented value={form.brokerage} options={BROKERAGE_OPTS} onChange={(v) => set("brokerage", v)} />
              </div>
            </div>
          </div>

          {/* ④ Property Details */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="property" icon={Building2} label="Property Details" num={4} />
            <div className={BODY}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>BHK / Room Type</label>
                  <select className={SELECT} value={form.bhk} onChange={setStr("bhk")}>
                    <option value="">Select</option>
                    {BHK_OPTS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Carpet Area (sq ft)</label>
                  <input type="number" min="0" className={INPUT} placeholder="850" value={form.carpetArea} onChange={setStr("carpetArea")} />
                </div>
                <div>
                  <label className={LABEL}>Furnishing</label>
                  <select className={SELECT} value={form.furnished} onChange={setStr("furnished")}>
                    {FURNISHED.map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className={LABEL}>Floor</label>
                  <input type="number" min="0" className={INPUT} placeholder="3" value={form.floor} onChange={setStr("floor")} />
                </div>
                <div>
                  <label className={LABEL}>Total Floors</label>
                  <input type="number" min="1" className={INPUT} placeholder="10" value={form.totalFloors} onChange={setStr("totalFloors")} />
                </div>
                <div>
                  <label className={LABEL}>Bathrooms</label>
                  <select className={SELECT} value={form.bathrooms} onChange={setStr("bathrooms")}>
                    {["1","2","3","4+"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Balconies</label>
                  <select className={SELECT} value={form.balconies} onChange={setStr("balconies")}>
                    {["0","1","2","3"].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Property Age</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PROP_AGE.map((a) => (
                      <button key={a.value} type="button" onClick={() => set("propertyAge", form.propertyAge === a.value ? "" : a.value)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                          form.propertyAge === a.value ? "bg-primary-600 text-white border-primary-600" : "border-border text-muted-foreground hover:border-primary-400"
                        }`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Facing</label>
                  <div className="grid grid-cols-4 gap-1">
                    {FACING.map((f) => (
                      <button key={f} type="button" onClick={() => set("facing", form.facing === f ? "" : f)}
                        className={`py-1.5 rounded-lg text-[10px] font-medium border text-center transition-all ${
                          form.facing === f ? "bg-primary-600 text-white border-primary-600" : "border-border text-muted-foreground hover:border-primary-400"
                        }`}>
                        {f.split("-").map(w => w[0]).join("")}
                      </button>
                    ))}
                  </div>
                  {form.facing && <p className="text-xs text-muted-foreground mt-1">{form.facing} facing</p>}
                </div>
              </div>
              {(needsGender || needsOccupancy) && (
                <div className="grid grid-cols-2 gap-4">
                  {needsGender && (
                    <div>
                      <label className={LABEL}>Preferred Gender</label>
                      <Segmented value={form.gender} options={GENDER.map((g) => ({ value:g, label: g.charAt(0)+g.slice(1).toLowerCase() }))} onChange={(v) => set("gender", v)} />
                    </div>
                  )}
                  {needsOccupancy && (
                    <div>
                      <label className={LABEL}>Occupancy Type</label>
                      <Segmented value={form.occupancy} options={OCCUPANCY.map((o) => ({ value:o, label: o.charAt(0)+o.slice(1).toLowerCase() }))} onChange={(v) => set("occupancy", v)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ⑤ Furnishings (shown only if semi/fully furnished) */}
          {showFurnishings && (
            <div className={SECTION_CLASS}>
              <SectionHeader id="furnishings" icon={BedDouble} label="Furnishings Included" num={5} />
              <div className={BODY}>
                <p className="text-xs text-muted-foreground -mt-2">Select all items that are available in the property.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {FURNISHING_ITEMS.map(({ key, label, icon }) => {
                    const active = furnishingItems.includes(key)
                    return (
                      <button key={key} type="button" onClick={() => toggleFurnishing(key)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
                          active ? "bg-primary-50 dark:bg-primary-950/30 border-primary-400 dark:border-primary-600" : "border-border hover:border-foreground/20 hover:bg-muted/40"
                        }`}>
                        <span className="text-xl">{icon}</span>
                        <span className={`text-[11px] font-medium leading-tight ${active ? "text-primary-700 dark:text-primary-300" : "text-muted-foreground"}`}>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ⑥ Parking */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="parking" icon={Car} label="Parking" num={6} />
            <div className={BODY}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL}>Two-Wheeler Parking</label>
                  <Segmented value={form.twoWheelerParking} options={PARKING_OPTS} onChange={(v) => set("twoWheelerParking", v)} />
                </div>
                <div>
                  <label className={LABEL}>Four-Wheeler Parking</label>
                  <Segmented value={form.fourWheelerParking} options={PARKING_OPTS} onChange={(v) => set("fourWheelerParking", v)} />
                </div>
              </div>
              <RuleRow label="Visitor Parking Available" checked={form.visitorParking} onChange={(v) => set("visitorParking", v)} />
            </div>
          </div>

          {/* ⑦ Utilities */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="utilities" icon={Zap} label="Utilities" num={7} />
            <div className={BODY}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL}><Droplets className="inline h-3 w-3 mr-1" />Water Supply</label>
                  <Segmented value={form.waterSupply} options={WATER_OPTS} onChange={(v) => set("waterSupply", v)} />
                </div>
                <div>
                  <label className={LABEL}><Zap className="inline h-3 w-3 mr-1" />Power Backup</label>
                  <Segmented value={form.powerBackup} options={POWER_OPTS} onChange={(v) => set("powerBackup", v)} />
                </div>
                <div>
                  <label className={LABEL}><Flame className="inline h-3 w-3 mr-1" />Gas Supply</label>
                  <Segmented value={form.gasType} options={GAS_OPTS} onChange={(v) => set("gasType", v)} />
                </div>
                <div>
                  <label className={LABEL}><Wifi className="inline h-3 w-3 mr-1" />Internet / Broadband</label>
                  <Segmented value={form.internet} options={INTERNET_OPTS} onChange={(v) => set("internet", v)} />
                </div>
              </div>
            </div>
          </div>

          {/* ⑧ Amenities */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="amenities" icon={Wrench} label="Amenities & Facilities" num={8} />
            <div className={BODY}>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-3.5 py-1.5 rounded-full text-sm border transition-all ${
                      amenities.includes(a) ? "bg-primary-600 text-white border-primary-600 shadow-sm" : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ⑨ Rules & Preferences */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="rules" icon={ShieldCheck} label="Rules & Preferences" num={9} />
            <div className={BODY}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <RuleRow label="Working Professionals Preferred" desc="Ideal for salaried individuals" checked={form.workingProfOnly} onChange={(v) => set("workingProfOnly", v)} />
                <RuleRow label="Students Allowed" checked={form.studentsAllowed} onChange={(v) => set("studentsAllowed", v)} />
                <RuleRow label="Couples Welcome" checked={form.couplesAllowed} onChange={(v) => set("couplesAllowed", v)} />
                <RuleRow label="Families Allowed" checked={form.familiesAllowed} onChange={(v) => set("familiesAllowed", v)} />
                <RuleRow label="Pets Allowed" checked={form.petsAllowed} onChange={(v) => set("petsAllowed", v)} />
                <RuleRow label="Visitors Allowed" desc="Guests permitted inside the property" checked={form.visitorsAllowed} onChange={(v) => set("visitorsAllowed", v)} />
                <RuleRow label="Non-Veg Cooking Allowed" checked={form.nonVegAllowed} onChange={(v) => set("nonVegAllowed", v)} />
                <RuleRow label="Vegetarian Only" desc="Non-veg cooking not permitted" checked={form.vegetarianOnly} onChange={(v) => set("vegetarianOnly", v)} />
                <RuleRow label="Smoking Allowed" checked={form.smokingAllowed} onChange={(v) => set("smokingAllowed", v)} />
                <RuleRow label="Alcohol Allowed" checked={form.alcoholAllowed} onChange={(v) => set("alcoholAllowed", v)} />
              </div>
            </div>
          </div>

          {/* ⑩ Description */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="description" icon={Info} label="Description" num={10} />
            <div className={BODY}>
              <textarea className={`${INPUT} resize-none`} rows={6}
                placeholder="Describe the property — neighbourhood feel, nearby transport, house rules, what kind of tenant you're looking for, special features…"
                value={form.description} onChange={setStr("description")} />
              <p className="text-xs text-muted-foreground">A detailed description gets 3× more inquiries.</p>
            </div>
          </div>

          {/* ⑪ Photos */}
          <div className={SECTION_CLASS}>
            <SectionHeader id="photos" icon={Upload} label="Photos" num={11} />
            <div className={BODY}>
              <p className="text-xs text-muted-foreground -mt-2">Upload up to 10 photos. First photo is the cover image.</p>

              {uploadError && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  <X className="h-4 w-4 shrink-0" />
                  {uploadError}
                  <button type="button" onClick={() => setUploadError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              <div className="grid grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div key={img} className={`relative aspect-square rounded-xl overflow-hidden border border-border ${i === 0 ? "ring-2 ring-primary-500" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[8px] bg-primary-600 text-white px-1.5 py-0.5 rounded-md font-bold">COVER</span>
                    )}
                    <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Uploading spinner tile */}
                {uploading && (
                  <div className="aspect-square rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 flex flex-col items-center justify-center bg-primary-50/50 dark:bg-primary-950/20">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500 mb-1" />
                    <span className="text-[10px] text-primary-500">Uploading…</span>
                  </div>
                )}

                {!uploading && images.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted hover:border-foreground/20 transition-all group">
                    <Upload className="h-5 w-5 text-muted-foreground mb-1 group-hover:text-foreground transition-colors" />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground">Add Photo</span>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleLeave}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="flex-2 flex-1" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing…</>
              ) : (
                <>Post Listing <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
