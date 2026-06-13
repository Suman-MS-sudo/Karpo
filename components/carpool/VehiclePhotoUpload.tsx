"use client"

import { useRef, useState } from "react"
import { Camera, X, Loader2, Upload } from "lucide-react"

interface Props {
  value?: string
  onChange: (url: string) => void
}

async function compressAndUpload(file: File): Promise<string> {
  // Resize to max 800×600 in browser, convert to JPEG
  const bitmap = await createImageBitmap(file)
  const maxW = 800, maxH = 600
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height)
  const w = Math.round(bitmap.width  * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w; canvas.height = h
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h)

  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.82))
  const compressed = new File([blob], "vehicle.jpg", { type: "image/jpeg" })

  const fd = new FormData()
  fd.append("file", compressed)
  const res  = await fetch("/api/upload", { method: "POST", body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Upload failed")
  return data.url as string
}

export function VehiclePhotoUpload({ value, onChange }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError("")
    try {
      const url = await compressAndUpload(file)
      onChange(url)
    } catch (err: any) {
      setError(err.message ?? "Upload failed")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-border aspect-video max-h-52 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Vehicle" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed border-border hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-950/10 transition-all text-muted-foreground disabled:opacity-60"
        >
          {loading
            ? <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            : <Camera className="h-8 w-8" />}
          <div className="text-center">
            <p className="text-sm font-medium">{loading ? "Uploading…" : "Add vehicle photo"}</p>
            <p className="text-xs mt-0.5">Riders will use this to identify your car</p>
          </div>
          {!loading && (
            <span className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
              <Upload className="h-3.5 w-3.5" /> Choose image
            </span>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2 rounded-xl border border-border hover:border-muted-foreground/40 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {loading ? "Uploading…" : "Change photo"}
        </button>
      )}
    </div>
  )
}
