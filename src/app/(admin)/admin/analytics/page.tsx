import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return null
  const since = new Date(); since.setDate(since.getDate() - 30)
  const [orders, revenue, customers, activeProducts, top] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { total: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
  ])
  const names = await prisma.product.findMany({ where: { id: { in: top.map(x => x.productId) } }, select: { id: true, name: true } })
  const map = Object.fromEntries(names.map(x => [x.id, x.name]))
  return <div><div className="mb-8"><p className="text-xs uppercase tracking-[0.2em] text-secondary">LAST 30 DAYS</p><h1 className="text-3xl font-semibold mt-2">Store Analytics</h1><p className="text-secondary mt-1">A quick operating view of NOORÉ performance.</p></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[["Revenue", `PKR ${(revenue._sum.total || 0).toLocaleString()}`],["Orders", orders],["New Customers", customers],["Active Products", activeProducts]].map(([label,value]) => <div key={String(label)} className="bg-white border border-cream rounded-xl p-5"><p className="text-sm text-secondary">{label}</p><p className="text-2xl font-semibold mt-2">{value}</p></div>)}</div><div className="bg-white border border-cream rounded-xl p-6"><h2 className="font-semibold text-lg mb-5">Top Products</h2><div className="space-y-4">{top.length === 0 ? <p className="text-secondary">No sales data yet.</p> : top.map((p,i) => <div key={p.productId} className="flex items-center gap-4"><span className="w-7 text-secondary">{i+1}</span><div className="flex-1"><p className="font-medium">{map[p.productId] || "Unknown"}</p><p className="text-xs text-secondary">{p._sum.quantity || 0} units sold</p></div><span className="font-medium">PKR {(p._sum.total || 0).toLocaleString()}</span></div>)}</div></div></div>
}
