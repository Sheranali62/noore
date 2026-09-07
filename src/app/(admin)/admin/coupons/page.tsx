import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CouponActions } from "@/components/admin/coupon-actions"

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })
  const active = coupons.filter(c => c.active).length
  const expired = coupons.filter(c => new Date(c.expiryDate).getTime() < Date.now()).length
  const used = coupons.reduce((sum, c) => sum + c.usedCount, 0)
  return <div className="max-w-7xl pb-12">
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ / Growth</p><h1 className="mt-2 font-editorial text-4xl md:text-5xl">Coupons</h1><p className="mt-2 max-w-2xl text-sm text-secondary">Create and monitor promotional codes without changing your existing discount rules.</p></div>
      <Link href="/admin/coupons/add" className="inline-flex w-fit items-center rounded-xl bg-charcoal px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg transition hover:-translate-y-0.5">+ Add Coupon</Link>
    </header>
    <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total campaigns", coupons.length],["Active",active],["Expired",expired],["Uses recorded",used]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
    <section className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_12px_40px_rgba(23,23,23,0.05)]">
      <div className="border-b border-charcoal/10 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Promotion ledger</p><p className="mt-1 text-sm text-secondary">Your current coupon rules and usage at a glance.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-charcoal/[0.035]"><tr>{["Code","Type","Value","Min order","Uses","Expires","Status","Actions"].map(h=><th key={h} className="whitespace-nowrap px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">{h}</th>)}</tr></thead><tbody>
      {coupons.length===0 ? <tr><td colSpan={8} className="p-14 text-center"><p className="font-semibold">No coupons yet</p><p className="mt-1 text-sm text-secondary">Your promotion workspace is ready when you are.</p></td></tr> : coupons.map(coupon => { const isExpired=new Date(coupon.expiryDate).getTime()<Date.now(); return <tr key={coupon.id} className="border-t border-charcoal/10 transition hover:bg-charcoal/[0.02]"><td className="px-5 py-4 font-semibold tracking-wide">{coupon.code}</td><td className="px-5 py-4 text-secondary">{coupon.type}</td><td className="px-5 py-4 font-medium">{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `PKR ${coupon.value}`}</td><td className="px-5 py-4">PKR {coupon.minOrder.toLocaleString()}</td><td className="px-5 py-4">{coupon.usedCount} / {coupon.usageLimit || "∞"}</td><td className="px-5 py-4 text-secondary">{new Date(coupon.expiryDate).toLocaleDateString()}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${coupon.active && !isExpired ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-charcoal/10 bg-charcoal/[0.04] text-secondary"}`}>{coupon.active && !isExpired ? "Active" : isExpired ? "Expired" : "Inactive"}</span></td><td className="px-5 py-4"><CouponActions id={coupon.id} active={coupon.active} /></td></tr>})}</tbody></table></div>
    </section>
  </div>
}
