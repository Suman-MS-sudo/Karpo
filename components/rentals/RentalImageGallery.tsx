"use client"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, ZoomIn, Eye, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  images: string[]
  title: string
  isFilled?: boolean
  typeLabel: string
  typeColor: string
  furnishedLabel?: string | null
  viewCount: number
}

export function RentalImageGallery({ images, title, isFilled, typeLabel, typeColor, furnishedLabel, viewCount }: Props) {
  const [lightbox, setLightbox] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightbox(true) }
  const prevLightbox = useCallback(() => setLightboxIdx((i) => (i - 1 + images.length) % images.length), [images.length])
  const nextLightbox = useCallback(() => setLightboxIdx((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     setLightbox(false)
      if (e.key === "ArrowLeft")  prevLightbox()
      if (e.key === "ArrowRight") nextLightbox()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [lightbox, prevLightbox, nextLightbox])

  if (images.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-muted">
        <div className="aspect-video flex items-center justify-center">
          <Home className="h-12 w-12 text-muted-foreground/20" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border bg-muted">
        <div className="space-y-2 p-2">
          <div className="relative aspect-video rounded-xl overflow-hidden group">
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover cursor-zoom-in"
              priority
              sizes="(max-width:1024px) 100vw, 66vw"
              onClick={() => openLightbox(0)}
            />
            {isFilled && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                <span className="text-white font-extrabold text-2xl uppercase tracking-widest border-4 border-white/80 px-6 py-2 rounded-xl rotate-[-12deg]">Filled</span>
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none">
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${typeColor}`}>{typeLabel}</span>
              {furnishedLabel && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
                  {furnishedLabel}
                </span>
              )}
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
              <Eye className="h-3 w-3" /> {viewCount} views
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                <ZoomIn className="h-3 w-3" /> Click to zoom
              </span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={() => openLightbox(i + 1)}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-zoom-in"
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="25vw" />
                  {i === 3 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                      <span className="text-white font-bold text-sm">+{images.length - 5}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>

          <div className="relative max-w-5xl max-h-[85vh] w-full mx-8" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
              <Image src={images[lightboxIdx]} alt={title} fill className="object-contain" sizes="100vw" />
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevLightbox() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextLightbox() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-lg overflow-x-auto px-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(i) }}
                  className={cn(
                    "relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    lightboxIdx === i ? "border-white" : "border-white/20 opacity-60 hover:opacity-90"
                  )}
                >
                  <Image src={img} alt="" fill className="object-contain" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
