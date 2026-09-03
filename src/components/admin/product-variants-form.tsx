"use client"

import { useMemo, useState } from "react"

type Variant = { id?: string; color: string; size: string; sku: string; price: string; stock: string; images: string[] }

export default function ProductVariantsForm({ value, onChange }: { value: Variant[]; onChange: (value: Variant[]) => void }) {
  const [imageDrafts, setImageDrafts] = useState<Record<number, string>>({})
  const totalStock = useMemo(() => value.reduce((sum, v) => sum + (Number.isFinite(Number(v.stock)) ? Number(v.stock) : 0), 0), [value])

  const update = (index: number, patch: Partial<Variant>) => onChange(value.map((v, i) => i === index ? { ...v, ...patch } : v))
  const add = () => onChange([...value, { color: "", size: "", sku: "", price: "", stock: "", images: [] }])
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index))
  const addImage = (index: number) => {
    const url = (imageDrafts[index] || "").trim()
    if (!url) return
    update(index, { images: [...value[index].images, url] })
    setImageDrafts({ ...imageDrafts, [index]: "" })
  }

  return (
    <section className="mt-8 border-t border-cream pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Variants</h2>
          <p className="text-sm text-secondary mt-1">Add a separate SKU and stock quantity for every Color + Size combination.</p>
        </div>
        <div className="text-sm font-medium">Variant stock total: <span className="font-semibold">{totalStock}</span></div>
      </div>

      {value.length === 0 && <div className="rounded-lg border border-dashed border-cream p-6 text-sm text-secondary">No variants yet. Add variants for products that have different sizes or colors.</div>}

      <div className="space-y-4">
        {value.map((variant, index) => (
          <div key={variant.id || index} className="rounded-lg border border-cream p-4 bg-cream/20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div><label className="block text-xs font-medium mb-1">Color *</label><input required value={variant.color} onChange={e => update(index, { color: e.target.value })} className="w-full px-3 py-2 border border-cream rounded bg-white" placeholder="Black" /></div>
              <div><label className="block text-xs font-medium mb-1">Size *</label><input required value={variant.size} onChange={e => update(index, { size: e.target.value })} className="w-full px-3 py-2 border border-cream rounded bg-white" placeholder="Medium" /></div>
              <div><label className="block text-xs font-medium mb-1">Variant SKU *</label><input required value={variant.sku} onChange={e => update(index, { sku: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-cream rounded bg-white" placeholder="PROD-BLK-M" /></div>
              <div><label className="block text-xs font-medium mb-1">Price Override</label><input type="number" min="0" step="0.01" value={variant.price} onChange={e => update(index, { price: e.target.value })} className="w-full px-3 py-2 border border-cream rounded bg-white" placeholder="Optional" /></div>
              <div><label className="block text-xs font-medium mb-1">Stock *</label><input required type="number" min="0" value={variant.stock} onChange={e => update(index, { stock: e.target.value })} className="w-full px-3 py-2 border border-cream rounded bg-white" placeholder="10" /></div>
            </div>
            <div className="mt-3 flex gap-2">
              <input type="url" value={imageDrafts[index] || ""} onChange={e => setImageDrafts({ ...imageDrafts, [index]: e.target.value })} className="flex-1 px-3 py-2 border border-cream rounded bg-white text-sm" placeholder="Variant image URL (optional)" />
              <button type="button" onClick={() => addImage(index)} className="px-3 py-2 border border-cream rounded bg-white text-sm">Add Image</button>
              <button type="button" onClick={() => remove(index)} className="px-3 py-2 rounded bg-red-100 text-red-700 text-sm">Remove</button>
            </div>
            {variant.images.length > 0 && <div className="mt-2 text-xs text-secondary break-all">Images: {variant.images.join(" • ")}</div>}
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-4 px-4 py-2 rounded border border-charcoal text-sm hover:bg-cream">+ Add Variant</button>
    </section>
  )
}
