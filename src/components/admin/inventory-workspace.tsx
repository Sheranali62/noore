"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

type ProductRow = {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  lowStock: number
  status: string
}

export default function InventoryWorkspace({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<ProductRow | null>(null)
  const [change, setChange] = useState("1")
  const [reason, setReason] = useState("Restock")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const stats = useMemo(() => ({
    total: products.length,
    units: products.reduce((sum, p) => sum + p.stock, 0),
    low: products.filter(p => p.stock > 0 && p.stock <= p.lowStock).length,
    out: products.filter(p => p.stock === 0).length,
  }), [products])

  const filtered = useMemo(() => products.filter(p => {
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || [p.name, p.sku, p.category].some(v => v.toLowerCase().includes(q))
    const matchesFilter = filter === "all" || (filter === "out" ? p.stock === 0 : filter === "low" ? p.stock > 0 && p.stock <= p.lowStock : p.stock > p.lowStock)
    return matchesQuery && matchesFilter
  }), [products, query, filter])

  async function saveAdjustment() {
    if (!selected) return
    const amount = Number(change)
    if (!Number.isInteger(amount) || amount === 0) {
      setError("Enter a non-zero whole number. Use a minus sign to remove stock.")
      return
    }
    setSaving(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selected.id, change: amount, reason, note }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not update stock")
      setProducts(current => current.map(p => p.id === selected.id ? { ...p, stock: result.afterStock } : p))
      setSuccess("Stock updated and recorded in inventory history.")
      setSelected(null); setChange("1"); setNote("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update stock")
    } finally {
      setSaving(false)
    }
  }

  return <div className="max-w-7xl pb-12">
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ / Stock control</p><h1 className="mt-2 font-editorial text-4xl md:text-5xl">Inventory</h1><p className="mt-2 max-w-2xl text-sm text-secondary">Monitor stock health, make controlled adjustments and review every movement.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/inventory/history" className="rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm transition hover:bg-charcoal/[0.03]">Movement history</Link><a href="/api/admin/reports?type=inventory" className="rounded-xl bg-[#c49a5a] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#17110a] shadow-sm transition hover:bg-[#d4b477]">Export CSV</a></div>
    </header>
    {success && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
    <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[["Active products", stats.total, "Catalog items currently active"], ["Units in stock", stats.units, "Across active products"], ["Low stock", stats.low, "At or below reorder level"], ["Out of stock", stats.out, "Products needing replenishment"]].map(([label, value, detail], i) => <div key={String(label)} className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p><p className={`mt-2 text-3xl font-semibold tabular-nums ${i===2?"text-amber-600":i===3?"text-red-600":""}`}>{value}</p><p className="mt-1 text-xs text-secondary">{detail}</p></div>)}
    </div>
    <section className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_12px_40px_rgba(23,23,23,0.05)]">
      <div className="flex flex-col gap-3 border-b border-charcoal/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Stock ledger</p><p className="mt-1 text-xs text-secondary">Showing {filtered.length} of {products.length} products</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input aria-label="Search inventory" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search product, SKU or category" className="min-w-0 rounded-xl border border-charcoal/15 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#c49a5a] sm:w-64" />
          <select aria-label="Filter stock status" value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-charcoal/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c49a5a]"><option value="all">All stock</option><option value="healthy">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        </div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-charcoal/[0.035]"><tr>{["Product","SKU / Category","Available","Stock health","Reorder at","Action"].map(h=><th key={h} className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">{h}</th>)}</tr></thead><tbody>
        {filtered.length===0 ? <tr><td colSpan={6} className="p-14 text-center"><p className="font-semibold">No matching products</p><p className="mt-1 text-sm text-secondary">Try a different search or stock filter.</p></td></tr> : filtered.map(product=>{const out=product.stock===0;const low=!out&&product.stock<=product.lowStock;return <tr key={product.id} className="border-t border-charcoal/10 transition hover:bg-charcoal/[0.02]">
          <td className="px-5 py-4"><p className="font-medium">{product.name}</p><p className="mt-1 text-xs text-secondary">Product inventory</p></td>
          <td className="px-5 py-4"><p className="font-mono text-xs">{product.sku}</p><p className="mt-1 text-xs text-secondary">{product.category}</p></td>
          <td className={`px-5 py-4 text-lg font-semibold tabular-nums ${out?"text-red-600":low?"text-amber-600":""}`}>{product.stock}</td>
          <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${out?"border-red-200 bg-red-50 text-red-700":low?"border-amber-200 bg-amber-50 text-amber-700":"border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{out?"Out of stock":low?"Low stock":"Healthy"}</span></td>
          <td className="px-5 py-4 text-secondary">{product.lowStock} units</td>
          <td className="px-5 py-4"><div className="flex items-center gap-3"><button type="button" onClick={()=>{setSelected(product);setChange("1");setReason("Restock");setNote("");setError("")}} className="rounded-lg bg-[#c49a5a] px-3 py-2 text-xs font-semibold text-[#17110a] transition hover:bg-[#d4b477]">Adjust stock</button><Link href={`/admin/products/edit/${product.id}`} className="text-xs font-medium underline underline-offset-4">Edit product</Link></div></td>
        </tr>})}
      </tbody></table></div>
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setSelected(null)}}>
      <section role="dialog" aria-modal="true" aria-labelledby="inventory-adjust-title" className="w-full max-w-md rounded-3xl border border-[#c49a5a]/30 bg-[#171717] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c49a5a]">Stock control</p><h2 id="inventory-adjust-title" className="mt-2 text-2xl font-semibold">Adjust inventory</h2><p className="mt-1 text-sm text-white/60">{selected.name} · {selected.sku}</p></div><button type="button" onClick={()=>setSelected(null)} disabled={saving} aria-label="Close" className="rounded-lg px-2 py-1 text-xl text-white/60 hover:bg-white/10">×</button></div>
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-wider text-white/50">Current stock</p><p className="mt-1 text-3xl font-semibold tabular-nums">{selected.stock} <span className="text-sm font-normal text-white/50">units</span></p></div>
        <label className="mt-5 block text-xs font-medium text-white/70">Stock change <span className="text-white/40">(use negative number to remove)</span><input type="number" step="1" value={change} onChange={e=>setChange(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white outline-none focus:border-[#c49a5a]" /></label>
        <label className="mt-4 block text-xs font-medium text-white/70">Reason<select value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#242424] px-4 py-3 text-sm text-white outline-none focus:border-[#c49a5a]"><option>Restock</option><option>Damaged goods</option><option>Stock correction</option><option>Return received</option><option>Other</option></select></label>
        <label className="mt-4 block text-xs font-medium text-white/70">Note (optional)<textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} maxLength={500} placeholder="Add a short note for the audit trail" className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c49a5a]" /></label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        <div className="mt-6 flex gap-3"><button type="button" onClick={()=>setSelected(null)} disabled={saving} className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/75">Cancel</button><button type="button" onClick={saveAdjustment} disabled={saving} className="flex-1 rounded-xl bg-[#c49a5a] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#17110a] disabled:opacity-50">{saving?"Saving…":"Save adjustment"}</button></div>
      </section>
    </div>}
  </div>
}
