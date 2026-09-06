"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]
const payments = ["UNPAID", "PAID", "FAILED", "REFUNDED"]
const labels: Record<string, string> = { PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing", PACKED: "Packed", SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled", RETURNED: "Returned", REFUNDED: "Refunded" }

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
  const dirty = status !== initialStatus || paymentStatus !== initialPaymentStatus || trackingNumber !== initialTrackingNumber || courier !== initialCourier

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, paymentStatus, trackingNumber, courier }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update order")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update order")
    } finally { setSaving(false) }
  }

  return (
    <section className="bg-white rounded-2xl border border-cream p-5 lg:p-6 h-fit lg:sticky lg:top-6 print:hidden">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div><p className="text-xs uppercase tracking-[0.16em] text-secondary">Operations</p><h2 className="text-lg font-semibold mt-1">Update order</h2></div>
        {dirty && <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-medium text-amber-800">Unsaved</span>}
      </div>
      <div className="space-y-4">
        <label className="block"><span className="block text-sm font-medium mb-1.5">Order status</span><select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3.5 py-3 border border-cream rounded-xl bg-white">{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label>
        <label className="block"><span className="block text-sm font-medium mb-1.5">Payment status</span><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full px-3.5 py-3 border border-cream rounded-xl bg-white">{payments.map(s => <option key={s}>{s}</option>)}</select></label>
        <div className="rounded-xl bg-cream/50 border border-cream p-4"><p className="text-xs uppercase tracking-[0.14em] text-secondary mb-3">Delivery</p>
          <label className="block mb-3"><span className="block text-sm font-medium mb-1.5">Courier</span><input value={courier} onChange={e => setCourier(e.target.value)} placeholder="TCS, Leopards, M&P…" className="w-full px-3.5 py-3 border border-cream rounded-xl bg-white" /></label>
          <label className="block"><span className="block text-sm font-medium mb-1.5">Tracking number</span><input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" className="w-full px-3.5 py-3 border border-cream rounded-xl bg-white" /></label>
        </div>
        <button onClick={save} disabled={saving || !dirty} className="w-full bg-charcoal text-white py-3 rounded-xl font-medium disabled:opacity-40">{saving ? "Saving…" : "Save order changes"}</button>
        <p className="text-xs leading-5 text-secondary">Status changes can trigger the existing customer notification flow. Cancelling, returning or refunding also follows the existing inventory workflow.</p>
      </div>
    </section>
  )
}
