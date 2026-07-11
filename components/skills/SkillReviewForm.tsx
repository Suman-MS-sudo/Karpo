"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  listingId:   string
  orderId:     string
  sellerName:  string
}

function StarPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
            <Star className={`h-5 w-5 transition-colors ${n <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs text-muted-foreground">{["","Poor","Fair","Good","Very Good","Excellent"][value]}</span>}
    </div>
  )
}

export function SkillReviewForm({ listingId, orderId, sellerName }: Props) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const [rating,         setRating]         = useState(0)
  const [ratingQuality,  setRatingQuality]  = useState(0)
  const [ratingComm,     setRatingComm]     = useState(0)
  const [ratingPunctual, setRatingPunctual] = useState(0)
  const [headline, setHeadline]   = useState("")
  const [body,     setBody]       = useState("")
  const [wouldRepeat,  setWouldRepeat]  = useState(true)
  const [isAnonymous,  setIsAnonymous]  = useState(false)

  async function submit() {
    if (rating === 0) { setError("Please select an overall rating"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/skills/${listingId}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, ratingQuality: ratingQuality || undefined, ratingComm: ratingComm || undefined, ratingPunctual: ratingPunctual || undefined, headline: headline || undefined, body: body || undefined, wouldRepeat, isAnonymous }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error submitting review"); return }
      setDone(true); router.refresh()
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">Review posted!</p>
        <p className="text-xs text-muted-foreground mt-1">Thank you for your feedback. It helps the community.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">How was your experience?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Leave a review for {sellerName}</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          onClick={() => setOpen(true)}>
          Write Review
        </Button>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Review {sellerName}</p>
        <button onClick={() => setOpen(false)} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Cancel</button>
      </div>

      {/* Ratings */}
      <div className="space-y-3">
        <StarPicker value={rating}         onChange={setRating}         label="Overall *" />
        <StarPicker value={ratingQuality}  onChange={setRatingQuality}  label="Quality" />
        <StarPicker value={ratingComm}     onChange={setRatingComm}     label="Communication" />
        <StarPicker value={ratingPunctual} onChange={setRatingPunctual} label="Punctuality" />
      </div>

      {/* Text */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Headline</label>
          <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
            placeholder="Summarise your experience in one line"
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Detailed review</label>
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="What went well? What could have been better?"
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {[
          { label: "I would hire this person again", value: wouldRepeat, onChange: setWouldRepeat },
          { label: "Post anonymously",               value: isAnonymous, onChange: setIsAnonymous },
        ].map(({ label, value, onChange }) => (
          <button key={label} type="button" onClick={() => onChange(!value)}
            className="flex items-center gap-2.5 w-full text-left">
            <span className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${value ? "bg-primary-600 border-primary-600 text-white" : "border-input bg-background"}`}>
              {value && "✓"}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button className="w-full" disabled={loading || rating === 0} onClick={submit}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Post Review
      </Button>
    </div>
  )
}
