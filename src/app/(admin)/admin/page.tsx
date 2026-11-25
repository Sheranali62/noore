import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  BarChart3,
  Box,
  Boxes,
  CircleDollarSign,
  Clock3,
  Package,
  ShoppingBag,
  Star,
  Users,
  Zap,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { OrderStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

const money = (value: number) => `PKR ${Math.round(value).toLocaleString("en-PK")}`
const label = (value: string) => value.replaceAll("_", " ")
const shortDate = (date: Date) => date.toLocaleDateString("en-PK", { day: "numeric", month: "short" })

export default async function AdminPage() {
  const guard = await requireAdmin()
  if (guard.response) redirect("/login?callbackUrl=/admin")

  const role = guard.session?.user?.role
  if (role === "ORDER_MANAGER") redirect("/admin/orders")
  if (role === "PRODUCT_MANAGER") redirect("/admin/products")
  if (role === "CONTENT_MANAGER") redirect("/admin/homepage")
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") redirect("/login")

  const now = new Date()
  const start30 = new Date(now)
  start30.setDate(start30.getDate() - 30)
  const start7 = new Date(now)
  start7.setDate(start7.getDate() - 6)
  start7.setHours(0, 0, 0, 0)
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const abandonedBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const validOrderWhere = { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } }

  const [
    orders30,
    validOrders30,
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
    trendOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start30 } } }),
    prisma.order.count({ where: { createdAt: { gte: start30 }, ...validOrderWhere } }),
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
    prisma.orderItem.groupBy({ by: ["productId"], where: { order: validOrderWhere }, _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { total: true, quantity: true }, where: { order: { createdAt: { gte: start30 }, ...validOrderWhere } }, orderBy: { _sum: { total: "desc" } }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, user: { select: { name: true, email: true } }, _count: { select: { items: true } } } }),
    prisma.productReview.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { id: true, rating: true, comment: true, approved: true, createdAt: true, product: { select: { name: true } }, user: { select: { name: true } } } }),
    prisma.order.findMany({ where: { createdAt: { gte: start7 }, ...validOrderWhere }, select: { createdAt: true, total: true } }),
  ])

  const productIds = Array.from(new Set([
    ...topProducts.map((item) => item.productId),
    ...categorySales.map((item) => item.productId),
  ]))
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true },
  })
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

  const trend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start7)
    day.setDate(start7.getDate() + index)
    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)
    const dayOrders = trendOrders.filter((order) => order.createdAt >= day && order.createdAt < nextDay)
    return {
      day: day.toLocaleDateString("en-PK", { weekday: "short" }),
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    }
  })
  const maxRevenue = Math.max(...trend.map((day) => day.revenue), 1)
  const delivered = statuses.find((item) => item.status === "DELIVERED")?._count._all || 0
  const avgOrder = validOrders30 ? (revenue30._sum.total || 0) / validOrders30 : 0

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d6ae72]">NOORÉ / Store overview</p>
          <h1 className="mt-2 font-editorial text-4xl leading-tight sm:text-5xl">Welcome back<span className="text-[#d6ae72]">.</span></h1>
          <p className="mt-2 text-sm text-white/55">Here is what is happening with your store today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
          <span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">{shortDate(start30)} – {shortDate(now)} · Last 30 days</span>
          <Link href="/admin/analytics" className="rounded-xl border border-[#d6ae72]/50 px-4 py-3 font-semibold text-[#e4c28e] transition hover:bg-[#d6ae72]/10">View analytics <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<ShoppingBag />} label="Total orders" value={orders30.toLocaleString("en-PK")} note="Last 30 days" accent="gold" />
        <Metric icon={<CircleDollarSign />} label="Total revenue" value={money(revenue30._sum.total || 0)} note={`${money(revenueToday._sum.total || 0)} today`} accent="green" />
        <Metric icon={<Users />} label="New customers" value={customers30.toLocaleString("en-PK")} note="Joined in last 30 days" accent="blue" />
        <Metric icon={<Package />} label="Active products" value={activeProducts.toLocaleString("en-PK")} note={`${lowStock + outOfStock} need stock attention`} accent="purple" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#191817] to-[#101010] p-5 shadow-[0_18px_50px_rgba(0,0,0,.22)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6ae72]/15 text-[#e4c28e]"><BarChart3 className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">Sales overview</h2><p className="text-xs text-white/40">Daily revenue · last 7 days</p></div></div>
            <div className="flex gap-4 text-[11px] text-white/55"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#e4b85e]" />Revenue</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-white/45" />Orders</span></div>
          </div>
          <div className="mt-7 grid h-48 grid-cols-7 items-end gap-2 sm:gap-4">
            {trend.map((day) => (
              <div key={day.day} className="flex h-full flex-col items-center justify-end gap-2">
                <span className="text-[10px] tabular-nums text-white/45">{day.revenue ? money(day.revenue).replace("PKR ", "") : "—"}</span>
                <div className="flex h-32 w-full items-end justify-center rounded-t-lg bg-white/[0.035]">
                  <div className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[#a87936] to-[#f2cc7b] shadow-[0_0_18px_rgba(214,174,114,.16)]" style={{ height: `${Math.max(day.revenue ? 8 : 2, (day.revenue / maxRevenue) * 100)}%` }} />
                </div>
                <span className="text-[10px] font-medium text-white/55">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
            <Pulse label="Today" value={money(revenueToday._sum.total || 0)} detail="Revenue" />
            <Pulse label="7-day revenue" value={money(revenue7._sum.total || 0)} detail={`${orders7} orders`} />
            <Pulse label="Average order" value={money(avgOrder)} detail="Last 30 days" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#171615] p-5 shadow-[0_18px_50px_rgba(0,0,0,.2)] sm:p-6">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6ae72]/15 text-[#e4c28e]"><Star className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">Top selling products</h2><p className="text-xs text-white/40">Best performers by units sold</p></div></div><Link href="/admin/products" className="text-xs font-semibold text-[#e4c28e] hover:text-white">View all →</Link></div>
          <div className="mt-6 space-y-5">
            {topProducts.length === 0 ? <Empty message="Top sellers will appear when your first orders arrive." /> : topProducts.map((item, index) => {
              const units = item._sum.quantity || 0
              const maxUnits = Math.max(...topProducts.map((product) => product._sum.quantity || 0), 1)
              return <div key={item.productId}><div className="mb-2 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs text-[#e4c28e]">0{index + 1}</span><span className="truncate text-sm font-medium">{productMap[item.productId]?.name || "Unknown product"}</span></div><span className="shrink-0 text-xs text-white/55">{units} sold</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#a87936] to-[#f2cc7b]" style={{ width: `${(units / maxUnits) * 100}%` }} /></div></div>
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
            <div><p className="text-[10px] uppercase tracking-wider text-white/40">Units sold</p><p className="mt-1 text-xl font-semibold">{(units30._sum.quantity || 0).toLocaleString("en-PK")}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-white/40">Categories moving</p><p className="mt-1 text-xl font-semibold">{categories.length}</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel title="Recent orders" subtitle="Latest customer purchases" href="/admin/orders" linkText="View all">
          {recentOrders.length === 0 ? <Empty message="Your latest orders will appear here." /> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="text-[10px] uppercase tracking-wider text-white/40"><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Date</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id} className="border-t border-white/[0.07]"><td className="py-3.5 font-semibold text-[#e4c28e]"><Link href={`/admin/orders/${order.id}`}>#{order.orderNumber}</Link></td><td className="py-3.5"><p className="font-medium">{order.user?.name || "Customer"}</p><p className="mt-0.5 text-xs text-white/40">{order._count.items} items</p></td><td className="py-3.5 font-medium">{money(order.total)}</td><td className="py-3.5"><Status value={label(order.status)} /></td><td className="py-3.5 text-right text-xs text-white/45">{shortDate(order.createdAt)}</td></tr>)}</tbody></table></div>}
        </Panel>

        <div className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6ae72]/15 text-[#e4c28e]"><Zap className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">Quick actions</h2><p className="text-xs text-white/40">Common store tasks</p></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickAction href="/admin/products/add" icon={<Box />} label="Add product" />
            <QuickAction href="/admin/orders" icon={<ShoppingBag />} label="View orders" />
            <QuickAction href="/admin/analytics" icon={<BarChart3 />} label="View reports" />
            <QuickAction href="/admin/inventory" icon={<Boxes />} label="Manage stock" />
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Needs attention</p>
            <Action href="/admin/orders" icon={<Clock3 />} label="Pending orders" value={pendingOrders} />
            <Action href="/admin/inventory" icon={<Package />} label="Low / out of stock" value={lowStock + outOfStock} />
            <Action href="/admin/reviews" icon={<Star />} label="Reviews to approve" value={pendingReviews} />
            <Action href="/admin/abandoned-carts" icon={<Users />} label="Abandoned carts" value={abandoned} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Category performance" subtitle="Revenue contribution over the last 30 days" href="/admin/analytics" linkText="Analytics">
          {categories.length === 0 ? <Empty message="Category performance will appear after your first sales." /> : <div className="space-y-4">{categories.map(([category, data]) => { const max = Math.max(...categories.map((entry) => entry[1].revenue), 1); return <div key={category}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="text-white/75">{category}</span><span className="font-medium">{money(data.revenue)}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#d6ae72]" style={{ width: `${(data.revenue / max) * 100}%` }} /></div></div> })}</div>}
        </Panel>
        <Panel title="Store health" subtitle="Operational checks and customer experience" href="/admin/inventory" linkText="Manage store">
          <div className="grid grid-cols-2 gap-3">
            <Health label="Delivered orders" value={delivered} />
            <Health label="Pending orders" value={pendingOrders} />
            <Health label="Low stock items" value={lowStock} />
            <Health label="Out of stock" value={outOfStock} />
          </div>
          {recentReviews.length > 0 && <div className="mt-4 border-t border-white/10 pt-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">Latest customer review</p><p className="text-sm text-white/80">{recentReviews[0].comment || "Customer left a rating without a comment."}</p><p className="mt-2 text-xs text-[#e4c28e]">{recentReviews[0].user?.name || "Customer"} · {recentReviews[0].rating}/5 stars</p></div>}
        </Panel>
      </section>
    </div>
  )
}

function Metric({ icon, label, value, note, accent }: { icon: React.ReactNode; label: string; value: string; note: string; accent: "gold" | "green" | "blue" | "purple" }) {
  const tones = { gold: "bg-[#d6ae72]/15 text-[#e4c28e]", green: "bg-emerald-500/15 text-emerald-300", blue: "bg-sky-500/15 text-sky-300", purple: "bg-violet-500/15 text-violet-300" }
  return <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c1b1a] to-[#111] p-4 shadow-[0_12px_32px_rgba(0,0,0,.18)]"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[accent]}`}>{icon}</span><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</span></div><p className="mt-4 truncate text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-[11px] text-white/40">{note}</p></div>
}

function Pulse({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p><p className="mt-1 truncate text-lg font-semibold text-white">{value}</p><p className="mt-1 text-[10px] text-white/40">{detail}</p></div>
}

function Panel({ title, subtitle, href, linkText, children }: { title: string; subtitle: string; href: string; linkText: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-white/10 bg-[#171615] p-5 shadow-[0_16px_40px_rgba(0,0,0,.16)] sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-1 text-xs text-white/40">{subtitle}</p></div><Link href={href} className="shrink-0 text-xs font-semibold text-[#e4c28e] hover:text-white">{linkText} →</Link></div>{children}</section>
}

function Status({ value }: { value: string }) {
  const tone = value === "DELIVERED" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : value === "CANCELLED" || value === "REFUNDED" ? "border-rose-400/20 bg-rose-400/10 text-rose-300" : "border-[#d6ae72]/25 bg-[#d6ae72]/10 text-[#e4c28e]"
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${tone}`}>{value}</span>
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-[#d6ae72]/40 bg-black/20 px-3 py-4 text-center text-xs font-semibold text-white transition hover:border-[#e4c28e] hover:bg-[#d6ae72]/10"><span className="text-[#e4c28e]">{icon}</span>{label}</Link>
}

function Action({ href, icon, label, value }: { href: string; icon: React.ReactNode; label: string; value: number }) {
  return <Link href={href} className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-0 hover:text-[#e4c28e]"><span className="flex items-center gap-2.5 text-xs text-white/65"><span className="text-[#d6ae72]">{icon}</span>{label}</span><span className={`min-w-7 rounded-full px-2 py-1 text-center text-[10px] font-semibold ${value > 0 ? "bg-[#d6ae72] text-[#17110a]" : "bg-white/10 text-white/45"}`}>{value}</span></Link>
}

function Health({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>
}

function Empty({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm text-white/45">{message}</div>
}
