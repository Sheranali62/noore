import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const money = (value: number) => `PKR ${Math.round(value).toLocaleString("en-PK")}`

export default async function AnalyticsPage() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return null

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const previousSince = new Date(since)
  previousSince.setDate(previousSince.getDate() - 30)

  const [orders, validOrders, revenue, previousRevenue, customers, active, units, top, statuses, abandoned, wishlists, couponUses, dailyOrders, categoryGroups, searchGroups] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.order.count({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: previousSince, lt: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { total: true } }),
    prisma.user.count({ where: { createdAt: { gte: since }, role: "CUSTOMER" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.orderItem.aggregate({ where: { order: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }, _sum: { quantity: true } }),
    prisma.orderItem.groupBy({ by: ["productId"], where: { order: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { _count: { status: "desc" } } }),
    prisma.cart.count({ where: { updatedAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, items: { some: {} } } }),
    prisma.wishlistItem.count({ where: { createdAt: { gte: since } } }),
    prisma.couponUsage.count({ where: { usedAt: { gte: since } } }),
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, select: { createdAt: true, total: true } }),
    prisma.orderItem.groupBy({ by: ["productId"], where: { order: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }, _sum: { quantity: true, total: true } }),
    prisma.searchEvent.groupBy({ by: ["query"], where: { createdAt: { gte: since } }, _count: { _all: true }, _avg: { resultCount: true }, orderBy: { _count: { _all: "desc" } }, take: 10 }),
  ])

  const productIds = Array.from(new Set([...top.map(item => item.productId), ...categoryGroups.map(item => item.productId)]))
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, category: true } })
  const productMap = Object.fromEntries(products.map(product => [product.id, product]))

  const categories = new Map<string, { revenue: number; units: number }>()
  for (const item of categoryGroups) {
    const name = productMap[item.productId]?.category || "Uncategorised"
    const current = categories.get(name) || { revenue: 0, units: 0 }
    current.revenue += item._sum.total || 0
    current.units += item._sum.quantity || 0
    categories.set(name, current)
  }
  const categoryRows = Array.from(categories.entries()).sort((a,b) => b[1].revenue-a[1].revenue).slice(0,8)

  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(since)
    day.setDate(since.getDate() + index)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const entries = dailyOrders.filter(order => order.createdAt >= day && order.createdAt < next)
    return { day: day.toLocaleDateString("en-PK", { day: "numeric", month: "short" }), revenue: entries.reduce((sum, item) => sum + item.total, 0), orders: entries.length }
  })
  const maxRevenue = Math.max(...days.map(day => day.revenue), 1)
  const currentRevenue = revenue._sum.total || 0
  const oldRevenue = previousRevenue._sum.total || 0
  const growth = oldRevenue > 0 ? ((currentRevenue - oldRevenue) / oldRevenue) * 100 : null
  const cards = [
    ["Revenue", money(currentRevenue), "Last 30 days"],
    ["Orders", orders.toLocaleString("en-PK"), "All order statuses"],
    ["Units sold", (units._sum.quantity || 0).toLocaleString("en-PK"), "Completed and active sales"],
    ["New customers", customers.toLocaleString("en-PK"), "Joined in the last 30 days"],
    ["Active products", active.toLocaleString("en-PK"), "Currently published"],
    ["Abandoned carts", abandoned.toLocaleString("en-PK"), "With items, inactive 2+ hours"],
    ["Wishlist adds", wishlists.toLocaleString("en-PK"), "Last 30 days"],
    ["Coupon uses", couponUses.toLocaleString("en-PK"), "Last 30 days"],
  ]

  return <div className="mx-auto max-w-[1500px] space-y-6 pb-12 text-white">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d6ae72]">NOORÉ / Business intelligence</p><h1 className="mt-2 font-editorial text-4xl md:text-5xl">Analytics & Reports<span className="text-[#d6ae72]">.</span></h1><p className="mt-2 text-sm text-white/50">A live view of sales, customers, products and store activity.</p></div>
      <div className="flex flex-wrap gap-2"><a href="/api/admin/reports?type=sales" className="rounded-xl bg-[#d6ae72] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#17110a] hover:bg-[#e4c28e]">Export sales</a><a href="/api/admin/reports?type=customers" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:border-[#d6ae72]">Customers CSV</a><a href="/api/admin/reports?type=inventory" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:border-[#d6ae72]">Inventory CSV</a></div>
    </header>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(([label,value,detail],i)=><div key={label} className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c1b1a] to-[#111] p-5 shadow-[0_12px_32px_rgba(0,0,0,.18)]"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/45">{label}</p><p className={`mt-3 truncate text-2xl font-semibold ${i===0?"text-[#e4c28e]":"text-white"}`}>{value}</p><p className="mt-1 text-xs text-white/35">{detail}</p></div>)}</section>

    <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Revenue performance</h2><p className="mt-1 text-xs text-white/40">Daily sales · last 30 days</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-wider text-white/40">Compared with previous 30 days</p><p className={`mt-1 text-xl font-semibold ${growth===null?"text-white":growth>=0?"text-emerald-300":"text-rose-300"}`}>{growth===null?"No prior period":`${growth>=0?"+":""}${growth.toFixed(1)}%`}</p></div></div>
        <div className="mt-6 flex h-52 items-end gap-[3px] sm:gap-1">{days.map((day,index)=><div key={index} className="group relative flex h-full min-w-0 flex-1 items-end"><div title={`${day.day}: ${money(day.revenue)} · ${day.orders} orders`} className="w-full rounded-t-[3px] bg-gradient-to-t from-[#98703b] to-[#e8c58a] transition-opacity hover:opacity-75" style={{height:`${Math.max(day.revenue?5:1,(day.revenue/maxRevenue)*100)}%`}} /></div>)}</div>
        <div className="mt-3 flex justify-between text-[10px] text-white/35"><span>{days[0]?.day}</span><span>{days[14]?.day}</span><span>{days[29]?.day}</span></div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5"><div><p className="text-[10px] uppercase tracking-wider text-white/40">Average order value</p><p className="mt-1 text-xl font-semibold">{money(validOrders?currentRevenue/validOrders:0)}</p></div><div><p className="text-[10px] uppercase tracking-wider text-white/40">Revenue per day</p><p className="mt-1 text-xl font-semibold">{money(currentRevenue/30)}</p></div></div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6"><h2 className="text-lg font-semibold">Best-selling products</h2><p className="mt-1 text-xs text-white/40">Ranked by units sold in the last 30 days</p><div className="mt-6 space-y-5">{top.length?top.map((item,index)=>{const quantity=item._sum.quantity||0;const max=Math.max(...top.map(x=>x._sum.quantity||0),1);return <div key={item.productId}><div className="mb-2 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-[10px] text-[#e4c28e]">0{index+1}</span><span className="truncate text-sm font-medium">{productMap[item.productId]?.name||"Unknown product"}</span></div><span className="shrink-0 text-xs text-white/50">{quantity} units</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-[#d6ae72]" style={{width:`${quantity/max*100}%`}} /></div><p className="mt-1 text-right text-[10px] text-white/35">{money(item._sum.total||0)}</p></div>}) : <Empty text="Product rankings will appear when sales are recorded." />}</div><Link href="/admin/products" className="mt-5 inline-block text-xs font-semibold text-[#e4c28e] hover:text-white">Manage products →</Link></div>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6"><h2 className="text-lg font-semibold">Category performance</h2><p className="mt-1 text-xs text-white/40">Revenue contribution by product category</p><div className="mt-6 space-y-5">{categoryRows.length?categoryRows.map(([name,data])=>{const max=Math.max(...categoryRows.map(row=>row[1].revenue),1);return <div key={name}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="text-white/75">{name}</span><span className="font-medium">{money(data.revenue)}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-[#98703b] to-[#e8c58a]" style={{width:`${data.revenue/max*100}%`}} /></div><p className="mt-1 text-[10px] text-white/35">{data.units} units sold</p></div>}) : <Empty text="Category performance will appear after your first sales." />}</div></div>
      <div className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6"><h2 className="text-lg font-semibold">Order pipeline</h2><p className="mt-1 text-xs text-white/40">Current order status distribution</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{statuses.map(status=><div key={status.status} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">{status.status.replaceAll("_"," ").toLowerCase()}</p><p className="mt-2 text-2xl font-semibold">{status._count._all}</p></div>)}</div><Link href="/admin/orders" className="mt-5 inline-block text-xs font-semibold text-[#e4c28e] hover:text-white">Manage orders →</Link></div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Customer search insights</h2><p className="mt-1 text-xs text-white/40">Most-used search terms over the last 30 days, including average result counts.</p></div><span className="text-[10px] uppercase tracking-wider text-white/35">Search analytics</span></div>
      {searchGroups.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{searchGroups.map(item => <div key={item.query} className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="truncate text-sm font-medium text-[#e4c28e]">{item.query}</p><p className="mt-2 text-xl font-semibold">{item._count._all}</p><p className="text-[10px] text-white/40">searches · avg. {Math.round(item._avg.resultCount || 0)} results</p></div>)}</div> : <p className="mt-5 text-sm text-white/45">Search terms will appear here as customers use the storefront search.</p>}
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6ae72]/20 bg-[#d6ae72]/[0.05] p-5"><div><p className="text-sm font-semibold text-[#e4c28e]">Reports are based on your live store records</p><p className="mt-1 text-xs text-white/45">No sample figures are added. CSV exports use the existing report endpoints.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:border-[#d6ae72]">Dashboard</Link><Link href="/admin/inventory" className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:border-[#d6ae72]">Inventory</Link></div></footer>
  </div>
}

function Empty({text}:{text:string}) { return <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm text-white/45">{text}</div> }
