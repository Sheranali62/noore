"use client"

import { useMemo, useState } from "react"

type Review = {
  id: string
  rating: number
  comment: string | null
  images: string[]
  verified: boolean
  approved: boolean
  featured: boolean
  createdAt: string
  product: { id: string; name: string; slug: string }
  user: { name: string | null; email: string }
}

export default function ReviewsWorkspace({ initialReviews, counts }: {
  initialReviews: Review[]
  counts: { pending: number; approved: number; featured: number; average: number }
}) {
  const [reviews, setReviews] = useState(initialReviews)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const visible = useMemo(() => reviews.filter(review => {
    const q = query.trim().toLowerCase()
    const matches = !q || [review.user.name || "", review.user.email, review.product.name, review.comment || ""].some(v => v.toLowerCase().includes(q))
    const status = filter === "pending" ? !review.approved : filter === "approved" ? review.approved : filter === "featured" ? review.featured : true
    return matches && status
  }), [reviews, query, filter])

  async function updateReview(id: string, patch: { approved?: boolean; featured?: boolean }) {
    setBusy(id); setError(""); setNotice("")
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not update review")
      setReviews(current => current.map(review => review.id === id ? { ...review, ...patch } : review))
      setNotice(patch.approved === true ? "Review approved." : patch.approved === false ? "Review moved back to pending." : patch.featured ? "Review featured." : "Review removed from featured.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update review")
    } finally {
      setBusy(null)
    }
  }

  const pending = reviews.filter(r => !r.approved).length
  const approved = reviews.filter(r => r.approved).length
  const featured = reviews.filter(r => r.featured).length

  return <div className="max-w-7xl pb-12">
    <header className="mb-8"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ / Customer voice</p><h1 className="mt-2 font-editorial text-4xl md:text-5xl">Reviews & Ratings</h1><p className="mt-2 max-w-2xl text-sm text-secondary">Review customer feedback, approve what appears in your store and highlight trusted product experiences.</p></header>
    {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[["Pending reviews", pending, "Awaiting moderation"], ["Published reviews", approved, "Visible to shoppers"], ["Featured reviews", featured, "Highlighted feedback"], ["Average rating", counts.average.toFixed(1) + " / 5", "Across loaded reviews"]].map(([label, value, detail], i) => <div key={String(label)} className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-secondary">{detail}</p></div>)}
    </div>
    <section className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_12px_40px_rgba(23,23,23,0.05)]">
      <div className="flex flex-col gap-3 border-b border-charcoal/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Customer feedback</p><p className="mt-1 text-xs text-secondary">Showing {visible.length} of {reviews.length} recent reviews</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input aria-label="Search reviews" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer, product or text" className="min-w-0 rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm outline-none focus:border-[#c49a5a] sm:w-64" />
          <select aria-label="Filter reviews" value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-charcoal/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c49a5a]"><option value="all">All reviews</option><option value="pending">Pending</option><option value="approved">Published</option><option value="featured">Featured</option></select>
        </div>
      </div>
      <div className="divide-y divide-charcoal/10">
        {visible.length === 0 ? <div className="p-14 text-center"><p className="font-semibold">No reviews found</p><p className="mt-1 text-sm text-secondary">Try another search or filter.</p></div> : visible.map(review => <article key={review.id} className="p-5 transition hover:bg-charcoal/[0.015] md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="text-lg tracking-[0.12em] text-[#b68b4d]">{"★".repeat(review.rating)}<span className="text-charcoal/15">{"★".repeat(Math.max(0,5-review.rating))}</span></span><span className="text-xs text-secondary">{review.rating}/5</span>{review.verified && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">Verified purchase</span>}{review.featured && <span className="rounded-full bg-[#211a11] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#e3c38f]">Featured</span>}</div>
              <p className="mt-3 text-sm leading-6 text-charcoal/85">{review.comment || <span className="italic text-secondary">No written comment provided.</span>}</p>
              {review.images?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{review.images.map((src,i)=><a key={src+i} href={src} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border border-charcoal/10"><img src={src} alt="Customer review attachment" className="h-full w-full object-cover" /></a>)}</div>}
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary"><span className="font-semibold text-charcoal">{review.user.name || "Customer"}</span><span>{review.user.email}</span><span>·</span><span>{review.product.name}</span><span>·</span><span>{new Date(review.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${review.approved?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-amber-200 bg-amber-50 text-amber-700"}`}>{review.approved?"Published":"Pending"}</span>
              {review.approved ? <button type="button" disabled={busy===review.id} onClick={()=>updateReview(review.id,{approved:false,featured:false})} className="rounded-lg border border-charcoal/15 px-3 py-2 text-xs font-semibold transition hover:bg-charcoal/[0.04] disabled:opacity-50">Unpublish</button> : <button type="button" disabled={busy===review.id} onClick={()=>updateReview(review.id,{approved:true})} className="rounded-lg bg-[#c49a5a] px-3 py-2 text-xs font-semibold text-[#17110a] transition hover:bg-[#d4b477] disabled:opacity-50">Approve</button>}
              <button type="button" disabled={busy===review.id||!review.approved} onClick={()=>updateReview(review.id,{featured:!review.featured})} className="rounded-lg border border-charcoal/15 px-3 py-2 text-xs font-semibold transition hover:bg-charcoal/[0.04] disabled:opacity-40">{review.featured?"Unfeature":"Feature"}</button>
            </div>
          </div>
        </article>)}
      </div>
    </section>
    <p className="mt-4 text-xs text-secondary">Only approved reviews are published. Unpublishing a review keeps its record and feedback in your database.</p>
  </div>
}
