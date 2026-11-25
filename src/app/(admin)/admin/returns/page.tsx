"use client"

import { useEffect, useState } from "react"

type ReturnRow = { id: string; reason: string; details: string | null; status: string; adminNote: string | null; createdAt: string; order: { orderNumber: string; total: number; paymentMethod: string; paymentStatus: string }; user: { name: string | null; email: string } }
const statuses = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "RECEIVED", "REFUNDED", "EXCHANGED"]

export default function AdminReturnsPage() {
  const [rows, setRows] = useState<ReturnRow[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState("")
  async function load() {
    setLoading(true)
    try { const r = await fetch("/api/admin/returns", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load returns."); setRows(d.requests || []) }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load returns.") }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function update(id: string, status: string) {
    setSaving(id); setError("")
    try { const r = await fetch("/api/admin/returns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, adminNote: notes[id] || "" }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to update request."); await load() }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update request.") }
    finally { setSaving(null) }
  }
  return <div className="mx-auto max-w-6xl pb-12 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6ae72]">Customer care</p><h1 className="mt-3 font-editorial text-4xl">Returns & exchanges</h1><p className="mt-2 text-sm text-white/50">Review customer requests and record the next action.</p>{error && <p role="alert" className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}{loading ? <p className="mt-8 text-sm text-white/50">Loading requests…</p> : rows.length === 0 ? <p className="mt-8 rounded-xl border border-white/10 p-8 text-sm text-white/50">No return requests yet.</p> : <div className="mt-7 space-y-4">{rows.map(row => <article key={row.id} className="rounded-2xl border border-[#d6ae72]/20 bg-white/[.035] p-5 md:p-6"><div className="flex flex-wrap justify-between gap-4"><div><p className="font-semibold">Order #{row.order.orderNumber}</p><p className="mt-1 text-xs text-white/45">{row.user.name || "Customer"} · {row.user.email}</p><p className="mt-2 text-sm text-[#e4c28e]">{row.reason}</p>{row.details && <p className="mt-2 max-w-2xl text-sm text-white/65">{row.details}</p>}<p className="mt-2 text-xs text-white/40">Submitted {new Date(row.createdAt).toLocaleString()} · Order PKR {row.order.total.toLocaleString()} · {row.order.paymentMethod} / {row.order.paymentStatus}</p></div><span className="h-fit rounded-full border border-[#d6ae72]/30 px-3 py-1 text-[10px] uppercase tracking-wider text-[#e4c28e]">{row.status.replaceAll("_", " ")}</span></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_2fr_auto]"><select defaultValue={row.status} id={`status-${row.id}`} className="rounded-lg border border-white/15 bg-[#171715] p-3 text-sm text-white">{statuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><input value={notes[row.id] ?? row.adminNote ?? ""} onChange={e => setNotes(prev => ({ ...prev, [row.id]: e.target.value }))} placeholder="Update note for customer" className="rounded-lg border border-white/15 bg-[#171715] p-3 text-sm text-white" /><button disabled={saving === row.id} onClick={() => { const el = document.getElementById(`status-${row.id}`) as HTMLSelectElement | null; if (el) void update(row.id, el.value) }} className="rounded-lg bg-[#d6ae72] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{saving === row.id ? "Saving…" : "Save update"}</button></div></article>)}</div>}</div>
}
