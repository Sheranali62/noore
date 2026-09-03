"use client"

import { useEffect, useState } from "react"

type Section = { id: string; type: string; enabled: boolean; sortOrder: number }
type Banner = { id: string; heading: string; subtitle: string | null; image: string; mobileImage: string | null; buttonText: string | null; buttonUrl: string | null; active: boolean; sortOrder: number }

const names: Record<string, string> = { hero: "Hero Slider", categories: "Category Cards", products: "Product Carousel", banner: "Collection Banner", luxury: "Luxury Section", men: "Men Section", accessories: "Accessories", instagram: "Instagram Feed", newsletter: "Newsletter" }

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/homepage", { cache: "no-store" }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load homepage")
      setSections(data.sections); setBanners(data.banners)
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => setSections(current => current.map(section => section.id === id ? { ...section, enabled: !section.enabled } : section))
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    setSections(current => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next })
  }

  const save = async () => {
    setSaving(true); setMessage(""); setError("")
    try {
      const response = await fetch("/api/admin/homepage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sections }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to save homepage")
      setSections(data.sections); setMessage("Homepage layout saved successfully.")
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save homepage") }
    finally { setSaving(false) }
  }

  return <div className="max-w-5xl">
    <h1 className="text-3xl font-semibold mb-2">Homepage Builder</h1>
    <p className="text-secondary mb-8">Enable sections and change their display order. Changes are saved to your store database.</p>
    {loading ? <div className="bg-white rounded-lg border border-cream p-6">Loading homepage...</div> : <>
      <div className="bg-white rounded-lg border border-cream p-6">
        <div className="space-y-3">
          {sections.map((section, index) => <div key={section.id} className="flex items-center justify-between gap-4 p-4 border border-cream rounded-lg">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex flex-col gap-1">
                <button aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0} className="text-xs border rounded px-2 py-0.5 disabled:opacity-30">↑</button>
                <button aria-label="Move down" onClick={() => move(index, 1)} disabled={index === sections.length - 1} className="text-xs border rounded px-2 py-0.5 disabled:opacity-30">↓</button>
              </div>
              <div><div className="font-medium">{names[section.type] || section.type}</div><div className="text-xs text-secondary">Display order: {index + 1}</div></div>
            </div>
            <button onClick={() => toggle(section.id)} className={`px-3 py-1 rounded text-sm ${section.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{section.enabled ? "Enabled" : "Disabled"}</button>
          </div>)}
        </div>
        {error && <div className="mt-4 rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        {message && <div className="mt-4 rounded-md bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>}
        <div className="mt-6"><button onClick={save} disabled={saving} className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button></div>
      </div>

      <div className="bg-white rounded-lg border border-cream p-6 mt-6">
        <h2 className="text-xl font-semibold mb-2">Hero Banners</h2>
        <p className="text-sm text-secondary">Hero banner records are loaded from the database. Banner editing can be added next without changing the section layout system.</p>
        {banners.length === 0 ? <p className="text-sm mt-4 text-secondary">No hero banners have been created yet.</p> : <div className="space-y-3 mt-4">{banners.map(banner => <div key={banner.id} className="border border-cream rounded-lg p-4"><div className="font-medium">{banner.heading}</div><div className="text-xs text-secondary mt-1">{banner.active ? "Active" : "Inactive"} · Order {banner.sortOrder}</div></div>)}</div>}
      </div>
    </>}
  </div>
}
