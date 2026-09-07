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

  if (loading) return <div className="admin-page space-y-6"><PageIntro /><div className="admin-surface flex min-h-56 items-center justify-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white" /><p className="mt-4 text-sm text-white/60">Loading orders…</p></div></div></div>
  if (error) return <div className="admin-page space-y-6"><PageIntro /><div className="admin-surface border-red-400/20"><p className="text-sm font-semibold text-red-300">Orders could not be loaded.</p><p className="mt-2 text-sm text-white/55">{error}</p><button type="button" onClick={() => window.location.reload()} className="admin-button-primary mt-5">Try again</button></div></div>
  return <div className="admin-page space-y-7"><PageIntro /><OrdersManagement orders={orders} /></div>
}

function PageIntro() {
  return <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="admin-eyebrow">Operations / Orders</p><h1 className="admin-title">Order management</h1><p className="admin-subtitle">A clear command center for every customer order, payment state and delivery step.</p></div><div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/55 md:block">COD commerce · Live catalog</div></header>
}
