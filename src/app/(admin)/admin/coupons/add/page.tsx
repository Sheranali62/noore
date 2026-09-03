"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddCouponPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    minOrder: "0",
    maxDiscount: "",
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    usageLimit: "",
    perCustomer: "",
    applicableCategories: "",
    applicableProductIds: "",
    active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          minOrder: parseFloat(formData.minOrder),
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          perCustomer: formData.perCustomer ? parseInt(formData.perCustomer) : null,
          applicableCategories: formData.applicableCategories.split(",").map(v => v.trim()).filter(Boolean),
          applicableProductIds: formData.applicableProductIds.split(",").map(v => v.trim()).filter(Boolean),
          startDate: new Date(formData.startDate),
          expiryDate: new Date(formData.expiryDate),
        }),
      })

      if (response.ok) {
        router.push("/admin/coupons")
        router.refresh()
      } else {
        alert("Failed to create coupon")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Add Coupon</h1>
        <button
          onClick={() => router.back()}
          className="border border-cream px-4 py-2 rounded hover:bg-cream transition"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-cream p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              placeholder="SUMMER20"
            />
            <p className="text-xs text-secondary mt-1">Use uppercase letters and numbers only</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Discount Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (PKR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {formData.type === "PERCENTAGE" ? "Discount Percentage *" : "Discount Amount (PKR) *"}
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              placeholder={formData.type === "PERCENTAGE" ? "20" : "500"}
            />
            {formData.type === "PERCENTAGE" && (
              <p className="text-xs text-secondary mt-1">Enter percentage (e.g., 20 for 20% off)</p>
            )}
          </div>

          {formData.type === "PERCENTAGE" && (
            <div>
              <label className="block text-sm font-medium mb-1">Maximum Discount (PKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="1000"
              />
              <p className="text-xs text-secondary mt-1">Optional: Cap the maximum discount amount</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Minimum Order Amount (PKR)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.minOrder}
              onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              placeholder="500"
            />
            <p className="text-xs text-secondary mt-1">Minimum order value required to use this coupon</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total Usage Limit</label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="100"
              />
              <p className="text-xs text-secondary mt-1">Max times this coupon can be used (leave empty for unlimited)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Per Customer Limit</label>
              <input
                type="number"
                min="1"
                value={formData.perCustomer}
                onChange={(e) => setFormData({ ...formData, perCustomer: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="1"
              />
              <p className="text-xs text-secondary mt-1">Max times per customer (leave empty for unlimited)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Applicable Categories</label>
              <input
                type="text"
                value={formData.applicableCategories}
                onChange={(e) => setFormData({ ...formData, applicableCategories: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="Unstitched, Ready to Wear"
              />
              <p className="text-xs text-secondary mt-1">Optional. Comma-separated. Leave empty for all categories.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Applicable Product IDs</label>
              <input
                type="text"
                value={formData.applicableProductIds}
                onChange={(e) => setFormData({ ...formData, applicableProductIds: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="product-id-1, product-id-2"
              />
              <p className="text-xs text-secondary mt-1">Optional. Comma-separated product IDs. Leave empty for all products.</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-cream">
          <button
            type="submit"
            disabled={loading}
            className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Coupon"}
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