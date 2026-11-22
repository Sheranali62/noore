"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Search, Users, Crown, Wallet, ShoppingCart, Eye, ChevronLeft, ChevronRight, Mail, Phone, MapPin, CalendarDays, X, RefreshCw } from "lucide-react"

type Customer = {
  id: string; name: string; email: string; phone: string; city: string; province: string
  orderCount: number; totalSpent: number; joinedAt: string; active: boolean; vip: boolean; latestOrderAt: string | null
}
type Payload = {
  customers: Customer[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  stats: { totalCustomers: number; activeCustomers: number; vipCustomers: number; totalSpending: number }
  cities: string[]
}

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`
const date = (value: string) => new Date(value).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })

export function CustomersWorkspace() {
  const [data, setData] = useState<Payload | null>(null)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [city, setCity] = useState("all")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams({ search, status, city, page: String(page), pageSize: "8" })
      const response = await fetch(`/api/admin/customers?${params}`, { cache: "no-store", headers: { Accept: "application/json" } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Unable to load customers")
      setData(result)
      setSelected((current) => current ? result.customers.find((item: Customer) => item.id === current.id) || result.customers[0] || null : result.customers[0] || null)
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load customers") }
    finally { setLoading(false) }
  }, [search, status, city, page])

  useEffect(() => { void load() }, [load])

  const stats = data?.stats
  const selectedInitials = useMemo(() => (selected?.name || "C").split(/\\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase(), [selected])

  return (
    <div className="mx-auto max-w-[1500px] pb-12 text-white">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6ae72]">NOORÉ / Relationships</p><h1 className="mt-2 font-editorial text-4xl tracking-tight md:text-5xl">Customer Management</h1><p className="mt-2 text-sm text-white/55">Understand your customers, their orders and lifetime value.</p></div>
        <a href="/api/admin/reports?type=customers" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6ae72]/50 bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-5 py-3 text-sm font-semibold text-[#17110a] shadow-[0_8px_24px_rgba(214,174,114,.12)]"><Download className="h-4 w-4"/> Export CSV</a>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Customers", value: stats?.totalCustomers ?? "—", icon: Users, note: "Registered accounts" },
          { label: "Active Customers", value: stats?.activeCustomers ?? "—", icon: ShoppingCart, note: "Ordered in the last 90 days" },
          { label: "VIP Customers", value: stats?.vipCustomers ?? "—", icon: Crown, note: "Lifetime spend PKR 100,000+" },
          { label: "Total Spending", value: stats ? money(stats.totalSpending) : "—", icon: Wallet, note: "Net of cancelled/refunded orders" },
        ].map((item) => <div key={item.label} className="relative overflow-hidden rounded-2xl border border-[#d6ae72]/35 bg-gradient-to-br from-[#191713] via-[#10100f] to-[#090909] p-5 shadow-[0_12px_35px_rgba(0,0,0,.18)]"><div className="flex items-center justify-between"><p className="text-xs text-white/60">{item.label}</p><item.icon className="h-6 w-6 text-[#e4c28e]"/></div><p className="mt-3 truncate text-2xl font-semibold tracking-tight text-white">{item.value}</p><p className="mt-1 text-[10px] text-white/35">{item.note}</p><div className="pointer-events-none absolute -bottom-8 -right-6 h-20 w-20 rounded-full bg-[#d6ae72]/10 blur-2xl"/></div>)}
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[#111110] p-3 lg:grid-cols-[minmax(220px,1fr)_160px_180px_auto_auto]">
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-3"><Search className="h-4 w-4 shrink-0 text-[#d6ae72]"/><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email or phone…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"/></label>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="min-h-11 rounded-xl border border-white/15 bg-[#171715] px-3 text-sm text-white outline-none focus:border-[#d6ae72]"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }} className="min-h-11 rounded-xl border border-white/15 bg-[#171715] px-3 text-sm text-white outline-none focus:border-[#d6ae72]"><option value="all">All Cities</option>{(data?.cities || []).map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <button onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-5 text-sm font-semibold text-[#17110a]"><Search className="h-4 w-4"/> Search</button>
        <button onClick={() => { setSearch(""); setStatus("all"); setCity("all"); setPage(1) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d6ae72]/40 px-4 text-sm text-[#e4c28e] hover:bg-white/5"><RefreshCw className="h-4 w-4"/> Reset</button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error} <button onClick={() => void load()} className="ml-2 underline">Try again</button></div>}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#d6ae72]/35 bg-[#0d0d0c]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4"><div><h2 className="text-sm font-semibold">Customers</h2><p className="mt-1 text-[11px] text-white/40">Customer records from your NOORÉ store</p></div><span className="text-xs text-[#e4c28e]">{data?.pagination.total ?? 0} records</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[790px] text-left text-xs">
              <thead className="bg-gradient-to-r from-[#e6c47f] to-[#c2944e] text-[#17110a]"><tr>{["Customer","Email","Phone","City","Orders","Total Spent","Status",""].map((label) => <th key={label} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} className="p-10 text-center text-white/50">Loading customer records…</td></tr> : !data?.customers.length ? <tr><td colSpan={8} className="p-10 text-center text-white/50">No customers match these filters.</td></tr> : data.customers.map((customer) => <tr key={customer.id} onClick={() => setSelected(customer)} className={`cursor-pointer border-t border-white/10 transition hover:bg-white/[0.045] ${selected?.id === customer.id ? "bg-[#d6ae72]/[0.09]" : ""}`}>
                  <td className="whitespace-nowrap px-3 py-3"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full border border-[#d6ae72]/60 bg-[#d6ae72]/15 text-[10px] font-bold text-[#e4c28e]">{customer.name.split(/\\s+/).map((p) => p[0]).slice(0,2).join("").toUpperCase()}</span><span className="font-medium text-white">{customer.name}{customer.vip && <Crown className="ml-1 inline h-3 w-3 text-[#e4c28e]"/>}</span></div></td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-white/65">{customer.email}</td><td className="whitespace-nowrap px-3 py-3 text-white/65">{customer.phone}</td><td className="px-3 py-3 text-white/65">{customer.city}</td><td className="px-3 py-3 tabular-nums">{customer.orderCount}</td><td className="whitespace-nowrap px-3 py-3 tabular-nums">{money(customer.totalSpent)}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${customer.active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"}`}>{customer.active ? "Active" : "Inactive"}</span></td>
                  <td className="px-3 py-3"><button aria-label={`View ${customer.name}`} onClick={(e) => { e.stopPropagation(); setSelected(customer) }} className="rounded-lg border border-[#d6ae72]/40 p-2 text-[#e4c28e] hover:bg-[#d6ae72]/10"><Eye className="h-4 w-4"/></button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-white/45"><span>Showing {data?.customers.length || 0} of {data?.pagination.total || 0} customers</span><div className="flex items-center gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-white/15 p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button><span className="px-2 text-white">{page} / {data?.pagination.totalPages || 1}</span><button disabled={page >= (data?.pagination.totalPages || 1) || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/15 p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button></div></div>
        </section>

        <aside className="overflow-hidden rounded-2xl border border-[#d6ae72]/40 bg-gradient-to-b from-[#171511] to-[#0b0b0a]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4"><div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-[#e4c28e]"/> Customer Details</div>{selected && <button onClick={() => setSelected(null)} aria-label="Close customer details" className="text-white/45 hover:text-white"><X className="h-4 w-4"/></button>}</div>
          {selected ? <div className="p-5"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-[#d6ae72] bg-[#d6ae72]/15 text-2xl font-semibold text-[#e4c28e]">{selectedInitials}</div><h3 className="mt-3 text-center text-lg font-semibold">{selected.name}</h3><div className="mt-2 flex justify-center gap-2">{selected.vip && <span className="inline-flex items-center gap-1 rounded-full bg-[#d6ae72] px-3 py-1 text-[10px] font-bold text-[#17110a]"><Crown className="h-3 w-3"/> VIP Customer</span>}<span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${selected.active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>{selected.active ? "Active" : "Inactive"}</span></div>
            <div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-xs text-white/70"><div className="flex items-center gap-3 break-all"><Mail className="h-4 w-4 shrink-0 text-[#e4c28e]"/>{selected.email}</div><div className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0 text-[#e4c28e]"/>{selected.phone}</div><div className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-[#e4c28e]"/>{[selected.city, selected.province].filter(Boolean).join(", ") || "Address not provided"}</div><div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-[#e4c28e]"/> Joined {date(selected.joinedAt)}</div></div>
            <div className="space-y-3 py-4 text-xs"><div className="flex items-center justify-between"><span className="text-white/50">Total Orders</span><strong>{selected.orderCount}</strong></div><div className="flex items-center justify-between"><span className="text-white/50">Total Spent</span><strong className="text-[#e4c28e]">{money(selected.totalSpent)}</strong></div><div className="flex items-center justify-between"><span className="text-white/50">Last Order</span><strong>{selected.latestOrderAt ? date(selected.latestOrderAt) : "No orders"}</strong></div></div>
            <a href={`mailto:${encodeURIComponent(selected.email)}`} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-4 py-3 text-xs font-bold text-[#17110a]">Email Customer <Mail className="h-4 w-4"/></a>
          </div> : <div className="p-8 text-center text-xs text-white/45">Select a customer to view their details.</div>}
        </aside>
      </div>
    </div>
  )
}
