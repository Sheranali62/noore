"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowDownToLine, CalendarDays, CheckCircle2, Clock3, Copy, Gift, Plus, Search, ToggleLeft, Users } from "lucide-react"
import { CouponActions } from "@/components/admin/coupon-actions"

type Coupon = {
  id: string
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  minOrder: number
  maxDiscount: number | null
  usedCount: number
  usageLimit: number | null
  expiryDate: string | Date
  startDate: string | Date
  active: boolean
  perCustomer: number | null
  applicableCategories: string[]
}

type Filter = "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED"

export default function CouponsWorkspace({ coupons }: { coupons: Coupon[] }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("ALL")
  const [copied, setCopied] = useState("")

  const now = Date.now()
  const activeCount = coupons.filter((coupon) => coupon.active && new Date(coupon.expiryDate).getTime() >= now).length
  const expiredCount = coupons.filter((coupon) => new Date(coupon.expiryDate).getTime() < now).length
  const usedCount = coupons.reduce((total, coupon) => total + coupon.usedCount, 0)
  const filtered = useMemo(() => coupons.filter((coupon) => {
    const expired = new Date(coupon.expiryDate).getTime() < Date.now()
    const matchesFilter = filter === "ALL" || (filter === "ACTIVE" && coupon.active && !expired) || (filter === "INACTIVE" && !coupon.active && !expired) || (filter === "EXPIRED" && expired)
    return matchesFilter && coupon.code.toLowerCase().includes(search.trim().toLowerCase())
  }), [coupons, filter, search])

  const exportCsv = () => {
    const rows = [
      ["Code", "Type", "Value", "Minimum order", "Maximum discount", "Used", "Usage limit", "Start date", "Expiry date", "Active"],
      ...filtered.map((coupon) => [coupon.code, coupon.type, String(coupon.value), String(coupon.minOrder), coupon.maxDiscount == null ? "" : String(coupon.maxDiscount), String(coupon.usedCount), coupon.usageLimit == null ? "Unlimited" : String(coupon.usageLimit), new Date(coupon.startDate).toISOString().slice(0, 10), new Date(coupon.expiryDate).toISOString().slice(0, 10), coupon.active ? "Yes" : "No"]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "noore-coupons.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      window.setTimeout(() => setCopied((current) => current === code ? "" : current), 1600)
    } catch {
      setCopied("")
    }
  }

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6ae72]">NOORÉ / Growth</p>
          <h1 className="mt-3 font-editorial text-4xl text-white sm:text-5xl">Coupons & offers</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">Manage promotional codes, discount rules and campaign usage in one place.</p>
        </div>
        <Link href="/admin/coupons/add" className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#17110a] shadow-[0_6px_24px_rgba(214,174,114,.12)] transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Create coupon
        </Link>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric icon={Gift} label="Total coupons" value={coupons.length.toLocaleString()} />
        <Metric icon={CheckCircle2} label="Active campaigns" value={activeCount.toLocaleString()} />
        <Metric icon={Clock3} label="Expired coupons" value={expiredCount.toLocaleString()} />
        <Metric icon={Users} label="Recorded uses" value={usedCount.toLocaleString()} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_12px_40px_rgba(0,0,0,.12)]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Promotion ledger</h2>
            <p className="mt-1 text-xs text-white/40">{filtered.length} of {coupons.length} coupon codes</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coupon code" className="w-full rounded-xl border border-white/10 bg-[#090909] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d6ae72]/50" />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-xl border border-white/10 bg-[#090909] px-3 py-2.5 text-sm text-white/80 outline-none focus:border-[#d6ae72]/50">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 transition hover:border-[#d6ae72]/40 hover:text-[#e4c28e]">
              <ArrowDownToLine className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {coupons.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#d6ae72]/20 bg-[#d6ae72]/[0.08] text-[#e4c28e]"><Gift className="h-5 w-5" /></div>
            <h3 className="mt-4 font-semibold text-white">No coupons created yet</h3>
            <p className="mt-1 text-sm text-white/40">Create your first promotional code to start a campaign.</p>
            <Link href="/admin/coupons/add" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#e4c28e] hover:text-white"><Plus className="h-4 w-4" /> Create your first coupon</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-white/45">No coupons match your search and status filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-black/25 text-left">
                <tr>{["Coupon code", "Discount", "Minimum order", "Usage", "Expiry", "Status", "Actions"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.17em] text-white/40">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((coupon) => {
                  const expired = new Date(coupon.expiryDate).getTime() < Date.now()
                  const notStarted = new Date(coupon.startDate).getTime() > Date.now()
                  const status = expired ? "Expired" : !coupon.active ? "Inactive" : notStarted ? "Scheduled" : "Active"
                  const tone = status === "Active" ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : status === "Scheduled" ? "border-sky-400/20 bg-sky-400/[0.08] text-sky-300" : "border-white/10 bg-white/[0.04] text-white/45"
                  return (
                    <tr key={coupon.id} className="border-t border-white/[0.07] transition hover:bg-white/[0.025]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold tracking-[0.08em] text-white">{coupon.code}</span>
                          <button type="button" onClick={() => copyCode(coupon.code)} aria-label={`Copy ${coupon.code}`} className="rounded-md p-1 text-white/30 transition hover:bg-white/10 hover:text-[#e4c28e]"><Copy className="h-3.5 w-3.5" /></button>
                          {copied === coupon.code && <span className="text-[10px] text-[#e4c28e]">Copied</span>}
                        </div>
                        <p className="mt-1 text-[10px] text-white/35">{coupon.type === "PERCENTAGE" ? "Percentage discount" : "Fixed discount"}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#e4c28e]">{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : money(coupon.value)}</td>
                      <td className="px-5 py-4 text-white/65">{money(coupon.minOrder)}</td>
                      <td className="px-5 py-4"><span className="text-white">{coupon.usedCount}</span><span className="text-white/35"> / {coupon.usageLimit ?? "∞"}</span><div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d6ae72]" style={{ width: `${coupon.usageLimit ? Math.min(100, coupon.usedCount / coupon.usageLimit * 100) : 0}%` }} /></div></td>
                      <td className="whitespace-nowrap px-5 py-4 text-white/55"><span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-white/30" />{new Date(coupon.expiryDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}</span></td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${tone}`}>{status}</span></td>
                      <td className="px-5 py-4"><CouponActions id={coupon.id} active={coupon.active} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-4 text-[11px] leading-5 text-white/30">Coupon discount calculations, eligibility limits, activation and usage history continue to use your existing checkout and coupon APIs.</p>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center gap-2 text-[#d6ae72]"><Icon className="h-4 w-4" /><span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/40">{label}</span></div><p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p></div>
}

function money(value: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value)
}
