"use client"

import { FormEvent, useMemo, useState } from "react"
import { Star, SlidersHorizontal } from "lucide-react"

export type ProductReviewItem = {
  id: string
  rating: number
  comment: string | null
  verified: boolean
  createdAt: string
  author?: string
}

type Props = {
  productId: string
  reviews: ProductReviewItem[]
}

const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating)

export function ReviewsSection({ productId, reviews }: Props) {
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest")
  const [filter, setFilter] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  const summary = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map(value => reviews.filter(r => r.rating === value).length)
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return { counts, average: reviews.length ? total / reviews.length : 0 }
  }, [reviews])

  const sorted = useMemo(() => {
    return reviews
      .filter(review => filter === null || review.rating === filter)
      .sort((a, b) => {
        if (sort === "highest") return b.rating - a.rating
        if (sort === "lowest") return a.rating - b.rating
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [reviews, sort, filter])

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage("")
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok) {
        setComment("")
        setMessageType("success")
        setMessage(data?.message || "Thank you. Your review is awaiting approval.")
      } else {
        setMessageType("error")
        setMessage(data?.error || "We could not submit your review. Please try again.")
      }
    } catch {
      setMessageType("error")
      setMessage("Connection problem. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-20 border-t border-border pt-12" id="reviews" aria-labelledby="reviews-heading">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">Customer feedback</p>
          <h2 id="reviews-heading" className="mt-2 font-editorial text-3xl md:text-4xl">Reviews & Ratings</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
            Honest feedback from the NOORÉ community. Reviews are published after moderation, and delivered purchases are verified.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f2e7d4] text-xl text-[#9b7440]">★</div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{summary.average.toFixed(1)} <span className="text-sm font-normal text-secondary">/ 5</span></div>
            <div className="text-xs text-secondary">{reviews.length} approved {reviews.length === 1 ? "review" : "reviews"} shown</div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm font-medium">Rating breakdown</div>
              <label className="flex items-center gap-2 text-xs text-secondary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Sort reviews</span>
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-charcoal">
                  <option value="newest">Newest first</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
              </label>
            </div>
            <div className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((value, index) => {
                const count = summary.counts[index]
                const percentage = reviews.length ? (count / reviews.length) * 100 : 0
                const active = filter === value
                return (
                  <button key={value} type="button" onClick={() => setFilter(active ? null : value)} aria-pressed={active} className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-[#f7f3ed] ${active ? "bg-[#f2e7d4] text-[#76552d]" : "text-charcoal"}`}>
                    <span className="w-8 shrink-0">{value} ★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/5"><span className="block h-full rounded-full bg-[#b8945e]" style={{ width: `${percentage}%` }} /></span>
                    <span className="w-6 text-right text-secondary">{count}</span>
                  </button>
                )
              })}
            </div>
            {filter !== null && <button type="button" onClick={() => setFilter(null)} className="mt-3 text-xs font-medium text-[#8a673b] underline underline-offset-4">Clear {filter}-star filter</button>}
          </div>

          <div className="mt-6 space-y-4">
            {sorted.length ? sorted.map(review => (
              <article key={review.id} className="rounded-2xl border border-border bg-white p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{review.author || "NOORÉ customer"}</p>
                    <div className="mt-1 text-sm tracking-wider text-[#a47c43]" aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</div>
                  </div>
                  <time className="text-xs text-secondary" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</time>
                </div>
                {review.comment && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-secondary">{review.comment}</p>}
                {review.verified && <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#d9c39f] bg-[#faf6ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#806039]">✓ Verified purchase</p>}
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
                <p className="font-editorial text-2xl">{filter ? `No ${filter}-star reviews yet` : "Be the first to review this piece"}</p>
                <p className="mt-2 text-sm text-secondary">{filter ? "Choose another rating or clear the filter to see all feedback." : "Customers can share their experience after their order has been delivered."}</p>
                {filter !== null && <button type="button" onClick={() => setFilter(null)} className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#8a673b] underline underline-offset-4">Show all reviews</button>}
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-24">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">Your experience</p>
          <h3 className="mt-2 font-editorial text-2xl">Write a review</h3>
          <p className="mt-2 text-sm leading-6 text-secondary">You can review this product after your order is marked delivered. Every submission is checked before it appears here.</p>
          <form onSubmit={submitReview} className="mt-6 space-y-5">
            <fieldset>
              <legend className="text-sm font-medium">Your rating</legend>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Choose rating">
                {[1, 2, 3, 4, 5].map(value => (
                  <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? "" : "s"}`} onClick={() => setRating(value)} className={`rounded-md p-1 text-2xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8945e] ${value <= rating ? "text-[#a47c43]" : "text-black/20"}`}>
                    <Star className={`h-6 w-6 ${value <= rating ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-secondary">{["", "Not satisfied", "Could be better", "Good", "Very good", "Excellent"][rating]}</p>
            </fieldset>
            <div>
              <label htmlFor="review-comment" className="text-sm font-medium">Your review <span className="font-normal text-secondary">(optional)</span></label>
              <textarea id="review-comment" value={comment} onChange={e => setComment(e.target.value)} maxLength={1500} rows={5} placeholder="Tell us about the fit, fabric and finish…" className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm outline-none transition focus:border-[#b8945e]" />
              <div className="mt-1 text-right text-[10px] text-secondary">{comment.length}/1500</div>
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#21171d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3a2932] disabled:cursor-wait disabled:opacity-50">{submitting ? "Submitting…" : "Submit review"}</button>
            {message && <p className={`rounded-xl p-3 text-xs leading-5 ${messageType === "success" ? "bg-[#f4efe5] text-[#70562f]" : "bg-red-50 text-red-700"}`} role="status" aria-live="polite">{message}</p>}
          </form>
        </aside>
      </div>
    </section>
  )
}
