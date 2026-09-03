import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function AdminReviewsPage() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (guard.response) return null
  const [pending, approved, featured] = await Promise.all([
    prisma.productReview.count({ where: { approved: false } }),
    prisma.productReview.count({ where: { approved: true } }),
    prisma.productReview.count({ where: { featured: true } }),
  ])
  const reviews = await prisma.productReview.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { product: { select: { name: true } }, user: { select: { name: true, email: true } } } })
  return <div><div className="flex flex-wrap justify-between gap-4 mb-8"><div><h1 className="text-3xl font-semibold">Reviews & Ratings</h1><p className="text-secondary mt-1">Moderate customer reviews before they appear publicly.</p></div><div className="flex gap-3"><div className="bg-white border border-cream rounded-lg px-4 py-3"><b>{pending}</b><span className="text-secondary ml-2">Pending</span></div><div className="bg-white border border-cream rounded-lg px-4 py-3"><b>{approved}</b><span className="text-secondary ml-2">Approved</span></div><div className="bg-white border border-cream rounded-lg px-4 py-3"><b>{featured}</b><span className="text-secondary ml-2">Featured</span></div></div></div><div className="bg-white border border-cream rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-cream"><tr><th className="text-left p-4">Customer</th><th className="text-left p-4">Product</th><th className="text-left p-4">Rating</th><th className="text-left p-4">Review</th><th className="text-left p-4">Status</th></tr></thead><tbody>{reviews.map(r => <tr key={r.id} className="border-t border-cream"><td className="p-4"><div>{r.user.name || "Customer"}</div><div className="text-xs text-secondary">{r.user.email}</div></td><td className="p-4">{r.product.name}</td><td className="p-4">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5-r.rating)}</span></td><td className="p-4 max-w-md text-sm">{r.comment || "—"}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs ${r.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{r.approved ? "Approved" : "Pending"}</span>{r.featured && <span className="ml-2 px-2 py-1 rounded text-xs bg-charcoal text-white">Featured</span>}</td></tr>)}</tbody></table></div></div></div>
}
