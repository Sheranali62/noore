"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EditCouponForm({ coupon }: { coupon: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    minOrder: String(coupon.minOrder),
    maxDiscount: coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
    startDate: new Date(coupon.startDate).toISOString().slice(0, 10),
    expiryDate: new Date(coupon.expiryDate).toISOString().slice(0, 10),
    usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
    perCustomer: coupon.perCustomer == null ? "" : String(coupon.perCustomer),
    applicableCategories: coupon.applicableCategories.join(", "),
    applicableProductIds: coupon.applicableProductIds.join(", "),
    active: coupon.active,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null, perCustomer: form.perCustomer ? Number(form.perCustomer) : null, applicableCategories: form.applicableCategories.split(",").map(v => v.trim()).filter(Boolean), applicableProductIds: form.applicableProductIds.split(",").map(v => v.trim()).filter(Boolean) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update coupon")
      router.push("/admin/coupons"); router.refresh()
    } catch (error) { alert(error instanceof Error ? error.message : "Failed to update coupon") } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-semibold">Edit Coupon</h1><button onClick={() => router.back()} className="border border-cream px-4 py-2 rounded">Cancel</button></div>
      <form onSubmit={submit} className="bg-white rounded-lg border border-cream p-6 max-w-3xl space-y-5">
        <div><label className="block text-sm font-medium mb-1">Coupon Code</label><input required value={form.code} onChange={e => setForm({...form, code:e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-cream rounded" /></div>
        <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full px-3 py-2 border border-cream rounded"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div><div><label className="block text-sm font-medium mb-1">Value</label><input type="number" min="0.01" step="0.01" required value={form.value} onChange={e=>setForm({...form,value:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Minimum Order</label><input type="number" min="0" step="0.01" value={form.minOrder} onChange={e=>setForm({...form,minOrder:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div><div><label className="block text-sm font-medium mb-1">Maximum Discount</label><input type="number" min="0" step="0.01" value={form.maxDiscount} onChange={e=>setForm({...form,maxDiscount:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div><div><label className="block text-sm font-medium mb-1">Expiry Date</label><input type="date" required value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Usage Limit</label><input type="number" min="1" value={form.usageLimit} onChange={e=>setForm({...form,usageLimit:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div><div><label className="block text-sm font-medium mb-1">Per Customer</label><input type="number" min="1" value={form.perCustomer} onChange={e=>setForm({...form,perCustomer:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Applicable Categories</label><input value={form.applicableCategories} onChange={e=>setForm({...form,applicableCategories:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div><div><label className="block text-sm font-medium mb-1">Applicable Product IDs</label><input value={form.applicableProductIds} onChange={e=>setForm({...form,applicableProductIds:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" /></div></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>Active</span></label>
        <button disabled={loading} className="bg-charcoal text-white px-6 py-2 rounded disabled:opacity-50">{loading ? "Saving..." : "Save Changes"}</button>
      </form>
    </div>
  )
}
