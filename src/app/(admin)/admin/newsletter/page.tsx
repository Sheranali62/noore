"use client"

import { useEffect, useState } from "react"

type Subscriber = { id: string; email: string; active: boolean; createdAt: string }
export default function NewsletterAdminPage() {
  const [rows, setRows] = useState<Subscriber[]>([])
  const [active, setActive] = useState("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (active !== "all") params.set("active", active)
    if (q.trim()) params.set("q", q.trim())
    setLoading(true)
    fetch(`/api/admin/newsletter?${params.toString()}`, { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load subscribers."); if (!cancelled) setRows(d.subscribers || []) }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load subscribers.") }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [active, q])
  return <div className="mx-auto max-w-6xl pb-12 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6ae72]">Marketing</p><h1 className="mt-3 font-editorial text-4xl">Newsletter subscribers</h1><p className="mt-2 text-sm text-white/50">Manage the customer email list and export subscriber records.</p><div className="mt-6 flex flex-wrap gap-3"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search email address" className="min-w-[240px] flex-1 rounded-lg border border-white/15 bg-[#171715] p-3 text-sm text-white" /><select value={active} onChange={e => setActive(e.target.value)} className="rounded-lg border border-white/15 bg-[#171715] p-3 text-sm text-white"><option value="all">All subscribers</option><option value="true">Active</option><option value="false">Unsubscribed</option></select><a href={`/api/admin/newsletter?format=csv${active !== "all" ? `&active=${active}` : ""}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`} className="rounded-lg bg-[#d6ae72] px-5 py-3 text-sm font-semibold text-black">Export CSV</a></div>{error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}{loading ? <p className="mt-8 text-sm text-white/50">Loading subscribers…</p> : <div className="mt-6 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-white/[.06] text-[10px] uppercase tracking-wider text-[#d6ae72]"><tr><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4">Subscribed</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-white/10"><td className="p-4">{row.email}</td><td className="p-4"><span className={row.active ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300" : "rounded-full bg-white/10 px-3 py-1 text-xs text-white/50"}>{row.active ? "Active" : "Unsubscribed"}</span></td><td className="p-4 text-xs text-white/50">{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-8 text-sm text-white/45">No subscribers match this filter.</p>}</div>}</div>
}
