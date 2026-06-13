"use client"

import { useState } from "react"
import { Star, ThumbsUp, MessageSquare, BadgeCheck, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Reviewer { id: string; name: string | null; avatarUrl: string | null; image: string | null; jobTitle: string | null; department: string | null }
interface Review {
  id:             string
  rating:         number
  ratingQuality:  number | null
  ratingComm:     number | null
  ratingPunctual: number | null
  headline:       string | null
  body:           string | null
  wouldRepeat:    boolean
  isAnonymous:    boolean
  sellerReply:    string | null
  repliedAt:      string | null
  createdAt:      string
  reviewer:       Reviewer
}
interface Props {
  listingId:   string
  reviews:     Review[]
  avgRating:   number | null
  reviewCount: number
  isSeller:    boolean
}

function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => <Star key={i} className={`${cls} ${i <= n ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />)}
    </span>
  )
}

function RatingBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="font-semibold w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ review, listingId, isSeller }: { review: Review; listingId: string; isSeller: boolean }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [reply, setReply]         = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [replyText, setReplyText] = useState(review.sellerReply)

  const avatar = review.reviewer.avatarUrl ?? review.reviewer.image

  async function submitReply() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/skills/${listingId}/reviews/${review.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerReply: reply }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      setReplyText(data.review.sellerReply); setReplyOpen(false)
    } finally { setLoading(false) }
  }

  return (
    <div className="border border-border rounded-2xl p-5 space-y-3">
      {/* Reviewer */}
      <div className="flex items-start gap-3">
        {review.isAnonymous
          ? <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-sm font-bold">?</div>
          : avatar
            ? <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border shrink-0" />
            : <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 text-white text-sm font-bold">
                {review.reviewer.name?.[0] ?? "?"}
              </div>
        }
        <div className="flex-1">
          <p className="text-sm font-semibold">{review.isAnonymous ? "Anonymous" : review.reviewer.name}</p>
          {!review.isAnonymous && review.reviewer.jobTitle && (
            <p className="text-xs text-muted-foreground">{review.reviewer.jobTitle}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <Stars n={review.rating} />
          <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(review.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</p>
        </div>
      </div>

      {/* Sub-ratings */}
      {(review.ratingQuality || review.ratingComm || review.ratingPunctual) && (
        <div className="bg-muted/30 rounded-xl px-4 py-3 space-y-2">
          <RatingBar label="Quality"       value={review.ratingQuality} />
          <RatingBar label="Communication" value={review.ratingComm} />
          <RatingBar label="Punctuality"   value={review.ratingPunctual} />
        </div>
      )}

      {/* Review text */}
      {review.headline && <p className="font-semibold text-sm">"{review.headline}"</p>}
      {review.body      && <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>}

      {review.wouldRepeat && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <ThumbsUp className="h-3.5 w-3.5" />Would hire again
        </p>
      )}

      {/* Seller reply */}
      {replyText && (
        <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1.5"><MessageSquare className="h-3 w-3" />Seller's reply</p>
          <p className="text-sm text-muted-foreground">{replyText}</p>
        </div>
      )}

      {/* Seller reply form */}
      {isSeller && !replyText && (
        <div>
          {replyOpen ? (
            <div className="space-y-2">
              <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Write a public reply to this review…"
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none resize-none" />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" className="text-xs" disabled={loading || !reply.trim()} onClick={submitReply}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post Reply"}
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setReplyOpen(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReplyOpen(true)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />Reply to review
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function SkillReviewsList({ listingId, reviews, avgRating, reviewCount, isSeller }: Props) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? reviews : reviews.slice(0, 3)

  // Rating breakdown
  const counts = [5,4,3,2,1].map((n) => ({ star: n, count: reviews.filter((r) => r.rating === n).length }))

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
        No reviews yet — be the first!
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-8 items-start">
        <div className="text-center shrink-0">
          <p className="text-5xl font-bold">{avgRating?.toFixed(1) ?? "–"}</p>
          <Stars n={Math.round(avgRating ?? 0)} size="lg" />
          <p className="text-xs text-muted-foreground mt-1">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {counts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3">{star}</span>
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: reviewCount > 0 ? `${(count / reviewCount) * 100}%` : "0%" }} />
              </div>
              <span className="w-4 text-right text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Repeat rate */}
      {reviews.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
            {Math.round(reviews.filter((r) => r.wouldRepeat).length / reviews.length * 100)}%
          </span>
          <span className="text-emerald-700 dark:text-emerald-300">of clients would hire again</span>
        </div>
      )}

      {/* Review cards */}
      <div className="space-y-4">
        {visible.map((r) => <ReviewCard key={r.id} review={r} listingId={listingId} isSeller={isSeller} />)}
      </div>

      {reviews.length > 3 && (
        <button onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 border border-border rounded-xl hover:bg-muted/30 transition-all">
          {showAll ? <><ChevronUp className="h-4 w-4" />Show fewer</> : <><ChevronDown className="h-4 w-4" />Show all {reviewCount} reviews</>}
        </button>
      )}
    </div>
  )
}
