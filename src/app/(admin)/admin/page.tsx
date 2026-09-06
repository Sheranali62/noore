import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { OrderStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`
const label = (value: string) => value.replaceAll("_", " ")

export default async function AdminPage() {
  const guard = await requireAdmin()
  if (guard.response) return null

  const now = new Date()
  const start30 = new Date(now)
  start30.setDate(start30.getDate() - 30)
  const start7 = new Date(now)
  start7.setDate(start7.getDate() - 7)
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const abandonedBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  const validOrderWhere = { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } }

  const [
    orders30,
    revenue30,
    orders7,
    revenue7,
    revenueToday,
    customers30,
    activeProducts,
    pendingOrders,
    units30,
    lowStock,
    outOfStock,
    abandoned,
    pendingReviews,
    statuses,
    topProducts,
    categorySales,
    recentOrders,
    recentReviews,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start30 } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: start30 }, ...validOrderWhere }, _sum: { total: true } }),
    prisma.order.count({ where: { createdAt: { gte: start7 } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: start7 }, ...validOrderWhere }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: startToday }, ...validOrderWhere }, _sum: { total: true } }),
    prisma.user.count({ where: { createdAt: { gte: start30 }, role: "CUSTOMER" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.orderItem.aggregate({ where: { order: { createdAt: { gte: start30 }, ...validOrderWhere } }, _sum: { quantity: true } }),
    prisma.product.count({ where: { status: "ACTIVE", stock: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { status: "ACTIVE", stock: 0 } }),
    prisma.cart.count({ where: { updatedAt: { lt: abandonedBefore }, items: { some: {} } } }),
    prisma.productReview.count({ where: { approved: false } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { _count: { status: "desc" } } }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { total: true, quantity: true }, where: { order: { createdAt: { gte: start30 }, ...validOrderWhere } }, orderBy: { _sum: { total: "desc" } }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, user: { select: { name: true, email: true } }, _count: { select: { items: true } } } }),
    prisma.productReview.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { id: true, rating: true, comment: true, approved: true, createdAt: true, product: { select: { name: true } }, user: { select: { name: true } } } }),
  ])

  const productIds = Array.from(new Set([
    ...topProducts.map((item) => item.productId),
    ...categorySales.map((item) => item.productId),
  ]))
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, category: true } })
  const productMap = Object.fromEntries(products.map((product) => [product.id, product]))

  const categoryMap = new Map<string, { revenue: number; units: number }>()
  for (const item of categorySales) {
    const category = productMap[item.productId]?.category || "Uncategorised"
    const current = categoryMap.get(category) || { revenue: 0, units: 0 }
    current.revenue += item._sum.total || 0
    current.units += item._sum.quantity || 0
    categoryMap.set(category, current)
  }
  const categories = Array.from(categoryMap.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)

  const delivered = statuses.find((item) => item.status === "DELIVERED")?._count._all || 0
  const avgOrder = orders30 ? (revenue30._sum.total || 0) / orders30 : 0
  const conversionSignal = orders30 > 0 ? `${Math.round((delivered / orders30) * 100)}% delivered` : "Awaiting first order"

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ · Operations</p>
          <h1 className="mt-2 font-editorial text-4xl leading-none md:text-5xl">Command center</h1>
          <p className="mt-3 max-w-2xl text-sm text-secondary">A live view of orders, customers, merchandising and stock. No sample data is shown.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="rounded-full border border-cream bg-white px-4 py-2.5 text-sm font-medium hover:bg-cream">Manage orders</Link>
          <Link href="/admin/products/add" className="rounded-full bg-charcoal px-4 py-2.5 text-sm font-medium text-white hover:bg-charcoal/90">Add product</Link>
          <a href="/api/admin/reports?type=sales" className="rounded-full border border-charcoal px-4 py-2.5 text-sm font-medium hover:bg-charcoal hover:text-white">Export sales</a>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <Metric label="Revenue · 30d" value={money(revenue30._sum.total || 0)} />
        <Metric label="Orders · 30d" value={orders30} />
        <Metric label="Avg. order" value={money(avgOrder)} />
        <Metric label="Units · 30d" value={units30._sum.quantity || 0} />
        <Metric label="Customers · 30d" value={customers30} />
        <Metric label="Delivered" value={delivered} />
        <Metric label="Pending COD" value={pendingOrders} emphasis={pendingOrders > 0} />
        <Metric label="Active products" value={activeProducts} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-cream bg-white p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div><p className="eyebrow">Performance</p><h2 className="section-title">Sales pulse</h2></div>
            <Link href="/admin/analytics" className="text-sm font-medium hover:underline">Full analytics →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Pulse label="Today" value={money(revenueToday._sum.total || 0)} detail="Revenue" />
            <Pulse label="Last 7 days" value={money(revenue7._sum.total || 0)} detail={`${orders7} orders`} />
            <Pulse label="Last 30 days" value={money(revenue30._sum.total || 0)} detail={`${orders30} orders · ${conversionSignal}`} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.length === 0 ? <Empty message="Category performance will appear after your first orders." /> : categories.map(([category, data], index) => (
              <div key={category} className="rounded-xl bg-cream/60 p-4">
                <div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-wider text-secondary">0{index + 1} · {category}</span><span className="text-sm font-semibold">{money(data.revenue)}</span></div>
                <div className="mt-2 text-xs text-secondary">{data.units.toLocaleString()} units sold</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-charcoal p-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Action queue</p>
          <h2 className="mt-1 font-editorial text-3xl">Needs attention</h2>
          <div className="mt-6 divide-y divide-white/10">
            <Action href="/admin/orders" label="Pending COD orders" value={pendingOrders} />
            <Action href="/admin/inventory" label="Low stock" value={lowStock} />
            <Action href="/admin/inventory" label="Out of stock" value={outOfStock} />
            <Action href="/admin/reviews" label="Reviews awaiting approval" value={pendingReviews} />
            <Action href="/admin/abandoned-carts" label="Abandoned carts" value={abandoned} />
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/65">Keep the catalog empty until you are ready to enter real inventory. This dashboard will populate automatically from production data.</div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent orders" link="/admin/orders" linkText="View all">
          {recentOrders.length === 0 ? <Empty message="No orders yet." /> : <div className="divide-y divide-cream">{recentOrders.map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1 hover:bg-cream/20"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">#{order.orderNumber}</p><p className="mt-1 truncate text-xs text-secondary">{order.user?.name || order.user?.email || "Customer"} · {order._count.items} items</p></div><div className="text-right"><p className="text-sm font-semibold">{money(order.total)}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-secondary">{label(order.status)}</p></div></Link>)}</div>}
        </Panel>

        <Panel title="Best sellers" link="/admin/products" linkText="Catalog">
          {topProducts.length === 0 ? <Empty message="Best sellers will appear after orders are placed." /> : <div className="space-y-4">{topProducts.map((item, index) => <div key={item.productId} className="flex items-center gap-3"><span className="w-5 text-xs text-secondary">0{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{productMap[item.productId]?.name || "Unknown product"}</p><p className="mt-1 text-xs text-secondary">{item._sum.quantity || 0} units</p></div><span className="text-sm font-semibold">{money(item._sum.total || 0)}</span></div>)}</div>}
        </Panel>

        <Panel title="Customer voice" link="/admin/reviews" linkText="Moderate reviews">
          {recentReviews.length === 0 ? <Empty message="Customer reviews will appear here when real purchases generate them." /> : <div className="space-y-4">{recentReviews.map((review) => <div key={review.id} className="border-b border-cream pb-4 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-3"><span className="text-sm tracking-wide">{"★".repeat(review.rating)}<span className="text-gray-300">{"★".repeat(5 - review.rating)}</span></span><span className="text-[11px] uppercase tracking-wide text-secondary">{review.approved ? "Approved" : "Pending"}</span></div><p className="mt-2 line-clamp-2 text-sm">{review.comment || "No written comment."}</p><p className="mt-2 truncate text-xs text-secondary">{review.user?.name || "Customer"} · {review.product.name}</p></div>)}</div>}
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Order pipeline" link="/admin/orders" linkText="Manage">
          {statuses.length === 0 ? <Empty message="The order pipeline is empty." /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{statuses.map((status) => <div key={status.status} className="rounded-xl bg-cream/60 p-4"><p className="text-[11px] uppercase tracking-wider text-secondary">{label(status.status)}</p><p className="mt-2 text-2xl font-semibold">{status._count._all}</p></div>)}</div>}
        </Panel>
        <Panel title="Store health" link="/admin/analytics" linkText="Analytics">
          <div className="grid grid-cols-2 gap-3">
            <Health label="Low stock" value={lowStock} href="/admin/inventory" />
            <Health label="Out of stock" value={outOfStock} href="/admin/inventory" />
            <Health label="Pending reviews" value={pendingReviews} href="/admin/reviews" />
            <Health label="Abandoned carts" value={abandoned} href="/admin/abandoned-carts" />
          </div>
        </Panel>
      </section>
    </div>
  )
}

function Metric({ label, value, emphasis }: { label: string; value: string | number; emphasis?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${emphasis ? "border-charcoal bg-charcoal text-white" : "border-cream bg-white"}`}><p className={`text-[10px] font-semibold uppercase tracking-wider ${emphasis ? "text-white/60" : "text-secondary"}`}>{label}</p><p className="mt-2 text-xl font-semibold tracking-tight">{value}</p></div>
}

function Pulse({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-cream p-4"><p className="text-xs text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-secondary">{detail}</p></div>
}

function Action({ href, label, value }: { href: string; label: string; value: number }) {
  return <Link href={href} className="flex items-center justify-between py-4 first:pt-5 last:pb-1 hover:text-white/75"><span className="text-sm text-white/80">{label}</span><span className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-semibold ${value > 0 ? "bg-white text-charcoal" : "bg-white/10 text-white/55"}`}>{value}</span></Link>
}

function Panel({ title, link, linkText, children }: { title: string; link?: string; linkText?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-cream bg-white p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-editorial text-2xl">{title}</h2>{link && <Link href={link} className="text-sm font-medium hover:underline">{linkText} →</Link>}</div>{children}</section>
}

function Health({ label, value, href }: { label: string; value: number; href: string }) {
  return <Link href={href} className="rounded-xl bg-cream/60 p-4 hover:bg-cream"><p className="text-[11px] uppercase tracking-wider text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></Link>
}

function Empty({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-cream bg-cream/20 p-5 text-sm text-secondary">{message}</div>
}
