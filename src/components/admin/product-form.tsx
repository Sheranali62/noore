"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProductVariantsForm from "@/components/admin/product-variants-form"

type Variant = { id?: string; color: string; size: string; sku: string; price: string; stock: string; images: string[] }

export type ProductFormData = {
  name: string; slug: string; sku: string; description: string; category: string; subcategory: string
  collection: string; gender: string; type: string; fabric: string; pieces: string; costPrice: string
  price: string; salePrice: string; stock: string; lowStock: string; status: string; video: string
  tags: string; seoTitle: string; seoDesc: string; images: string[]
}

export const emptyProductForm: ProductFormData = {
  name: "", slug: "", sku: "", description: "", category: "", subcategory: "", collection: "",
  gender: "", type: "", fabric: "", pieces: "", costPrice: "", price: "", salePrice: "", stock: "",
  lowStock: "5", status: "DRAFT", video: "", tags: "", seoTitle: "", seoDesc: "", images: [""],
}

type Props = {
  mode: "create" | "edit"
  productId?: string
  initialData?: ProductFormData
  initialVariants?: Variant[]
}

export default function ProductForm({ mode, productId, initialData = emptyProductForm, initialVariants = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(initialData)
  const [variants, setVariants] = useState<Variant[]>(initialVariants)

  const update = (key: keyof ProductFormData, value: string) => setFormData(current => ({ ...current, [key]: value }))
  const setImage = (index: number, value: string) => setFormData(current => ({ ...current, images: current.images.map((img, i) => i === index ? value : img) }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        pieces: formData.pieces ? Number(formData.pieces) : null,
        stock: Number(formData.stock || 0),
        lowStock: Number(formData.lowStock || 5),
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        images: formData.images.filter(image => image.trim()),
        variants: variants.map(v => ({
          id: v.id, color: v.color, size: v.size, sku: v.sku,
          price: v.price ? Number(v.price) : null, stock: Number(v.stock || 0), images: v.images.filter(Boolean),
        })),
      }

      const response = await fetch(mode === "create" ? "/api/products" : `/api/products/${productId}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || `Failed to ${mode === "create" ? "create" : "update"} product`)
      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="bg-white rounded-xl border border-cream p-6">
        <h2 className="text-lg font-semibold">Core product information</h2>
        <p className="text-sm text-secondary mt-1">The information customers and merchandising teams use most.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <Field label="Product Name *" value={formData.name} onChange={v => update("name", v)} required />
          <Field label="SKU *" value={formData.sku} onChange={v => update("sku", v.toUpperCase())} required />
          <Field label="Slug *" value={formData.slug} onChange={v => update("slug", v.toLowerCase().replace(/\s+/g, "-"))} required />
          <Select label="Category *" value={formData.category} onChange={v => update("category", v)} options={["Women", "Men", "Luxury", "Accessories"]} required />
          <Field label="Subcategory" value={formData.subcategory} onChange={v => update("subcategory", v)} placeholder="Ready to Wear / Unstitched" />
          <Field label="Collection" value={formData.collection} onChange={v => update("collection", v)} placeholder="Festive 2026" />
          <Select label="Gender" value={formData.gender} onChange={v => update("gender", v)} options={["Women", "Men", "Unisex"]} allowEmpty />
          <Field label="Product Type" value={formData.type} onChange={v => update("type", v)} placeholder="3 Piece Suit / Kurta / Bag" />
          <Field label="Fabric" value={formData.fabric} onChange={v => update("fabric", v)} placeholder="Lawn / Cotton / Silk" />
          <Field label="Pieces" type="number" min="1" value={formData.pieces} onChange={v => update("pieces", v)} placeholder="3" />
        </div>
        <label className="block text-sm font-medium mt-5">Description<textarea rows={6} value={formData.description} onChange={e => update("description", e.target.value)} className="mt-1 w-full rounded border border-cream px-3 py-2 resize-y" /></label>
      </section>

      <section className="bg-white rounded-xl border border-cream p-6">
        <h2 className="text-lg font-semibold">Pricing & inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
          <Field label="Regular Price (PKR) *" type="number" min="0" step="0.01" value={formData.price} onChange={v => update("price", v)} required />
          <Field label="Sale Price (PKR)" type="number" min="0" step="0.01" value={formData.salePrice} onChange={v => update("salePrice", v)} />
          <Field label="Cost Price (PKR)" type="number" min="0" step="0.01" value={formData.costPrice} onChange={v => update("costPrice", v)} />
          <Field label="Low-stock alert" type="number" min="0" value={formData.lowStock} onChange={v => update("lowStock", v)} />
          <Field label="Stock Quantity *" type="number" min="0" value={formData.stock} onChange={v => update("stock", v)} disabled={variants.length > 0} />
          <Select label="Status" value={formData.status} onChange={v => update("status", v)} options={["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]} />
        </div>
        {variants.length > 0 && <p className="text-xs text-secondary mt-3">Total stock is calculated automatically from variant stock.</p>}
        <ProductVariantsForm value={variants} onChange={setVariants} />
      </section>

      <section className="bg-white rounded-xl border border-cream p-6">
        <h2 className="text-lg font-semibold">Media & merchandising</h2>
        <div className="mt-5 space-y-3">
          {formData.images.map((image, index) => (
            <div key={index} className="flex gap-2">
              <input type="url" value={image} onChange={e => setImage(index, e.target.value)} className="flex-1 rounded border border-cream px-3 py-2" placeholder="https://... product image URL" />
              {formData.images.length > 1 && <button type="button" onClick={() => setFormData(current => ({ ...current, images: current.images.filter((_, i) => i !== index) }))} className="px-3 rounded bg-red-50 text-red-700">Remove</button>}
            </div>
          ))}
          <button type="button" onClick={() => setFormData(current => ({ ...current, images: [...current.images, ""] }))} className="text-sm text-blue-700">+ Add image</button>
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          <Field label="Product video URL" value={formData.video} onChange={v => update("video", v)} placeholder="https://..." />
          <Field label="Tags" value={formData.tags} onChange={v => update("tags", v)} placeholder="festive, embroidered, lawn" />
        </div>
      </section>

      <section className="bg-white rounded-xl border border-cream p-6">
        <h2 className="text-lg font-semibold">Search engine optimization</h2>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          <Field label="SEO Title" value={formData.seoTitle} onChange={v => update("seoTitle", v)} />
          <label className="block text-sm font-medium">SEO Description<textarea rows={3} value={formData.seoDesc} onChange={e => update("seoDesc", e.target.value)} className="mt-1 w-full rounded border border-cream px-3 py-2 resize-y" /></label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button disabled={loading} className="rounded bg-charcoal px-7 py-3 text-sm text-white disabled:opacity-50">{loading ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}</button>
        <button type="button" onClick={() => router.back()} className="rounded border border-cream px-7 py-3 text-sm">Cancel</button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = "text", placeholder, required = false, min, step, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; step?: string; disabled?: boolean }) {
  return <label className="block text-sm font-medium">{label}<input required={required} type={type} min={min} step={step} disabled={disabled} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded border border-cream px-3 py-2 disabled:bg-cream/50" /></label>
}

function Select({ label, value, onChange, options, required = false, allowEmpty = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean; allowEmpty?: boolean }) {
  return <label className="block text-sm font-medium">{label}<select required={required} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded border border-cream px-3 py-2">{allowEmpty && <option value="">Select...</option>}{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
}
