"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type OrderRow = {
  id: string
  orderNumber: string
  total: number
  status: string
  paymentMethod: string
  paymentStatus: string
  trackingNumber: string | null
  courier: string | null
  createdAt: string
  user: { name: string | null; email: string | null } | null
}

const statusLabels: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing", PACKED: "Packed",
  SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", RETURNED: "Returned", REFUNDED: "Refunded",
}

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200", CONFIRMED: "bg-blue-50 text-blue-800 border-blue-200",
  PROCESSING: "bg-violet-50 text-violet-800 border-violet-200", PACKED: "bg-indigo-50 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-cyan-50 text-cyan-800 border-cyan-200", OUT_FOR_DELIVERY: "bg-orange-50 text-orange-800 border-orange-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200", CANCELLED: "bg-red-50 text-red-800 border-red-200",
  RETURNED: "bg-slate-50 text-slate-700 border-slate-200", REFUNDED: "bg-pink-50 text-pink-800 border-pink-200",
}

function formatMoney(value: number) { return `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}` }
function formatDate(value: string) { return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) }
function exportCsv(rows: OrderRow[]) {
  const header = ["Order","Customer","Email","Total","Status","Payment","Payment Status","Courier","Tracking","Created At"]
  const csv = [header, ...rows.map(o => [o.orderNumber, o.user?.name ?? "Customer", o.user?.email ?? "", o.total, statusLabels[o.status] ?? o.status, o.paymentMethod, o.paymentStatus, o.courier ?? "", o.trackingNumber ?? "", o.createdAt])].map(row => row.map(v => `"${String(v).replaceAll("\"", "\"\"")}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `noore-orders-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
}

export function OrdersManagement({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("ALL")
  const [payment, setPayment] = useState("ALL")
  const [sort, setSort] = useState<"newest" | "oldest" | "highest">("newest")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = orders.filter((order) => {
      const customer = `${order.user?.name ?? ""} ${order.user?.email ?? ""}`.toLowerCase()
      const matchesQuery = !q || order.orderNumber.toLowerCase().includes(q) || customer.includes(q) || (order.trackingNumber ?? "").toLowerCase().includes(q)
      return matchesQuery && (status === "ALL" || order.status === status) && (payment === "ALL" || order.paymentStatus === payment)
    })
    return [...rows].sort((a, b) => sort === "highest" ? b.total - a.total : sort === "oldest" ? +new Date(a.createdAt) - +new Date(b.createdAt) : +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [orders, query, status, payment, sort])

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    processing: orders.filter(o => ["CONFIRMED", "PROCESSING", "PACKED"].includes(o.status)).length,
    shipping: orders.filter(o => ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
  }), [orders])

  function printList() { window.print() }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[['All orders', counts.all], ['Pending', counts.pending], ['Processing', counts.processing], ['Shipping', counts.shipping], ['Delivered', counts.delivered]].map(([label, value]) => (
          <button key={String(label)} onClick={() => setStatus(label === "All orders" ? "ALL" : label === "Processing" ? "PROCESSING" : label === "Shipping" ? "SHIPPED" : String(label).toUpperCase())} className="group text-left rounded-2xl border border-charcoal/10 bg-white p-4 shadow-[0_8px_30px_rgba(23,23,23,0.04)] transition hover:-translate-y-0.5 hover:border-charcoal/25 hover:shadow-lg">
            <p className="text-xs uppercase tracking-[0.16em] text-secondary">{label}</p><p className="text-2xl font-semibold mt-1">{value}</p>
          </button>
        ))}
      </div>

      <section className="rounded-3xl border border-charcoal/10 bg-white p-4 shadow-[0_12px_40px_rgba(23,23,23,0.05)] lg:p-5 print:hidden">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order #, customer, email or tracking…" className="w-full rounded-xl border border-charcoal/10 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-charcoal/10" /></div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-charcoal/10 bg-background px-4 py-3"><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={payment} onChange={e => setPayment(e.target.value)} className="rounded-xl border border-charcoal/10 bg-background px-4 py-3"><option value="ALL">All payment states</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="rounded-xl border border-charcoal/10 bg-background px-4 py-3"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest value</option></select>
          <button onClick={() => exportCsv(filtered)} className="rounded-xl border border-charcoal/10 px-4 py-3 font-medium transition hover:bg-cream">Export CSV</button><button onClick={printList} className="rounded-xl border border-charcoal/10 px-4 py-3 font-medium transition hover:bg-cream">Print list</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_12px_40px_rgba(23,23,23,0.05)]">
        <div className="hidden md:grid grid-cols-[1.1fr_1.4fr_.9fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-3 bg-charcoal/[0.035] text-[11px] uppercase tracking-[0.14em] text-secondary font-medium"> <span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Payment</span><span>Date</span><span /></div>
        {filtered.length === 0 ? <div className="py-16 text-center px-6"><p className="font-semibold text-lg">{orders.length ? "No orders match these filters" : "No orders yet"}</p><p className="text-secondary mt-1">{orders.length ? "Try a different search or filter." : "Orders will appear here when customers place orders."}</p>{orders.length > 0 && <button onClick={() => {setQuery("");setStatus("ALL");setPayment("ALL")}} className="mt-4 underline">Clear filters</button>}</div> : <div className="divide-y divide-cream">{filtered.map(order => <div key={order.id} className="grid md:grid-cols-[1.1fr_1.4fr_.9fr_1fr_1fr_1.2fr_auto] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-cream/30 transition">
          <div><Link href={`/admin/orders/${order.id}`} className="font-semibold hover:underline">#{order.orderNumber}</Link>{order.trackingNumber && <p className="text-xs text-secondary mt-1">{order.courier ? `${order.courier} · ` : ""}{order.trackingNumber}</p>}</div>
          <div><p className="font-medium">{order.user?.name || "Customer"}</p><p className="text-xs text-secondary truncate">{order.user?.email || ""}</p></div>
          <p className="font-medium">{formatMoney(order.total)}</p>
          <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[order.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>{statusLabels[order.status] || order.status}</span>
          <div><p className="text-sm">{order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}</p><p className="text-xs text-secondary">{order.paymentStatus}</p></div>
          <p className="text-sm text-secondary">{formatDate(order.createdAt)}</p>
          <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium underline underline-offset-4">View</Link>
        </div>)}</div>}
      </section>
      <p className="text-sm text-secondary">Showing {filtered.length} of {orders.length} orders.</p>
    </div>
  )
}
