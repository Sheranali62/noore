"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type Ticket = {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  createdAt: string
  order: { orderNumber: string } | null
  messages: Array<{ id: string; message: string; isStaff: boolean; createdAt: string }>
}

export default function AccountSupportPage() {
  const { status: authStatus } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeId, setActiveId] = useState("")
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("General")
  const [orderId, setOrderId] = useState("")
  const [message, setMessage] = useState("")
  const [reply, setReply] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const active = tickets.find(ticket => ticket.id === activeId)

  async function load() {
    const response = await fetch("/api/support/tickets", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Unable to load support tickets")
    setTickets(data.tickets || [])
    if (!activeId && data.tickets?.[0]) setActiveId(data.tickets[0].id)
  }

  useEffect(() => {
    if (authStatus === "authenticated") load().catch(err => setError(err.message))
  }, [authStatus])

  async function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setError("")
    try {
      const response = await fetch("/api/support/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, category, orderId: orderId || null, message }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to create ticket")
      setSubject(""); setMessage(""); setOrderId("")
      await load()
      setActiveId(data.ticket.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create ticket")
    } finally { setSaving(false) }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!active || !reply.trim()) return
    setSaving(true); setError("")
    try {
      const response = await fetch(`/api/support/tickets/${active.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: reply }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to send reply")
      setReply("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reply")
    } finally { setSaving(false) }
  }

  if (authStatus === "unauthenticated") return <main className="min-h-[60vh] bg-[#F7F6F2] px-5 py-20 text-center"><h1 className="font-editorial text-3xl">Sign in to contact support</h1><Link href="/login?callbackUrl=/account/support" className="mt-5 inline-flex rounded-xl bg-[#535F4C] px-5 py-3 text-white">Sign in</Link></main>

  return <main className="min-h-screen bg-[#F7F6F2] px-4 py-10 text-[#30352E] md:py-16"><div className="mx-auto max-w-6xl"><Link href="/account" className="text-sm text-[#535F4C] underline">← My account</Link><header className="mt-5"><p className="text-xs uppercase tracking-[.24em] text-[#777967]">NOORÉ Customer Care</p><h1 className="mt-2 font-editorial text-4xl">Support centre</h1><p className="mt-3 text-sm text-[#777967]">Create a support request and keep the conversation with our team in one place.</p></header>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl border border-[#D8D8CB] bg-white p-5"><h2 className="font-editorial text-2xl">New support request</h2><form onSubmit={createTicket} className="mt-5 space-y-4">
        <label className="block text-sm font-medium">Subject<input required maxLength={160} value={subject} onChange={e=>setSubject(e.target.value)} className="mt-2 w-full rounded-lg border border-[#D8D8CB] px-3 py-3"/></label>
        <label className="block text-sm font-medium">Category<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 w-full rounded-lg border border-[#D8D8CB] bg-white px-3 py-3">{["General","Order status","Delivery","Product quality","Payment","Exchange or return","Website issue"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="block text-sm font-medium">Order reference (optional)<input value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="Paste your order ID" className="mt-2 w-full rounded-lg border border-[#D8D8CB] px-3 py-3"/></label>
        <label className="block text-sm font-medium">Message<textarea required minLength={5} maxLength={5000} rows={5} value={message} onChange={e=>setMessage(e.target.value)} className="mt-2 w-full rounded-lg border border-[#D8D8CB] px-3 py-3 font-normal"/></label>
        <button disabled={saving} className="w-full rounded-xl bg-[#535F4C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving?"Sending…":"Create support ticket"}</button>
      </form></section>
      <section className="rounded-2xl border border-[#D8D8CB] bg-white p-5"><h2 className="font-editorial text-2xl">Your conversations</h2>
        {tickets.length===0?<p className="mt-5 text-sm text-[#777967]">You have no support tickets yet.</p>:<div className="mt-5 grid gap-4 md:grid-cols-[.7fr_1.3fr]">
          <div className="space-y-2">{tickets.map(ticket=><button key={ticket.id} onClick={()=>setActiveId(ticket.id)} className={`w-full rounded-xl border p-3 text-left ${activeId===ticket.id?"border-[#535F4C] bg-[#535F4C]/10":"border-[#D8D8CB]"}`}><p className="text-sm font-semibold">{ticket.subject}</p><p className="mt-1 text-xs text-[#777967]">{ticket.status.replaceAll("_"," ")} · {ticket.priority}</p></button>)}</div>
          {active&&<div className="rounded-xl bg-[#F7F6F2] p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{active.subject}</h3><span className="text-xs text-[#777967]">{active.status.replaceAll("_"," ")}</span></div><div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">{active.messages.map(item=><div key={item.id} className={`rounded-xl p-3 text-sm ${item.isStaff?"bg-white":"bg-[#535F4C]/10"}`}><p className="mb-1 text-[10px] uppercase tracking-wider text-[#777967]">{item.isStaff?"NOORÉ Support":"You"} · {new Date(item.createdAt).toLocaleString()}</p><p className="whitespace-pre-wrap leading-6">{item.message}</p></div>)}</div>{!["CLOSED","RESOLVED"].includes(active.status)&&<form onSubmit={sendReply} className="mt-4 space-y-2"><textarea required minLength={2} maxLength={5000} rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply…" className="w-full rounded-lg border border-[#D8D8CB] bg-white px-3 py-3 text-sm"/><button disabled={saving} className="rounded-lg bg-[#535F4C] px-4 py-2.5 text-xs font-semibold text-white">Send reply</button></form>}</div>}
        </div>}
      </section>
    </div></div></main>
}
