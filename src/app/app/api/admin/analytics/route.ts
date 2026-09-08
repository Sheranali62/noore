import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin([
    "SUPER_ADMIN",
    "ADMIN",
    "ORDER_MANAGER",
  ])

  if (guard.response) {
    return guard.response
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [
    orders,
    revenue,
    customers,
    products,
    top,
    status,
    wishlistItems,
    cartCount,
    coupons,
    lowStock,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),

    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: since,
        },
        status: {
          notIn: ["CANCELLED", "REFUNDED"],
        },
      },
      _sum: {
        total: true,
      },
    }),

    prisma.user.count({
      where: {
        createdAt: {
          gte: since,
        },
        role: "CUSTOMER",
      },
    }),

    prisma.product.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    }),

    prisma.order.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.wishlistItem.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),

    prisma.cart.count({
      where: {
        items: {
          some: {},
        },
        updatedAt: {
          lt: new Date(
            Date.now() - 2 * 60 * 60 * 1000
          ),
        },
      },
    }),

    prisma.couponUsage.count({
      where: {
        usedAt: {
          gte: since,
        },
      },
    }),

    prisma.product.count({
      where: {
        status: "ACTIVE",
        stock: {
          lte: 5,
        },
      },
    }),
  ])

  const names = await prisma.product.findMany({
    where: {
      id: {
        in: top.map((item) => item.productId),
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
      stock: true,
    },
  })

  const map = Object.fromEntries(
    names.map((product) => [
      product.id,
      product,
    ])
  )

  return NextResponse.json({
    periodDays: 30,
    orders,
    revenue: revenue._sum.total || 0,
    customers,
    products,
    wishlistItems,
    abandonedCarts: cartCount,
    couponUses: coupons,
    lowStock,

    topProducts: top.map((item) => ({
      productId: item.productId,
      name:
        map[item.productId]?.name ||
        "Unknown",
      category:
        map[item.productId]?.category ||
        "",
      stock:
        map[item.productId]?.stock ?? 0,
      quantity:
        item._sum.quantity || 0,
      revenue:
        item._sum.total || 0,
    })),

    status,

    // Search analytics is intentionally omitted
    // because SearchEvent is not part of the
    // current Prisma schema.
    topSearches: [],
  })
}