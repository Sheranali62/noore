"use client"

import { FormEvent, useMemo, useState } from "react"
import { Star } from "lucide-react"

export type ProductReviewItem = {
  id: string
  rating: number
  comment: string | null
  verified: boolean
  createdAt: string
}

type Props = {
  productId: string
  reviews: ProductReviewItem[]
}

const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating)

export function ReviewsSection({ productId, reviews }: Props) {
  const [items, setItems] = useState(reviews)
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const summary = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map(value => items.filter(r => r.rating === value).length)
    const total = items.reduce((sum, review) => sum + review.rating, 0)
    return {
      counts,
      average: items.length ? total / items.length : 0,
    }
  }, [items])

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating
      if (sort === "lowest") return a.rating - b.rating
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [items, sort])

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
        setMessage(data?.message || "Thank you. Your review is awaiting approval.")
      } else {
        setMessage(data?.error || "We could not submit your review. Please try again.")
      }
    } catch {
      setMessage("We could not submit your review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-20 border-t border-border pt-12" id="reviews">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">Customer feedback</p>
          <h2 className="mt-2 font-editorial text-3xl md:text-4xl">Reviews & Ratings</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
            Honest feedback from the NOORÉ community. Reviews from delivered purchases receive a verified badge.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-3xl">★</div>
          <div><div className="text-2xl font-semibold">{summary.average.toFixed(1)} <span className="text-sm font-normal text-secondary">/ 5</span></div><div className="text-xs text-secondary">{items.length} {items.length === 1 ? "review" : "reviews"}</div></div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm font-medium">Rating breakdown</div>
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs">
                <option value="newest">Newest</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
            <div className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((value, index) => {
                const count = summary.counts[index]
                const percentage = items.length ? (count / items.length) * 100 : 0
                return <div key={value} className="flex items-center gap-3 text-xs"><span className="w-8">{value} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-charcoal" style={{ width: `${percentage}%` }} /></div><span className="w-6 text-right text-secondary">{count}</span></div>
              })}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sorted.length ? sorted.map(review => (
              <article key={review.id} className="rounded-2xl border border-border bg-white p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm tracking-wider" aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</div>
                  <time className="text-xs text-secondary" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
                </div>
                {review.comment && <p className="mt-4 text-sm leading-7 text-secondary">{review.comment}</p>}
                {review.verified && <p className="mt-4 inline-flex rounded-full bg-black/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">✓ Verified purchase</p>}
              </article>
            )) : (
              <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center"><p className="font-editorial text-2xl">Be the first to review this piece</p><p className="mt-2 text-sm text-secondary">Purchased customers can share their experience after delivery.</p></div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-24">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">Your experience</p>
          <h3 className="mt-2 font-editorial text-2xl">Write a review</h3>
          <p className="mt-2 text-sm leading-6 text-secondary">Reviews are available after a delivered purchase and are checked before publication.</p>
          <form onSubmit={submitReview} className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium">Your rating</label>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Choose rating">
                {[1,2,3,4,5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? "" : "s"}`} onClick={() => setRating(value)} className={`p-1 text-2xl transition ${value <= rating ? "text-charcoal" : "text-black/20"}`}><Star className={`h-6 w-6 ${value <= rating ? "fill-current" : ""}`} /></button>)}
              </div>
            </div>
            <div>
              <label htmlFor="review-comment" className="text-sm font-medium">Your review</label>
              <textarea id="review-comment" value={comment} onChange={e => setComment(e.target.value)} maxLength={1500} rows={5} placeholder="Tell us about the fit, fabric and finish…" className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm outline-none transition focus:border-charcoal" />
              <div className="mt-1 text-right text-[10px] text-secondary">{comment.length}/1500</div>
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-charcoal px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">{submitting ? "Submitting…" : "Submit Review"}</button>
            {message && <p className="rounded-xl bg-black/5 p-3 text-xs leading-5 text-secondary" role="status">{message}</p>}
          </form>
        </aside>
      </div>
    </section>
  )
}
