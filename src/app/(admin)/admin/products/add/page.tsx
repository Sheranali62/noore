"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProductVariantsForm from "@/components/admin/product-variants-form"

type Variant = { id?: string; color: string; size: string; sku: string; price: string; stock: string; images: string[] }

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([])
  const [formData, setFormData] = useState({ name: "", slug: "", sku: "", description: "", category: "", subcategory: "", price: "", salePrice: "", stock: "", status: "DRAFT", images: [""] })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        ...formData, price: parseFloat(formData.price), salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null, stock: parseInt(formData.stock || "0"),
        images: formData.images.filter((img: string) => img.trim() !== ""),
        variants: variants.map(v => ({ color: v.color, size: v.size, sku: v.sku, price: v.price ? parseFloat(v.price) : null, stock: parseInt(v.stock || "0"), images: v.images.filter(Boolean) }))
      }) })
      if (response.ok) { router.push("/admin/products"); router.refresh() } else { const data = await response.json().catch(() => null); alert(data?.error || "Failed to create product") }
    } catch (error) { console.error(error); alert("An error occurred") } finally { setLoading(false) }
  }
  const setImage = (index: number, value: string) => setFormData({ ...formData, images: formData.images.map((img, i) => i === index ? value : img) })

  return <div>
    <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-semibold">Add Product</h1><button onClick={() => router.back()} className="border border-cream px-4 py-2 rounded hover:bg-cream">Cancel</button></div>
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-cream p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Product Name *</label><input required value={formData.name} onChange={e => setFormData({...formData,name:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" placeholder="Embroidered Lawn Suit" /></div>
          <div><label className="block text-sm font-medium mb-1">Slug *</label><input required value={formData.slug} onChange={e => setFormData({...formData,slug:e.target.value.toLowerCase().replace(/\s+/g,"-")})} className="w-full px-3 py-2 border border-cream rounded" placeholder="embroidered-lawn-suit" /><p className="text-xs text-secondary mt-1">URL-friendly name.</p></div>
          <div><label className="block text-sm font-medium mb-1">Product SKU *</label><input required value={formData.sku} onChange={e => setFormData({...formData,sku:e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-cream rounded" placeholder="PROD-001" /></div>
          <div><label className="block text-sm font-medium mb-1">Category *</label><select required value={formData.category} onChange={e => setFormData({...formData,category:e.target.value})} className="w-full px-3 py-2 border border-cream rounded"><option value="">Select Category</option><option>Women</option><option>Men</option><option>Luxury</option><option>Accessories</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Subcategory</label><input value={formData.subcategory} onChange={e => setFormData({...formData,subcategory:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" placeholder="Ready to Wear / Unstitched" /></div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData,status:e.target.value})} className="w-full px-3 py-2 border border-cream rounded"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></div>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Price (PKR) *</label><input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData,price:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" placeholder="4999" /></div>
          <div><label className="block text-sm font-medium mb-1">Sale Price (PKR)</label><input type="number" min="0" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData,salePrice:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" placeholder="3999" /></div>
          <div><label className="block text-sm font-medium mb-1">Stock Quantity *</label><input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData,stock:e.target.value})} className="w-full px-3 py-2 border border-cream rounded" placeholder={variants.length ? "Calculated from variants" : "50"} disabled={variants.length > 0} /><p className="text-xs text-secondary mt-1">When variants are added, stock is calculated from variant stock.</p></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows={5} value={formData.description} onChange={e => setFormData({...formData,description:e.target.value})} className="w-full px-3 py-2 border border-cream rounded resize-none" placeholder="Product description..." /></div>
          <div><label className="block text-sm font-medium mb-1">Images (URLs)</label>{formData.images.map((image,index)=><div key={index} className="flex gap-2 mb-2"><input type="url" value={image} onChange={e=>setImage(index,e.target.value)} className="flex-1 px-3 py-2 border border-cream rounded" placeholder="https://..." />{formData.images.length>1&&<button type="button" onClick={()=>setFormData({...formData,images:formData.images.filter((_,i)=>i!==index)})} className="px-3 py-2 bg-red-100 text-red-600 rounded">×</button>}</div>)}<button type="button" onClick={()=>setFormData({...formData,images:[...formData.images,""]})} className="text-sm text-blue-600">+ Add Image URL</button></div>
        </div>
      </div>
      <ProductVariantsForm value={variants} onChange={setVariants} />
      <div className="flex gap-4 mt-8 pt-6 border-t border-cream"><button type="submit" disabled={loading} className="bg-charcoal text-white px-6 py-2 rounded disabled:opacity-50">{loading?"Creating...":"Create Product"}</button><button type="button" onClick={()=>router.back()} className="border border-cream px-6 py-2 rounded">Cancel</button></div>
    </form>
  </div>
}
