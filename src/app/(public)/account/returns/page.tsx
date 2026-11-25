"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"

type EligibleOrder = {
  id: string
  orderNumber: string
  updatedAt: string
  items: Array<{ id: string; quantity: number; product: { name: string }; variant: { color: string; size: string } | null }>
}
type ReturnRequest = {
  id: string
  reason: string
  details: string | null
  status: string
  createdAt: string
  order: { orderNumber: string; status: string }
}

export default function AccountReturnsPage() {
  const { status: sessionStatus } = useSession()
  const [orders, setOrders] = useState<EligibleOrder[]>([])
  const [requests, setRequests] = useState<ReturnRequest[]>([])
  const [orderId, setOrderId] = useState("")
  const [reason, setReason] = useState("Size or fit issue")
  const [details, setDetails] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const selectedOrder = useMemo(() => orders.find(order => order.id === orderId), [orders, orderId])

  async function load() {
    setLoading(true)
    try {
      const response = await fetch("/api/returns", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load requests")
      setOrders(data.eligibleOrders || [])
      setRequests(data.requests || [])
      if (!orderId && data.eligibleOrders?.[0]) setOrderId(data.eligibleOrders[0].id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") load()
    else if (sessionStatus === "unauthenticated") setLoading(false)
  }, [sessionStatus])

  useEffect(() => { setSelected([]) }, [orderId])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason, details, itemIds: selected }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit request")
      setMessage("Your request has been submitted. Our team will review it.")
      setDetails("")
      setSelected([])
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit request")
    } finally {
      setSaving(false)
    }
  }

  if (sessionStatus === "unauthenticated") return <main className="min-h-[60vh] bg-[#F7F6F2] px-5 py-20 text-center"><h1 className="font-editorial text-3xl">Sign in to manage exchanges</h1><Link href="/login?callbackUrl=/account/returns" className="mt-5 inline-flex rounded-xl bg-[#535F4C] px-5 py-3 text-white">Sign in</Link></main>

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-10 text-[#30352E] md:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/account" className="text-sm text-[#535F4C] underline">← My account</Link>
        <header className="mt-5"><p className="text-xs uppercase tracking-[.24em] text-[#777967]">Customer care</p><h1 className="mt-2 font-editorial text-4xl">Exchanges & item issues</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#777967]">Submit a request within 7 days of delivery. Our team will review eligibility and contact you with next steps. Please do not ship an item before receiving instructions.</p></header>

        <section className="mt-8 rounded-2xl border border-[#D8D8CB] bg-white p-5 sm:p-7">
          <h2 className="font-editorial text-2xl">New request</h2>
          {loading ? <p className="mt-5 text-sm text-[#777967]">Loading your eligible orders…</p> : orders.length === 0 ? <div className="mt-5 rounded-xl bg-[#F7F6F2] p-5 text-sm text-[#777967]">There are no delivered orders currently eligible for an online exchange request. If your item arrived damaged, incorrect or incomplete, please contact customer care.</div> : (
            <form onSubmit={submit} className="mt-5 space-y-5">
              <label className="block text-sm font-medium">Delivered order
                <select value={orderId} onChange={event => setOrderId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#D8D8CB] bg-white px-3 py-3">
                  {orders.map(order => <option key={order.id} value={order.id}>#{order.orderNumber}</option>)}
                </select>
              </label>
              {selectedOrder && <fieldset className="space-y-3"><legend className="text-sm font-medium">Select items</legend>{selectedOrder.items.map(item => <label key={item.id} className="flex items-start gap-3 rounded-lg border border-[#D8D8CB] p-3 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} className="mt-1"/><span><strong>{item.product.name}</strong><span className="block text-xs text-[#777967]">{[item.variant?.color, item.variant?.size, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}</span></span></label>)}</fieldset>}
              <label className="block text-sm font-medium">Reason
                <select value={reason} onChange={event => setReason(event.target.value)} className="mt-2 w-full rounded-lg border border-[#D8D8CB] bg-white px-3 py-3">
                  {["Size or fit issue", "Damaged item", "Wrong item received", "Missing item", "Other"].map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Additional details
                <textarea value={details} onChange={event => setDetails(event.target.value)} rows={4} maxLength={1500} placeholder="Tell us what happened and what outcome you are requesting." className="mt-2 w-full rounded-lg border border-[#D8D8CB] px-3 py-3 font-normal"/>
              </label>
              {message && <p role="status" className="rounded-lg bg-[#F7F6F2] p-3 text-sm">{message}</p>}
              <button disabled={saving || !orderId || selected.length === 0} className="rounded-xl bg-[#535F4C] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit request"}</button>
            </form>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-[#D8D8CB] bg-white p-5 sm:p-7">
          <h2 className="font-editorial text-2xl">Your requests</h2>
          {requests.length === 0 ? <p className="mt-4 text-sm text-[#777967]">You have not submitted an exchange or item issue request.</p> : <div className="mt-4 divide-y divide-[#E7E4DC]">{requests.map(item => <div key={item.id} className="flex flex-wrap justify-between gap-3 py-4"><div><p className="font-medium">Order #{item.order.orderNumber}</p><p className="mt-1 text-sm text-[#777967]">{item.reason}</p><p className="mt-1 text-xs text-[#777967]">{new Date(item.createdAt).toLocaleDateString()}</p></div><span className="h-fit rounded-full bg-[#EEEDE6] px-3 py-1 text-xs font-semibold">{item.status.replaceAll("_", " ")}</span></div>)}</div>}
        </section>
      </div>
    </main>
  )
}
