"use client"

import { FormEvent, useEffect, useState } from "react"

type Section = { id: string; type: string; enabled: boolean; sortOrder: number }
type Banner = { id: string; heading: string; subtitle: string | null; image: string; mobileImage: string | null; video: string | null; buttonText: string | null; buttonUrl: string | null; active: boolean; sortOrder: number }
type BannerForm = Omit<Banner, "id"> 

const names: Record<string, string> = { hero: "Hero Slider", categories: "Category Cards", products: "Product Carousel", banner: "Collection Banner", luxury: "Luxury Section", men: "Men Section", accessories: "Accessories", instagram: "Instagram Feed", newsletter: "Newsletter" }
const emptyBanner: BannerForm = { heading: "", subtitle: "", image: "", mobileImage: "", video: "", buttonText: "Shop Now", buttonUrl: "/products", active: true, sortOrder: 1 }

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [form, setForm] = useState<BannerForm>(emptyBanner)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bannerSaving, setBannerSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const load = async () => {
    const response = await fetch("/api/admin/homepage", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Failed to load homepage")
    setSections(data.sections); setBanners(data.banners)
  }
  useEffect(() => { load().catch(err => setError(err.message)).finally(() => setLoading(false)) }, [])

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
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Failed to save homepage")
      setSections(data.sections); setMessage("Homepage layout saved successfully.")
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save homepage") } finally { setSaving(false) }
  }

  const submitBanner = async (event: FormEvent) => {
    event.preventDefault(); setBannerSaving(true); setMessage(""); setError("")
    try {
      const endpoint = editingId ? `/api/admin/homepage/banners/${editingId}` : "/api/admin/homepage/banners"
      const response = await fetch(endpoint, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Failed to save banner")
      await load(); setForm(emptyBanner); setEditingId(null); setMessage(editingId ? "Hero banner updated." : "Hero banner created.")
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save banner") } finally { setBannerSaving(false) }
  }
  const editBanner = (banner: Banner) => { setEditingId(banner.id); setForm({ ...banner }); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }) }
  const deleteBanner = async (id: string) => {
    if (!window.confirm("Delete this hero banner?")) return
    setError(""); setMessage("")
    const response = await fetch(`/api/admin/homepage/banners/${id}`, { method: "DELETE" })
    const data = await response.json(); if (!response.ok) { setError(data.error || "Failed to delete banner"); return }
    if (editingId === id) { setEditingId(null); setForm(emptyBanner) }
    await load(); setMessage("Hero banner deleted.")
  }
  const moveBanner = async (index: number, direction: -1 | 1) => {
    const target = index + direction; if (target < 0 || target >= banners.length) return
    const next = [...banners]; [next[index], next[target]] = [next[target], next[index]]
    try {
      await Promise.all(next.map((banner, i) => fetch(`/api/admin/homepage/banners/${banner.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...banner, sortOrder: i + 1 }) })))
      await load(); setMessage("Hero banner order saved.")
    } catch { setError("Failed to reorder banners") }
  }

  return <div className="max-w-6xl">
    <h1 className="text-3xl font-semibold mb-2">Homepage Builder</h1>
    <p className="text-secondary mb-8">Control the live homepage without editing code: reorder sections, toggle visibility, and manage hero banners.</p>
    {loading ? <div className="bg-white rounded-lg border border-cream p-6">Loading homepage...</div> : <>
      <div className="bg-white rounded-lg border border-cream p-6">
        <h2 className="text-xl font-semibold mb-1">Homepage Sections</h2><p className="text-sm text-secondary mb-5">The public homepage renders these sections in this order.</p>
        <div className="space-y-3">
          {sections.map((section, index) => <div key={section.id} className="flex items-center justify-between gap-4 p-4 border border-cream rounded-lg">
            <div className="flex items-center gap-4 min-w-0"><div className="flex flex-col gap-1"><button aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0} className="text-xs border rounded px-2 py-0.5 disabled:opacity-30">↑</button><button aria-label="Move down" onClick={() => move(index, 1)} disabled={index === sections.length - 1} className="text-xs border rounded px-2 py-0.5 disabled:opacity-30">↓</button></div><div><div className="font-medium">{names[section.type] || section.type}</div><div className="text-xs text-secondary">Display order: {index + 1}</div></div></div>
            <button onClick={() => toggle(section.id)} className={`px-3 py-1 rounded text-sm ${section.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>{section.enabled ? "Enabled" : "Disabled"}</button>
          </div>)}
        </div>
        <div className="mt-6 flex gap-3"><button onClick={save} disabled={saving} className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 disabled:opacity-50">{saving ? "Saving..." : "Save Layout"}</button></div>
      </div>

      <div className="bg-white rounded-lg border border-cream p-6 mt-6">
        <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-semibold">Hero Banners</h2><p className="text-sm text-secondary">Create desktop/mobile promotional banners for the live hero slider.</p></div><button onClick={() => { setEditingId(null); setForm({ ...emptyBanner, sortOrder: banners.length + 1 }) }} className="border border-charcoal px-4 py-2 rounded text-sm">+ Add Banner</button></div>
        {banners.length === 0 ? <p className="text-sm text-secondary">No hero banners yet. Add your first banner below.</p> : <div className="space-y-3">{banners.map((banner, index) => <div key={banner.id} className="border border-cream rounded-lg p-4 flex flex-col md:flex-row gap-4 md:items-center"><img src={banner.image} alt="" className="w-full md:w-40 h-24 object-cover rounded" /><div className="flex-1"><div className="font-medium">{banner.heading}</div><div className="text-xs text-secondary mt-1">{banner.active ? "Active" : "Inactive"} · Order {index + 1}</div>{banner.buttonText && <div className="text-xs mt-2">Button: {banner.buttonText} → {banner.buttonUrl}</div>}</div><div className="flex gap-2"><button onClick={() => moveBanner(index, -1)} disabled={index === 0} className="border rounded px-2 disabled:opacity-30">↑</button><button onClick={() => moveBanner(index, 1)} disabled={index === banners.length - 1} className="border rounded px-2 disabled:opacity-30">↓</button><button onClick={() => editBanner(banner)} className="border rounded px-3">Edit</button><button onClick={() => deleteBanner(banner.id)} className="border rounded px-3 text-red-700">Delete</button></div></div>)}</div>}
      </div>

      <form onSubmit={submitBanner} className="bg-white rounded-lg border border-cream p-6 mt-6">
        <h2 className="text-xl font-semibold mb-1">{editingId ? "Edit Hero Banner" : "Add Hero Banner"}</h2><p className="text-sm text-secondary mb-5">Use a full-width landscape image URL. Mobile image is optional.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {[['heading','Heading'],['subtitle','Subtitle'],['image','Desktop Image URL'],['mobileImage','Mobile Image URL'],['video','Video URL (optional)'],['buttonText','Button Text'],['buttonUrl','Button URL']].map(([key,label]) => <label key={key} className="text-sm font-medium">{label}<input value={String(form[key as keyof BannerForm] ?? '')} onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))} className="mt-1 w-full border border-cream rounded px-3 py-2 font-normal" /></label>)}
          <label className="text-sm font-medium">Display Order<input type="number" min="1" value={form.sortOrder} onChange={e => setForm(current => ({ ...current, sortOrder: Number(e.target.value) }))} className="mt-1 w-full border border-cream rounded px-3 py-2 font-normal" /></label>
          <label className="flex items-center gap-2 text-sm font-medium pt-7"><input type="checkbox" checked={form.active} onChange={e => setForm(current => ({ ...current, active: e.target.checked }))} /> Active on storefront</label>
        </div>
        {form.image && <div className="mt-5"><p className="text-xs text-secondary mb-2">Preview</p><img src={form.mobileImage || form.image} alt="Banner preview" className="w-full max-h-72 object-cover rounded-lg border border-cream" /></div>}
        <div className="mt-6 flex gap-3"><button type="submit" disabled={bannerSaving} className="bg-charcoal text-white px-6 py-2 rounded disabled:opacity-50">{bannerSaving ? "Saving..." : editingId ? "Update Banner" : "Create Banner"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyBanner) }} className="border px-6 py-2 rounded">Cancel</button>}</div>
      </form>
      {error && <div className="mt-4 rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}{message && <div className="mt-4 rounded-md bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>}
    </>}
  </div>
}
