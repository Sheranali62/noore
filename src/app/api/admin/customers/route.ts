import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const excludedStatuses = ["CANCELLED", "REFUNDED"] as const

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const params = request.nextUrl.searchParams
  const search = (params.get("search") || "").trim()
  const status = params.get("status") || "all"
  const city = params.get("city") || "all"
  const page = Math.max(1, Number(params.get("page") || 1))
  const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 8)))
  const activeSince = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const where: any = {
    role: "CUSTOMER",
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { addresses: { some: { phone: { contains: search, mode: "insensitive" } } } },
      ],
    } : {}),
    ...(city !== "all" ? { addresses: { some: { city } } } : {}),
    ...(status === "active" ? { orders: { some: { createdAt: { gte: activeSince }, status: { notIn: [...excludedStatuses] } } } } : {}),
    ...(status === "inactive" ? { NOT: { orders: { some: { createdAt: { gte: activeSince }, status: { notIn: [...excludedStatuses] } } } } } : {}),
  }

  const [total, users, allCustomers, activeCustomers, spending, cityRows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, name: true, email: true, createdAt: true, updatedAt: true,
        addresses: { orderBy: { createdAt: "desc" }, take: 1, select: { phone: true, city: true, province: true } },
        orders: { select: { id: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { orders: { select: { total: true, status: true } } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER", orders: { some: { createdAt: { gte: activeSince }, status: { notIn: [...excludedStatuses] } } } } }),
    prisma.order.aggregate({ where: { status: { notIn: [...excludedStatuses] } }, _sum: { total: true } }),
    prisma.address.findMany({ where: { user: { role: "CUSTOMER" } }, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" }, take: 200 }),
  ])

  const vipCount = allCustomers.filter((customer) =>
    customer.orders.filter((order) => !excludedStatuses.includes(order.status as typeof excludedStatuses[number]))
      .reduce((sum, order) => sum + order.total, 0) >= 100000
  ).length

  const customers = users.map((user) => {
    const validOrders = user.orders.filter((order) => !excludedStatuses.includes(order.status as typeof excludedStatuses[number]))
    const totalSpent = validOrders.reduce((sum, order) => sum + order.total, 0)
    const latestOrder = validOrders[0]
    return {
      id: user.id,
      name: user.name || "Customer",
      email: user.email,
      phone: user.addresses[0]?.phone || "—",
      city: user.addresses[0]?.city || "—",
      province: user.addresses[0]?.province || "",
      orderCount: validOrders.length,
      totalSpent,
      joinedAt: user.createdAt.toISOString(),
      active: Boolean(latestOrder && latestOrder.createdAt >= activeSince),
      vip: totalSpent >= 100000,
      latestOrderAt: latestOrder?.createdAt.toISOString() || null,
    }
  })

  return NextResponse.json({
    customers,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    stats: {
      totalCustomers: await prisma.user.count({ where: { role: "CUSTOMER" } }),
      activeCustomers,
      vipCustomers: vipCount,
      totalSpending: spending._sum.total || 0,
    },
    cities: cityRows.map((row) => row.city).filter(Boolean),
  })
}
