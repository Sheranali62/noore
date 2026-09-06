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
      setLoading(true)
      setError("")
      try {
        const response = await fetch("/api/admin/orders", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data?.error || "Unable to load orders")
        }
        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch (err: any) {
        if (!cancelled) {
          setOrders([])
          setError(err?.message || "Unable to load orders")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">NOORÉ / Orders</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Order management</h1>
        </div>
        <div className="rounded-2xl border border-cream bg-white p-10 text-center text-secondary">
          Loading orders…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">NOORÉ / Orders</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Order management</h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
          <p className="font-semibold text-red-700">Orders could not be loaded.</p>
          <p className="mt-2 text-sm text-secondary">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-charcoal px-5 py-3 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-secondary">NOORÉ / Orders</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Order management</h1>
        <p className="mt-1 text-secondary">Search, filter and manage customer orders.</p>
      </div>
      <OrdersManagement orders={orders} />
    </div>
  )
}
