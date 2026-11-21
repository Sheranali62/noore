"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowUpRight, Download, Eye, PackageCheck, Printer, Search, ShoppingBag, Truck, Wallet } from "lucide-react"

type OrderRow = {
  id: string
  orderNumber: string
  total: number
  subtotal?: number
  status: string
  paymentMethod: string
  paymentStatus: string
  trackingNumber: string | null
  courier: string | null
  createdAt: string
  user: { name: string | null; email: string | null } | null
  address?: { name?: string; phone?: string; city?: string; province?: string; address?: string } | null
}

const statusLabels: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing", PACKED: "Packed",
  SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", RETURNED: "Returned", REFUNDED: "Refunded",
}
const statusStyles: Record<string, string> = {
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  CONFIRMED: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  PROCESSING: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  PACKED: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
  SHIPPED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  OUT_FOR_DELIVERY: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  DELIVERED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  CANCELLED: "border-red-400/30 bg-red-400/10 text-red-300",
  RETURNED: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  REFUNDED: "border-pink-400/30 bg-pink-400/10 text-pink-300",
}
const money = (value: number) => `PKR ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`
const date = (value: string) => new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })

function exportCsv(rows: OrderRow[]) {
  const header = ["Order", "Customer", "Email", "Phone", "City", "Total", "Status", "Payment", "Payment status", "Courier", "Tracking", "Created"]
  const csv = [header, ...rows.map(o => [o.orderNumber, o.user?.name ?? "Customer", o.user?.email ?? "", o.address?.phone ?? "", o.address?.city ?? "", o.total, statusLabels[o.status] ?? o.status, o.paymentMethod, o.paymentStatus, o.courier ?? "", o.trackingNumber ?? "", o.createdAt])]
    .map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = `noore-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export function OrdersManagement({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("ALL")
  const [payment, setPayment] = useState("ALL")
  const [city, setCity] = useState("ALL")
  const [sort, setSort] = useState<"newest" | "oldest" | "highest">("newest")
  const [selected, setSelected] = useState<string | null>(null)

  const cities = useMemo(() => Array.from(new Set(orders.map(o => o.address?.city).filter((v): v is string => Boolean(v)))).sort(), [orders])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = orders.filter(o => {
      const haystack = [o.orderNumber, o.user?.name, o.user?.email, o.address?.phone, o.address?.city, o.trackingNumber].filter(Boolean).join(" ").toLowerCase()
      return (!q || haystack.includes(q)) && (status === "ALL" || o.status === status) && (payment === "ALL" || o.paymentStatus === payment) && (city === "ALL" || o.address?.city === city)
    })
    return [...rows].sort((a, b) => sort === "highest" ? b.total - a.total : sort === "oldest" ? +new Date(a.createdAt) - +new Date(b.createdAt) : +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [orders, query, status, payment, city, sort])

  const stats = useMemo(() => ({
    revenue: orders.filter(o => !["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)).reduce((sum, o) => sum + o.total, 0),
    pending: orders.filter(o => o.status === "PENDING").length,
    fulfilled: orders.filter(o => o.status === "DELIVERED").length,
    unpaid: orders.filter(o => o.paymentStatus === "UNPAID").length,
  }), [orders])
  const activeOrder = orders.find(o => o.id === selected) ?? null

  return (
    <div className="space-y-6 text-white">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total orders", value: orders.length.toLocaleString("en-PK"), note: "All recorded orders", icon: ShoppingBag },
          { label: "Order value", value: money(stats.revenue), note: "Excluding cancelled / returned", icon: Wallet },
          { label: "Awaiting action", value: stats.pending.toLocaleString("en-PK"), note: "Pending confirmation", icon: PackageCheck },
          { label: "Delivered", value: stats.fulfilled.toLocaleString("en-PK"), note: `${stats.unpaid} unpaid orders`, icon: Truck },
        ].map(({ label, value, note, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#d6ae72]/20 bg-[#171717] p-4 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/50">{label}</p><Icon className="h-4 w-4 text-[#d6ae72]" /></div>
            <p className="mt-3 truncate text-xl font-semibold tracking-tight text-[#f0d49c] sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-white/45">{note}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[#d6ae72]/20 bg-[#171717] p-4 sm:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><p className="text-[10px] uppercase tracking-[.22em] text-[#d6ae72]">Order directory</p><h2 className="mt-1 text-lg font-semibold">Manage customer orders</h2></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exportCsv(filtered)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 hover:border-[#d6ae72]/60"><Download className="h-4 w-4" /> Export CSV</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 hover:border-[#d6ae72]/60"><Printer className="h-4 w-4" /> Print</button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Order, customer, phone, city…" className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d6ae72]/60" /></label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-white/10 bg-[#222] px-3 py-2.5 text-sm text-white"><option value="ALL">All order statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={payment} onChange={e => setPayment(e.target.value)} className="rounded-lg border border-white/10 bg-[#222] px-3 py-2.5 text-sm text-white"><option value="ALL">All payment states</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select>
          <select value={city} onChange={e => setCity(e.target.value)} className="rounded-lg border border-white/10 bg-[#222] px-3 py-2.5 text-sm text-white"><option value="ALL">All cities</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-white/45">Showing <span className="text-white/80">{filtered.length}</span> of {orders.length} orders</p>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="rounded-lg border border-white/10 bg-[#222] px-3 py-2 text-xs text-white"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest value</option></select>
        </div>
      </section>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-[#d6ae72]/20 bg-[#171717]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5"><div><h2 className="font-semibold">Recent orders</h2><p className="mt-1 text-xs text-white/40">Select an order to preview its delivery details.</p></div><span className="rounded-full border border-[#d6ae72]/25 px-3 py-1 text-[10px] uppercase tracking-wider text-[#e5c58d]">Live records</span></div>
          {filtered.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-medium">{orders.length ? "No matching orders" : "No orders yet"}</p><p className="mt-1 text-sm text-white/45">{orders.length ? "Adjust your search or filters." : "New customer orders will appear here."}</p><button onClick={() => { setQuery(""); setStatus("ALL"); setPayment("ALL"); setCity("ALL") }} className="mt-4 text-xs text-[#e5c58d] underline">Clear filters</button></div> :
            <div className="divide-y divide-white/[.07]">{filtered.map(o => <div key={o.id} className={`grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-white/[.035] sm:px-5 md:grid-cols-[1.05fr_1.2fr_.8fr_1fr_auto] md:items-center ${selected === o.id ? "bg-[#d6ae72]/[.07]" : ""}`} onClick={() => setSelected(o.id)}>
              <div className="min-w-0"><p className="text-sm font-semibold text-[#f0d49c]">#{o.orderNumber}</p><p className="mt-1 text-[11px] text-white/40">{date(o.createdAt)}</p></div>
              <div className="min-w-0"><p className="truncate text-sm text-white/90">{o.user?.name || "Customer"}</p><p className="truncate text-xs text-white/40">{o.address?.phone || o.user?.email || "Contact unavailable"}</p></div>
              <p className="text-sm font-medium">{money(o.total)}</p>
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyles[o.status] || "border-white/15 text-white/70"}`}>{statusLabels[o.status] || o.status}</span><span className="text-[10px] text-white/40">{o.paymentStatus}</span></div>
              <div className="flex items-center gap-3"><button type="button" onClick={e => { e.stopPropagation(); setSelected(o.id) }} className="text-xs text-[#e5c58d] hover:text-white"><Eye className="inline h-4 w-4" /> <span className="sr-only">Preview</span></button><Link onClick={e => e.stopPropagation()} href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-[#e5c58d]">Open <ArrowUpRight className="h-3 w-3" /></Link></div>
            </div>)}</div>}
        </section>

        <aside className="rounded-2xl border border-[#d6ae72]/20 bg-[#171717] p-5 2xl:sticky 2xl:top-6">
          <p className="text-[10px] uppercase tracking-[.22em] text-[#d6ae72]">Quick view</p>
          {activeOrder ? <><div className="mt-3 flex items-start justify-between gap-2"><div><h3 className="text-lg font-semibold text-[#f0d49c]">#{activeOrder.orderNumber}</h3><p className="mt-1 text-xs text-white/40">{date(activeOrder.createdAt)}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] ${statusStyles[activeOrder.status] || "border-white/15"}`}>{statusLabels[activeOrder.status] || activeOrder.status}</span></div>
            <div className="my-5 border-t border-white/10" />
            <p className="text-xs uppercase tracking-wider text-white/40">Customer</p><p className="mt-1 font-medium">{activeOrder.user?.name || "Customer"}</p><p className="mt-1 break-all text-xs text-white/50">{activeOrder.user?.email || "Email unavailable"}</p>
            <div className="mt-4"><p className="text-xs uppercase tracking-wider text-white/40">Delivery details</p><p className="mt-1 text-sm">{activeOrder.address?.phone || "Phone unavailable"}</p><p className="mt-1 text-sm text-white/65">{[activeOrder.address?.address, activeOrder.address?.city, activeOrder.address?.province].filter(Boolean).join(", ") || "Address details available in full order"}</p></div>
            <div className="my-5 border-t border-white/10" />
            <div className="flex justify-between text-sm"><span className="text-white/45">Payment</span><span>{activeOrder.paymentMethod === "COD" ? "Cash on Delivery" : activeOrder.paymentMethod}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-white/45">Payment status</span><span>{activeOrder.paymentStatus}</span></div><div className="mt-4 flex justify-between border-t border-white/10 pt-4"><span className="text-sm text-white/55">Order total</span><strong className="text-lg text-[#f0d49c]">{money(activeOrder.total)}</strong></div>
            <Link href={`/admin/orders/${activeOrder.id}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-4 py-3 text-sm font-semibold text-[#17110a] hover:brightness-110">Open full order <ArrowUpRight className="h-4 w-4" /></Link>
          </> : <div className="py-12 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-[#d6ae72]/50" /><p className="mt-3 text-sm text-white/65">Choose an order from the list</p><p className="mt-1 text-xs text-white/35">Customer, delivery and payment details will appear here.</p></div>}
        </aside>
      </div>
    </div>
  )
}
