"use client"

import { useEffect, useState } from "react"

type Transaction = { id: string; provider: string; providerReference: string | null; amount: number; currency: string; status: string; createdAt: string; order: { orderNumber: string; total: number; paymentMethod: string; paymentStatus: string; user: { email: string; name: string | null } } }
export default function PaymentsPage() {
  const [rows, setRows] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    fetch("/api/admin/payments", { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load payment records."); setRows(d.transactions || []) }).catch(e => setError(e instanceof Error ? e.message : "Unable to load payments.")).finally(() => setLoading(false))
  }, [])
  return <div className="mx-auto max-w-6xl pb-12 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6ae72]">Finance</p><h1 className="mt-3 font-editorial text-4xl">Payment transactions</h1><p className="mt-2 text-sm text-white/50">Gateway callbacks and payment reconciliation records.</p>{error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}{loading ? <p className="mt-8 text-sm text-white/50">Loading transactions…</p> : rows.length === 0 ? <p className="mt-8 rounded-xl border border-white/10 p-8 text-sm text-white/50">No online payment transactions have been received. Cash on Delivery orders continue to be managed from Orders.</p> : <div className="mt-7 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-white/[.06] text-[10px] uppercase tracking-wider text-[#d6ae72]"><tr><th className="p-4">Date</th><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Provider</th><th className="p-4">Reference</th><th className="p-4">Amount</th><th className="p-4">Status</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-white/10"><td className="whitespace-nowrap p-4 text-xs text-white/50">{new Date(row.createdAt).toLocaleString()}</td><td className="p-4 font-medium">#{row.order.orderNumber}</td><td className="p-4 text-xs text-white/60">{row.order.user.name || "Customer"}<p>{row.order.user.email}</p></td><td className="p-4">{row.provider}</td><td className="p-4 text-xs text-white/50">{row.providerReference || "—"}</td><td className="p-4">{row.currency} {row.amount.toLocaleString()}</td><td className="p-4"><span className="rounded-full border border-[#d6ae72]/30 px-3 py-1 text-[10px] text-[#e4c28e]">{row.status}</span></td></tr>)}</tbody></table></div>}</div>
}
