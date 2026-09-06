"use client"

import { useEffect, useState } from "react"

type Review = { id: string; rating: number; comment: string | null; approved: boolean; featured: boolean; user: { name: string | null; email: string }; product: { name: string } }

export default function ReviewsAdminClient() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const load = async () => {
    const response = await fetch("/api/admin/reviews", { cache: "no-store" })
    if (response.ok) setReviews(await response.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const patch = async (id: string, data: Partial<Pick<Review, "approved" | "featured">>) => {
    const response = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) })
    if (response.ok) setReviews(current => current.map(r => r.id === id ? { ...r, ...data } : r))
  }
  const remove = async (id: string) => {
    const response = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    if (response.ok) setReviews(current => current.filter(r => r.id !== id))
  }
  if (loading) return <div className="p-8">Loading reviews…</div>
  return <div className="bg-white border border-cream rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-cream"><tr><th className="text-left p-4">Customer</th><th className="text-left p-4">Product</th><th className="text-left p-4">Rating</th><th className="text-left p-4">Review</th><th className="text-left p-4">Actions</th></tr></thead><tbody>{reviews.map(r => <tr key={r.id} className="border-t border-cream"><td className="p-4"><div>{r.user.name || "Customer"}</div><div className="text-xs text-secondary">{r.user.email}</div></td><td className="p-4">{r.product.name}</td><td className="p-4">{"★".repeat(r.rating)}<span className="text-black/20">{"★".repeat(5-r.rating)}</span></td><td className="p-4 max-w-md text-sm">{r.comment || "—"}</td><td className="p-4"><div className="flex flex-wrap gap-2"><button onClick={() => patch(r.id,{approved:!r.approved})} className="rounded px-3 py-1.5 text-xs bg-charcoal text-white">{r.approved ? "Unapprove" : "Approve"}</button><button onClick={() => patch(r.id,{featured:!r.featured})} className="rounded px-3 py-1.5 text-xs border border-cream">{r.featured ? "Unfeature" : "Feature"}</button><button onClick={() => remove(r.id)} className="rounded px-3 py-1.5 text-xs border border-red-200 text-red-600">Delete</button></div></td></tr>)}</tbody></table></div></div>
}
