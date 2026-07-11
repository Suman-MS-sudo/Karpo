"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PencilLine, Upload, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  rentalId: string
  initialImages: string[]
}

export function RentalPhotoManager({ rentalId, initialImages }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    const remaining = 10 - images.length
    const files = selected.slice(0, remaining)
    setError(selected.length > remaining ? `Only ${remaining} more photo${remaining === 1 ? "" : "s"} can be added — max 10 total.` : "")
    if (!files.length) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.url) {
          setError(data?.error ?? `Upload failed (HTTP ${res.status})`)
          continue
        }
        setImages((prev) => [...prev, data.url as string])
      }
    } catch (err: any) {
      setError(err?.message ?? "Upload failed — check your connection")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (i: number) => setImages((p) => p.filter((_, j) => j !== i))

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/rentals/${rentalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Could not save photos — please try again")
      }
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setImages(initialImages)
    setError("")
    setOpen(false)
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PencilLine className="h-3.5 w-3.5" /> Manage Photos
      </Button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
      onClick={cancel}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Manage Photos <span className="text-muted-foreground font-normal">({images.length}/10)</span></h3>
        <button onClick={cancel}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
          {error}
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
            <button type="button" onClick={() => removeImage(i)}
              className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {uploading && (
          <div className="aspect-square rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 flex flex-col items-center justify-center bg-primary-50/50 dark:bg-primary-950/20">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500 mb-1" />
            <span className="text-[10px] text-primary-500">Uploading…</span>
          </div>
        )}

        {!uploading && images.length < 10 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted hover:border-foreground/20 transition-all group"
          >
            <Upload className="h-5 w-5 text-muted-foreground mb-1 group-hover:text-foreground transition-colors" />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground">Add Photo</span>
          </button>
        )}
        {/* Hidden input — display:none prevents scroll-to-top on focus */}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30" onClick={cancel} disabled={saving}>Cancel</Button>
        <Button size="sm" className="flex-1 gap-2" onClick={save} disabled={saving || uploading || images.length === 0}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : "Save Photos"}
        </Button>
      </div>
      </div>
    </div>
  )
}
