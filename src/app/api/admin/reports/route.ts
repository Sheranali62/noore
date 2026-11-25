import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function csv(rows: string[][]) {
  return rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "sales"
  if (!["sales", "customers", "inventory"].includes(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  }
  const allowedRoles = type === "inventory"
    ? ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]
    : ["SUPER_ADMIN", "ADMIN"]
  const guard = await requireAdmin(allowedRoles)
  if (guard.response) return guard.response

  const since = new Date()
  since.setDate(since.getDate() - 30)
  let rows: string[][] = []

  if (type === "customers") {
    const users = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: { orders: { select: { total: true, status: true } } },
    })
    rows = [
      ["Name", "Email", "Orders", "Total Spent", "Joined"],
      ...users.map(user => [
        user.name || "",
        user.email,
        String(user.orders.length),
        String(user.orders.filter(order => !["CANCELLED", "REFUNDED"].includes(order.status)).reduce((sum, order) => sum + order.total, 0)),
        user.createdAt.toISOString(),
      ]),
    ]
  } else if (type === "inventory") {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { stock: "asc" },
    })
    rows = [
      ["Product", "SKU", "Stock", "Low Stock", "Price", "Status"],
      ...products.map(product => [
        product.name,
        product.sku,
        String(product.stock),
        String(product.lowStock),
        String(product.salePrice ?? product.price),
        product.stock === 0 ? "OUT_OF_STOCK" : product.stock <= product.lowStock ? "LOW_STOCK" : "IN_STOCK",
      ]),
    ]
  } else {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true, costPrice: true } },
      },
    })
    const orderRows = orders.map(order => {
      const completeCost = order.items.length > 0 && order.items.every(item => item.costPrice !== null)
      const cogs = completeCost
        ? order.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0)
        : null
      return [
        order.orderNumber,
        order.user?.name || "",
        order.user?.email || "",
        order.status,
        order.paymentMethod,
        order.subtotal.toFixed(2),
        order.discount.toFixed(2),
        order.shipping.toFixed(2),
        order.tax.toFixed(2),
        order.total.toFixed(2),
        cogs === null ? "" : cogs.toFixed(2),
        cogs === null ? "" : (order.subtotal - order.discount - cogs).toFixed(2),
        order.createdAt.toISOString(),
      ]
    })
    rows = [
      ["Order", "Customer", "Email", "Status", "Payment", "Subtotal", "Discount", "Shipping", "Tax", "Total", "COGS", "Gross Profit", "Date"],
      ...orderRows,
    ]
  }

  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=noore-${type}-report.csv`,
    },
  })
}
