import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const guard = await requireAdmin([
    "SUPER_ADMIN",
    "ADMIN",
    "ORDER_MANAGER",
  ])

  if (guard.response) return null

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [
    orders,
    revenue,
    customers,
    active,
    units,
    top,
    statuses,
    abandoned,
    wishlists,
    couponUses,
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

    prisma.orderItem.aggregate({
      where: {
        order: {
          createdAt: {
            gte: since,
          },
          status: {
            notIn: ["CANCELLED", "REFUNDED"],
          },
        },
      },
      _sum: {
        quantity: true,
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
      take: 8,
    }),

    prisma.order.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.cart.count({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        items: {
          some: {},
        },
      },
    }),

    prisma.wishlistItem.count({
      where: {
        createdAt: {
          gte: since,
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
    },
  })

  const productMap = Object.fromEntries(
    names.map((item) => [item.id, item])
  )

  const cards = [
    [
      "Revenue",
      `PKR ${(revenue._sum.total || 0).toLocaleString()}`,
    ],
    ["Orders", orders],
    ["Units sold", units._sum.quantity || 0],
    ["New customers", customers],
    ["Active products", active],
    ["Abandoned carts", abandoned],
    ["Wishlist adds", wishlists],
    ["Coupon uses", couponUses],
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">
            LAST 30 DAYS
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold mt-2">
            Store Intelligence
          </h1>

          <p className="text-secondary mt-1">
            Sales, merchandising, customer and conversion signals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/reports?type=sales"
            className="bg-charcoal text-white rounded-lg px-4 py-2 text-sm hover:opacity-90 transition"
          >
            Sales CSV
          </a>

          <a
            href="/api/admin/reports?type=customers"
            className="border border-cream bg-white rounded-lg px-4 py-2 text-sm hover:bg-cream/40 transition"
          >
            Customers CSV
          </a>

          <a
            href="/api/admin/reports?type=inventory"
            className="border border-cream bg-white rounded-lg px-4 py-2 text-sm hover:bg-cream/40 transition"
          >
            Inventory CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div
            key={String(label)}
            className="bg-white border border-cream rounded-2xl p-5"
          >
            <p className="text-xs uppercase tracking-wider text-secondary">
              {label}
            </p>

            <p className="text-2xl font-semibold mt-2">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Best Sellers + Search Intelligence */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <section className="bg-white border border-cream rounded-2xl p-6">
          <h2 className="font-editorial text-2xl">
            Best sellers
          </h2>

          <div className="mt-5 space-y-4">
            {top.length ? (
              top.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex gap-3 items-center"
                >
                  <span className="text-secondary w-6">
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {productMap[product.productId]?.name ||
                        "Unknown product"}
                    </p>

                    <p className="text-xs text-secondary">
                      {productMap[product.productId]?.category || ""}
                      {" · "}
                      {product._sum.quantity || 0} units
                    </p>
                  </div>

                  <b className="whitespace-nowrap">
                    PKR{" "}
                    {(product._sum.total || 0).toLocaleString()}
                  </b>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-secondary">
                  No sales yet.
                </p>

                <p className="text-xs text-secondary mt-1">
                  Best-selling products will appear here after orders are placed.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Search Intelligence */}
        <section className="bg-white border border-cream rounded-2xl p-6">
          <h2 className="font-editorial text-2xl">
            Search intelligence
          </h2>

          <div className="mt-5">
            <div className="rounded-xl bg-cream/50 border border-cream p-5">
              <p className="font-medium">
                Search analytics ready
              </p>

              <p className="text-sm text-secondary mt-2 leading-6">
                Search-demand analytics will become available once
                search-event tracking is enabled in the database.
              </p>

              <p className="text-xs text-secondary mt-3">
                No database changes or sample data are required right now.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Order Pipeline */}
      <section className="bg-white border border-cream rounded-2xl p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <div>
            <h2 className="font-editorial text-2xl">
              Order pipeline
            </h2>

            <p className="text-sm text-secondary mt-1">
              Current order status distribution.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="text-sm hover:underline"
          >
            Manage orders →
          </Link>
        </div>

        {statuses.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statuses.map((status) => (
              <div
                key={status.status}
                className="bg-cream/60 rounded-xl p-4"
              >
                <p className="text-xs text-secondary capitalize">
                  {status.status
                    .replaceAll("_", " ")
                    .toLowerCase()}
                </p>

                <p className="text-xl font-semibold mt-1">
                  {status._count._all}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-secondary">
              No orders yet.
            </p>

            <p className="text-xs text-secondary mt-1">
              Order pipeline information will appear here after orders are created.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}