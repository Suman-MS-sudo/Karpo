"use client"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  images: string[]
  title: string
  isSold?: boolean
  isBoostActive?: boolean
  boostLevel?: string | null
}

export function ListingImageGallery({ images, title, isSold, isBoostActive, boostLevel }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length])

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightbox(true) }
  const prevLightbox = useCallback(() => setLightboxIdx((i) => (i - 1 + images.length) % images.length), [images.length])
  const nextLightbox = useCallback(() => setLightboxIdx((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      setLightbox(false)
      if (e.key === "ArrowLeft")   prevLightbox()
      if (e.key === "ArrowRight")  nextLightbox()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [lightbox, prevLightbox, nextLightbox])

  if (images.length === 0) return null

  return (
    <>
      <div className="p-2 space-y-2">
        {/* Hero image */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted group">
          <Image
            src={images[current]}
            alt={title}
            fill
            className="object-contain cursor-zoom-in"
            sizes="(max-width:1024px) 100vw, 66vw"
            priority
            onClick={() => openLightbox(current)}
          />

          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-white tracking-widest border-4 border-white/80 px-6 py-2 rounded-xl rotate-[-12deg] shadow-xl uppercase">Sold</span>
            </div>
          )}

          {!isSold && isBoostActive && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-lg bg-amber-400 text-white">
                {boostLevel === "SUPER" ? "💥 Super Featured" : "⭐ Featured"}
              </span>
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
              <ZoomIn className="h-3 w-3" /> Click to zoom
            </span>
          </div>

          {/* Prev / next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Counter */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
                {current + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.slice(0, 5).map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-all",
                  current === i ? "border-primary-600 ring-1 ring-primary-600" : "border-border hover:border-foreground/30"
                )}
              >
                <Image src={img} alt="" fill className="object-contain" sizes="20vw" />
                {i === 4 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <span className="text-white font-bold text-sm">+{images.length - 5}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Dot indicators for small counts */}
        {images.length > 1 && images.length <= 5 && (
          <div className="flex justify-center gap-1.5 pt-0.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  current === i ? "w-4 bg-primary-600" : "w-1.5 bg-border hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full mx-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
              <Image
                src={images[lightboxIdx]}
                alt={title}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>

          {/* Prev / next */}
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

          {/* Thumbnail strip */}
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
