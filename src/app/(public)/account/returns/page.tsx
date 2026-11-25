"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Item = { id: string; quantity: number; product: { name: string; images: string[] }; variant: { color: string; size: string } | null }
type EligibleOrder = { id: string; orderNumber: string; updatedAt: string; items: Item[] }
type ReturnRecord = { id: string; reason: string; details: string | null; status: string; createdAt: string; adminNote: string | null; order: { orderNumber: string } }

const reasons = ["Wrong item received", "Damaged or defective", "Size or fit issue", "Different from description", "Other"]

export default function ReturnsPage() {
  const [orders, setOrders] = useState<EligibleOrder[]>([])
  const [requests, setRequests] = useState<ReturnRecord[]>([])
  const [orderId, setOrderId] = useState("")
  const [itemIds, setItemIds] = useState<string[]>([])
  const [reason, setReason] = useState(reasons[0])
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    try {
      const response = await fetch("/api/returns", { cache: "no-store" })
      if (response.status === 401) { window.location.href = "/login?callbackUrl=/account/returns"; return }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to load returns.")
      setOrders(data.eligibleOrders || [])
      setRequests(data.requests || [])
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load returns.") }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])
  const selectedOrder = orders.find(order => order.id === orderId)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(""); setMessage("")
    if (!orderId || !itemIds.length) return setError("Select an order and at least one item.")
    setSaving(true)
    try {
      const response = await fetch("/api/returns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, itemIds, reason, details }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to submit return.")
      setMessage(data.message || "Return request submitted.")
      setOrderId(""); setItemIds([]); setDetails("")
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit return.") }
    finally { setSaving(false) }
  }

  return <main className="min-h-screen bg-[#F7F6F2] py-10"><div className="mx-auto max-w-5xl px-4">
    <Link href="/account" className="text-sm text-[#777967] hover:underline">← Back to account</Link>
    <header className="mt-6"><p className="text-xs uppercase tracking-[.22em] text-[#777967]">NOORÉ customer care</p><h1 className="mt-2 font-editorial text-4xl md:text-5xl">Returns & exchanges</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#777967]">Request a return for an eligible delivered order. Our team will review your request and update its status here.</p></header>
    <section className="mt-8 rounded-2xl border border-[#D8D8CB] bg-white p-5 md:p-7">
      <h2 className="font-editorial text-2xl">Start a return request</h2>
      {loading ? <p className="mt-5 text-sm text-[#777967]">Loading your orders…</p> : orders.length === 0 ? <p className="mt-5 rounded-xl bg-[#EEEDE6] p-5 text-sm text-[#777967]">You have no delivered orders currently eligible for a return request.</p> : <form onSubmit={submit} className="mt-5 space-y-5">
        <label className="block text-sm font-medium">Delivered order<select value={orderId} onChange={e => { setOrderId(e.target.value); setItemIds([]) }} required className="mt-2 w-full rounded-lg border border-[#D8D8CB] bg-white p-3"><option value="">Choose an order</option>{orders.map(order => <option key={order.id} value={order.id}>#{order.orderNumber} · {new Date(order.updatedAt).toLocaleDateString()}</option>)}</select></label>
        {selectedOrder && <fieldset><legend className="text-sm font-medium">Select the items you want to return</legend><div className="mt-2 space-y-2">{selectedOrder.items.map(item => <label key={item.id} className="flex items-center gap-3 rounded-xl border border-[#D8D8CB] p-3 text-sm"><input type="checkbox" checked={itemIds.includes(item.id)} onChange={e => setItemIds(current => e.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span className="min-w-0 flex-1">{item.product.name}{item.variant ? ` · ${item.variant.color} / ${item.variant.size}` : ""} · Qty {item.quantity}</span></label>)}</div></fieldset>}
        <label className="block text-sm font-medium">Reason<select value={reason} onChange={e => setReason(e.target.value)} className="mt-2 w-full rounded-lg border border-[#D8D8CB] bg-white p-3">{reasons.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="block text-sm font-medium">Additional details<textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={2000} rows={4} placeholder="Tell us more about the issue (optional)." className="mt-2 w-full rounded-lg border border-[#D8D8CB] p-3" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-green-700">{message}</p>}
        <button disabled={saving} className="rounded-lg bg-[#535F4C] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit return request"}</button>
      </form>}
    </section>
    <section className="mt-8"><h2 className="font-editorial text-2xl">Your return requests</h2>{requests.length === 0 ? <p className="mt-4 text-sm text-[#777967]">No return requests yet.</p> : <div className="mt-4 space-y-3">{requests.map(item => <article key={item.id} className="rounded-xl border border-[#D8D8CB] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Order #{item.order.orderNumber}</p><p className="mt-1 text-xs text-[#777967]">{item.reason} · {new Date(item.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-[#EEEDE6] px-3 py-1.5 text-xs font-semibold text-[#535F4C]">{item.status.replaceAll("_", " ")}</span></div>{item.details && <p className="mt-3 text-sm text-[#777967]">{item.details}</p>}{item.adminNote && <p className="mt-3 border-t border-[#D8D8CB] pt-3 text-sm"><strong>NOORÉ update:</strong> {item.adminNote}</p>}</article>)}</div>}</section>
  </div></main>
}
