import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  const since = new Date(); since.setDate(since.getDate() - 30)
  const [orders, revenue, customers, products, topProducts, status] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { total: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 10 }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ])
  const productIds = topProducts.map(p => p.productId)
  const names = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
  const nameMap = Object.fromEntries(names.map(p => [p.id, p.name]))
  return NextResponse.json({ periodDays: 30, orders, revenue: revenue._sum.total || 0, customers, products, topProducts: topProducts.map(p => ({ productId: p.productId, name: nameMap[p.productId] || "Unknown", quantity: p._sum.quantity || 0, revenue: p._sum.total || 0 })), status })
}
