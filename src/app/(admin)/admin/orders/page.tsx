"use client"

import { useEffect, useState } from "react"
import { OrdersManagement } from "@/components/admin/orders-management"

export const dynamic = "force-dynamic"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function loadOrders() {
      setLoading(true); setError("")
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store", headers: { Accept: "application/json" } })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data?.error || "Unable to load orders")
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch (err: any) {
        if (!cancelled) { setOrders([]); setError(err?.message || "Unable to load orders") }
      } finally { if (!cancelled) setLoading(false) }
    }
    loadOrders(); return () => { cancelled = true }
  }, [])

  const heading = <div className="mb-7">
    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ / Operations</p>
    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div><h1 className="font-editorial text-4xl tracking-tight md:text-5xl">Orders</h1><p className="mt-2 max-w-2xl text-sm text-secondary">A calm, command-centre view for searching, filtering and fulfilling every customer order.</p></div>
      <span className="w-fit rounded-full border border-charcoal/10 bg-charcoal px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">COD commerce</span>
    </div>
  </div>

  if (loading) return <div className="max-w-7xl">{heading}<div className="rounded-3xl border border-charcoal/10 bg-white p-12 text-center shadow-sm"><div className="mx-auto mb-4 h-8 w-8 animate-pulse rounded-full bg-charcoal/10"/><p className="text-sm text-secondary">Preparing your order workspace…</p></div></div>
  if (error) return <div className="max-w-7xl">{heading}<div className="rounded-3xl border border-red-200 bg-white p-10 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Workspace error</p><p className="mt-2 text-xl font-semibold">Orders could not be loaded.</p><p className="mt-2 text-sm text-secondary">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-charcoal px-5 py-3 text-sm font-semibold text-white">Try again</button></div></div>

  return <div className="max-w-7xl pb-12">{heading}<OrdersManagement orders={orders} /></div>
}
