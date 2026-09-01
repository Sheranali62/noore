"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/products", {
        method: "POST",
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
        alert("Failed to create product")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ""] })
  }

  const removeImageField = (index: number) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index)
      setFormData({ ...formData, images: newImages })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Add Product</h1>
        <button
          onClick={() => router.back()}
          className="border border-cream px-4 py-2 rounded hover:bg-cream transition"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-cream p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="Enter product name"
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
                placeholder="product-slug"
              />
              <p className="text-xs text-secondary mt-1">URL-friendly name. Auto-generates from product name.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="PROD-001"
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
              <label className="block text-sm font-medium mb-1">Subcategory</label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="e.g., Ready to Wear, Unstitched"
              />
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

          {/* Right Column */}
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
                placeholder="2499"
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
                placeholder="1999"
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
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal resize-none"
                placeholder="Product description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Images (URLs)</label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
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
            disabled={loading}
            className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Product"}
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