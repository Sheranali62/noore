"use client"

import { useEffect, useState } from "react"

type Log = { id: string; actorId: string | null; action: string; entityType: string; entityId: string | null; details: unknown; ipAddress: string | null; createdAt: string }
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    fetch("/api/admin/audit-logs?take=150", { cache: "no-store" })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load audit logs."); setLogs(d.logs || []) })
      .catch(e => setError(e instanceof Error ? e.message : "Unable to load audit logs."))
      .finally(() => setLoading(false))
  }, [])
  return <div className="mx-auto max-w-6xl pb-12 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6ae72]">Security & accountability</p><h1 className="mt-3 font-editorial text-4xl">Audit log</h1><p className="mt-2 text-sm text-white/50">Recent recorded changes to orders and customer return requests.</p>{error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}{loading ? <p className="mt-8 text-sm text-white/50">Loading activity…</p> : logs.length === 0 ? <p className="mt-8 rounded-xl border border-white/10 p-8 text-sm text-white/50">No recorded admin activity yet.</p> : <div className="mt-7 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[.06] text-[10px] uppercase tracking-wider text-[#d6ae72]"><tr><th className="p-4">Date</th><th className="p-4">Action</th><th className="p-4">Entity</th><th className="p-4">Actor</th><th className="p-4">Details</th></tr></thead><tbody>{logs.map(log => <tr key={log.id} className="border-t border-white/10 align-top"><td className="whitespace-nowrap p-4 text-xs text-white/50">{new Date(log.createdAt).toLocaleString()}</td><td className="p-4 font-medium">{log.action}</td><td className="p-4">{log.entityType}<p className="mt-1 max-w-[180px] truncate text-[10px] text-white/40">{log.entityId || "—"}</p></td><td className="p-4 text-xs text-white/55">{log.actorId || "System"}</td><td className="max-w-sm p-4"><pre className="whitespace-pre-wrap break-words text-[11px] text-white/55">{JSON.stringify(log.details, null, 2)}</pre></td></tr>)}</tbody></table></div>}</div>
}
