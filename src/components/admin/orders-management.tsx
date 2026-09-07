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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[['All orders',counts.all],['Pending',counts.pending],['Processing',counts.processing],['Shipping',counts.shipping],['Delivered',counts.delivered]].map(([label,value])=><button key={String(label)} onClick={()=>setStatus(label==="All orders"?"ALL":label==="Processing"?"PROCESSING":label==="Shipping"?"SHIPPED":String(label).toUpperCase())} className="admin-surface group text-left transition hover:-translate-y-0.5 hover:border-white/15"><p className="admin-eyebrow">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{value}</p><div className="mt-2 h-1 w-10 rounded-full bg-white/15 transition group-hover:w-16"/></button>)}</div>
      <section className="admin-surface print:hidden"><div className="flex flex-col gap-3 xl:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order #, customer, email or tracking…" className="admin-input min-w-0 flex-1"/><select value={status} onChange={e=>setStatus(e.target.value)} className="admin-input xl:w-44"><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><select value={payment} onChange={e=>setPayment(e.target.value)} className="admin-input xl:w-44"><option value="ALL">All payment states</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className="admin-input xl:w-40"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest value</option></select><div className="flex gap-2"><button onClick={()=>exportCsv(filtered)} className="admin-button-secondary flex-1">Export CSV</button><button onClick={printList} className="admin-button-secondary flex-1">Print</button></div></div></section>
      <section className="admin-surface overflow-hidden p-0"><div className="hidden border-b border-white/10 bg-white/[0.025] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/35 md:grid md:grid-cols-[1.1fr_1.4fr_.9fr_1fr_1fr_1.2fr_auto] md:gap-4"><span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Payment</span><span>Date</span><span/></div>{filtered.length===0?<div className="px-6 py-16 text-center"><p className="text-lg font-semibold text-white">{orders.length?"No orders match these filters":"No orders yet"}</p><p className="mt-1 text-sm text-white/40">{orders.length?"Try a different search or filter.":"Orders will appear here when customers place orders."}</p>{orders.length>0&&<button onClick={()=>{setQuery("");setStatus("ALL");setPayment("ALL")}} className="mt-4 text-sm text-white underline decoration-white/20 underline-offset-4">Clear filters</button>}</div>:<div className="divide-y divide-white/[0.07]">{filtered.map(order=><div key={order.id} className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.025] md:grid-cols-[1.1fr_1.4fr_.9fr_1fr_1fr_1.2fr_auto] md:items-center md:gap-4"><div><Link href={`/admin/orders/${order.id}`} className="font-semibold text-white hover:underline">#{order.orderNumber}</Link>{order.trackingNumber&&<p className="mt-1 text-xs text-white/35">{order.courier?`${order.courier} · `:""}{order.trackingNumber}</p>}</div><div><p className="font-medium text-white">{order.user?.name||"Customer"}</p><p className="truncate text-xs text-white/35">{order.user?.email||""}</p></div><p className="font-medium text-white">{formatMoney(order.total)}</p><span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClasses[order.status]||"border-white/10 bg-white/[0.04] text-white/60"}`}>{statusLabels[order.status]||order.status}</span><div><p className="text-sm text-white/70">{order.paymentMethod==="COD"?"Cash on Delivery":order.paymentMethod}</p><p className="mt-0.5 text-xs text-white/35">{order.paymentStatus}</p></div><p className="text-sm text-white/40">{formatDate(order.createdAt)}</p><Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-white underline decoration-white/20 underline-offset-4">View</Link></div>)}</div>}</section><p className="text-xs text-white/35">Showing {filtered.length} of {orders.length} orders.</p>
    </div>
  )
}
