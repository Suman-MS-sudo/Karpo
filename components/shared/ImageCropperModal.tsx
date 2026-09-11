"use client"
import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { Loader2, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCroppedImageBlob } from "@/lib/cropImage"

interface Props {
  imageSrc: string
  aspect?: number
  onCancel: () => void
  onConfirm: (blob: Blob) => void | Promise<void>
}

export function ImageCropperModal({ imageSrc, aspect = 1, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      await onConfirm(blob)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Adjust your photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative w-full bg-black" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={handleConfirm} disabled={saving || !croppedAreaPixels}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save photo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
