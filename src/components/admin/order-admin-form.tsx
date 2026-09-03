"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]
const payments = ["UNPAID", "PAID", "FAILED", "REFUNDED"]

export function OrderAdminForm({ orderId, initialStatus, initialPaymentStatus, initialTrackingNumber, initialCourier }: {
  orderId: string
  initialStatus: string
  initialPaymentStatus: string
  initialTrackingNumber: string
  initialCourier: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber)
  const [courier, setCourier] = useState(initialCourier)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, trackingNumber, courier }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update order")
      router.refresh()
      alert("Order updated successfully")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update order")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-cream p-6 h-fit lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold mb-5">Order Management</h2>
      <div className="space-y-4">
        <label className="block"><span className="block text-sm font-medium mb-1">Order Status</span><select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-cream rounded">{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="block"><span className="block text-sm font-medium mb-1">Payment Status</span><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full px-3 py-2 border border-cream rounded">{payments.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="block"><span className="block text-sm font-medium mb-1">Courier</span><input value={courier} onChange={e => setCourier(e.target.value)} placeholder="TCS, Leopards, M&P..." className="w-full px-3 py-2 border border-cream rounded" /></label>
        <label className="block"><span className="block text-sm font-medium mb-1">Tracking Number</span><input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="w-full px-3 py-2 border border-cream rounded" /></label>
        <button onClick={save} disabled={saving} className="w-full bg-charcoal text-white py-3 rounded font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Order Changes"}</button>
      </div>
    </section>
  )
}
