"use client"

import { useEffect, useState } from "react"

type RequestItem = {
  id: string
  orderId: string
  reason: string
  details: string | null
  itemIds: string[]
  status: string
  adminNote: string | null
  refundAmount: number | null
  createdAt: string
  order: { id: string; orderNumber: string; total: number; status: string; items: Array<{ id: string; product: { name: string }; variant: { color: string; size: string } | null }> }
  user: { id: string; name: string | null; email: string }
}

const statuses = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "RECEIVED", "REFUNDED", "EXCHANGED"]

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [refunds, setRefunds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/returns", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load requests")
      setRequests(data.requests || [])
      setNotes(Object.fromEntries((data.requests || []).map((item: RequestItem) => [item.id, item.adminNote || ""])))
      setRefunds(Object.fromEntries((data.requests || []).map((item: RequestItem) => [item.id, item.refundAmount == null ? "" : String(item.refundAmount)])))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function update(item: RequestItem, status: string) {
    setSaving(item.id)
    setError("")
    try {
      const response = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status, adminNote: notes[item.id] || "", refundAmount: refunds[item.id] || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not update request")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request")
    } finally {
      setSaving(null)
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-12 text-white">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6ae72]">Customer care / Operations</p>
        <h1 className="mt-3 font-editorial text-4xl sm:text-5xl">Returns & Exchanges</h1>
        <p className="mt-2 text-sm text-white/50">Review customer exchange and item-issue requests, record decisions and keep an order event history.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {loading ? <p className="text-sm text-white/50">Loading requests…</p> : requests.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">No customer requests have been submitted.</div> : (
        <div className="space-y-4">
          {requests.map(item => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#d6ae72]">Order #{item.order.orderNumber}</p>
                  <h2 className="mt-1 text-lg font-semibold">{item.reason}</h2>
                  <p className="mt-1 text-xs text-white/45">{item.user.name || "Customer"} · {item.user.email} · {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-[#d6ae72]/30 bg-[#d6ae72]/10 px-3 py-1 text-xs font-semibold text-[#e4c28e]">{item.status.replaceAll("_", " ")}</span>
              </div>
              {item.details && <p className="mt-4 rounded-xl bg-white/[.04] p-4 text-sm leading-6 text-white/75">{item.details}</p>}
              <div className="mt-3 space-y-1 text-xs text-white/55"><p className="font-semibold uppercase tracking-wider text-white/35">Requested items</p>{item.itemIds.length ? item.itemIds.map(id => { const productItem = item.order.items.find(entry => entry.id === id); return <p key={id}>• {productItem ? productItem.product.name + (productItem.variant ? ` · ${productItem.variant.color} / ${productItem.variant.size}` : "") : "Item no longer available"}</p> }) : <p>All items</p>}</div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto]">
                <label className="text-xs text-white/50">Admin note
                  <textarea rows={2} value={notes[item.id] || ""} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#d6ae72]" placeholder="Internal/customer-facing decision note" />
                </label>
                <label className="text-xs text-white/50">Refund amount (PKR, if applicable)
                  <input type="number" min="0" step="0.01" value={refunds[item.id] || ""} onChange={event => setRefunds(current => ({ ...current, [item.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#d6ae72]" placeholder="0.00" />
                </label>
                <label className="text-xs text-white/50">Update status
                  <select defaultValue={item.status} onChange={event => update(item, event.target.value)} disabled={saving === item.id} className="mt-2 w-full rounded-lg border border-white/10 bg-[#24211e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d6ae72]">
                    {statuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <div className="flex items-end">
                  <button type="button" disabled={saving === item.id} onClick={() => update(item, item.status)} className="w-full rounded-lg bg-[#d6ae72] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#17110a] disabled:opacity-50">{saving === item.id ? "Saving…" : "Save note"}</button>
                </div>
              </div>
              {item.status === "REFUNDED" && <p className="mt-3 text-xs text-amber-200">Record the actual refund with your payment provider or bank. This status is an operations record and does not transfer money.</p>}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
