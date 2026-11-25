"use client"

import { useEffect, useState } from "react"

type Ticket = {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  createdAt: string
  user: { name: string | null; email: string }
  order: { orderNumber: string } | null
  messages: Array<{ id: string; message: string; isStaff: boolean; createdAt: string }>
}

const statuses = ["OPEN","IN_PROGRESS","WAITING_CUSTOMER","RESOLVED","CLOSED"]
const priorities = ["LOW","NORMAL","HIGH","URGENT"]

export default function AdminSupportPage() {
  const [tickets,setTickets] = useState<Ticket[]>([])
  const [activeId,setActiveId] = useState("")
  const [status,setStatus] = useState("OPEN")
  const [priority,setPriority] = useState("NORMAL")
  const [reply,setReply] = useState("")
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState("")
  const active = tickets.find(ticket=>ticket.id===activeId)

  async function load() {
    setLoading(true)
    try {
      const response=await fetch("/api/admin/support-tickets",{cache:"no-store"})
      const data=await response.json()
      if(!response.ok)throw new Error(data.error||"Unable to load tickets")
      setTickets(data.tickets||[])
      if(!activeId&&data.tickets?.[0])setActiveId(data.tickets[0].id)
    } catch(err) {setError(err instanceof Error?err.message:"Unable to load tickets")}
    finally {setLoading(false)}
  }
  useEffect(()=>{load()},[])
  useEffect(()=>{if(active){setStatus(active.status);setPriority(active.priority)}},[activeId])

  async function updateTicket() {
    if(!active)return
    setSaving(true);setError("")
    try {
      const response=await fetch(`/api/admin/support-tickets/${active.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,priority})})
      const data=await response.json()
      if(!response.ok)throw new Error(data.error||"Unable to update ticket")
      await load()
    } catch(err){setError(err instanceof Error?err.message:"Unable to update ticket")}
    finally{setSaving(false)}
  }
  async function sendReply(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!active)return
    setSaving(true);setError("")
    try {
      const response=await fetch(`/api/admin/support-tickets/${active.id}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:reply})})
      const data=await response.json()
      if(!response.ok)throw new Error(data.error||"Unable to send reply")
      setReply("");await load()
    } catch(err){setError(err instanceof Error?err.message:"Unable to send reply")}
    finally{setSaving(false)}
  }

  return <main className="mx-auto max-w-7xl space-y-6 pb-12 text-white"><header><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6ae72]">Customer care / Service desk</p><h1 className="mt-3 font-editorial text-4xl sm:text-5xl">Support Centre</h1><p className="mt-2 text-sm text-white/50">Manage customer conversations, ticket priorities and resolutions.</p></header>
    {error&&<p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
    {loading?<p className="text-sm text-white/50">Loading support tickets…</p>:tickets.length===0?<div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">No support tickets yet.</div>:<div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
      <section className="space-y-2">{tickets.map(ticket=><button key={ticket.id} onClick={()=>setActiveId(ticket.id)} className={`w-full rounded-xl border p-4 text-left ${activeId===ticket.id?"border-[#d6ae72] bg-[#d6ae72]/10":"border-white/10 bg-[#171615]"}`}><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{ticket.subject}</p><span className="text-[10px] text-[#e4c28e]">{ticket.priority}</span></div><p className="mt-2 text-xs text-white/45">{ticket.user.name||ticket.user.email} · {ticket.status.replaceAll("_"," ")}</p></button>)}</section>
      {active&&<section className="rounded-2xl border border-white/10 bg-[#171615] p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-[#d6ae72]">{active.category}{active.order? ` · Order #${active.order.orderNumber}`:""}</p><h2 className="mt-2 text-xl font-semibold">{active.subject}</h2><p className="mt-1 text-xs text-white/45">{active.user.name||"Customer"} · {active.user.email}</p></div><p className="text-xs text-white/45">{new Date(active.createdAt).toLocaleString()}</p></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs text-white/50">Status<select value={status} onChange={e=>setStatus(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#24211e] px-3 py-2.5 text-sm text-white">{statuses.map(x=><option key={x}>{x}</option>)}</select></label><label className="text-xs text-white/50">Priority<select value={priority} onChange={e=>setPriority(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#24211e] px-3 py-2.5 text-sm text-white">{priorities.map(x=><option key={x}>{x}</option>)}</select></label><button disabled={saving} onClick={updateTicket} className="self-end rounded-lg bg-[#d6ae72] px-4 py-2.5 text-xs font-bold uppercase text-[#17110a] disabled:opacity-50">Save status</button></div>
        <div className="mt-6 max-h-[420px] space-y-3 overflow-y-auto border-t border-white/10 pt-5">{active.messages.map(item=><div key={item.id} className={`rounded-xl p-4 ${item.isStaff?"bg-[#d6ae72]/10":"bg-white/[.04]"}`}><p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">{item.isStaff?"Staff reply":"Customer"} · {new Date(item.createdAt).toLocaleString()}</p><p className="whitespace-pre-wrap text-sm leading-6 text-white/80">{item.message}</p></div>)}</div>
        <form onSubmit={sendReply} className="mt-5 space-y-3"><label className="block text-xs text-white/50">Reply to customer<textarea required minLength={2} maxLength={5000} rows={4} value={reply} onChange={e=>setReply(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm text-white" placeholder="Write your response…"/></label><button disabled={saving} className="rounded-lg bg-[#d6ae72] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#17110a] disabled:opacity-50">{saving?"Sending…":"Send reply"}</button></form>
      </section>}
    </div>}
  </main>
}
