"use client"

import { useState } from "react"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function AdminHomepagePage() {
  const [sections] = useState([
    { id: "hero", name: "Hero Slider", enabled: true, sortOrder: 1 },
    { id: "categories", name: "Category Cards", enabled: true, sortOrder: 2 },
    { id: "products", name: "Product Carousel", enabled: true, sortOrder: 3 },
    { id: "banner", name: "Collection Banner", enabled: true, sortOrder: 4 },
    { id: "luxury", name: "Luxury Section", enabled: true, sortOrder: 5 },
    { id: "men", name: "Men Section", enabled: true, sortOrder: 6 },
    { id: "accessories", name: "Accessories", enabled: true, sortOrder: 7 },
    { id: "instagram", name: "Instagram Feed", enabled: false, sortOrder: 8 },
    { id: "newsletter", name: "Newsletter", enabled: true, sortOrder: 9 },
  ])

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8">Homepage Builder</h1>

      <div className="bg-white rounded-lg border border-cream p-6">
        <p className="text-secondary mb-4">Drag and drop sections to reorder, or toggle them on/off.</p>
        
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center justify-between p-4 border border-cream rounded-lg hover:bg-cream/50 transition cursor-move">
              <div className="flex items-center gap-4">
                <span className="text-secondary">☰</span>
                <span className="font-medium">{section.name}</span>
                <span className="text-xs text-secondary">Order: {section.sortOrder}</span>
              </div>
              <div className="flex items-center gap-4">
                <button className={`px-3 py-1 rounded text-sm ${section.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {section.enabled ? "Enabled" : "Disabled"}
                </button>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 transition">
            Save Changes
          </button>
          <button className="border border-cream px-6 py-2 rounded hover:bg-cream transition">
            Preview
          </button>
        </div>
      </div>
    </div>
  )
}