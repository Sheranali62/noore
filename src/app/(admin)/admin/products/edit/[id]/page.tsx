"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    salePrice: "",
    stock: "",
    status: "DRAFT",
    images: [""],
  })

  useEffect(() => {
    if (id) {
      fetch(`/api/products/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            name: data.name || "",
            slug: data.slug || "",
            sku: data.sku || "",
            description: data.description || "",
            category: data.category || "",
            subcategory: data.subcategory || "",
            price: data.price?.toString() || "",
            salePrice: data.salePrice?.toString() || "",
            stock: data.stock?.toString() || "",
            status: data.status || "DRAFT",
            images: data.images?.length ? data.images : [""],
          })
          setLoading(false)
        })
        .catch(error => {
          console.error("Error:", error)
          setLoading(false)
        })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          stock: parseInt(formData.stock),
          images: formData.images.filter((img: string) => img.trim() !== ""),
        }),
      })

      if (response.ok) {
        router.push("/admin/products")
        router.refresh()
      } else {
        alert("Failed to update product")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-secondary">Loading product...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Edit Product</h1>
        <button
          onClick={() => router.back()}
          className="border border-cream px-4 py-2 rounded hover:bg-cream transition"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-cream p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              >
                <option value="">Select Category</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Luxury">Luxury</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (PKR) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sale Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Images (URLs)</label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => {
                      const newImages = [...formData.images]
                      newImages[index] = e.target.value
                      setFormData({ ...formData, images: newImages })
                    }}
                    className="flex-1 px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== index)
                        setFormData({ ...formData, images: newImages })
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, images: [...formData.images, ""] })}
                className="text-sm text-blue-600 hover:text-blue-800 transition"
              >
                + Add Image URL
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-cream">
          <button
            type="submit"
            disabled={saving}
            className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-cream px-6 py-2 rounded hover:bg-cream transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}