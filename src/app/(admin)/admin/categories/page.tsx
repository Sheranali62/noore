"use client"

import { useEffect, useMemo, useState } from "react"

interface Category { id: string; name: string; slug: string; description: string | null; parentId: string | null; parent?: { id: string; name: string } | null; active: boolean; sortOrder: number; _count?: { children: number } }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  async function load() { setLoading(true); const res = await fetch("/api/admin/categories", { cache: "no-store" }); const data = await res.json(); if (res.ok) setCategories(data); else alert(data.error || "Failed to load categories"); setLoading(false) }
  useEffect(() => { load() }, [])

  const parents = useMemo(() => categories.filter(c => !c.parentId), [categories])

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const body = { name, parentId: parentId || null }
    const res = await fetch(editing ? `/api/admin/categories/${editing}` : "/api/admin/categories", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) alert(data.error || "Could not save category")
    else { setName(""); setParentId(""); setEditing(null); await load() }
    setSaving(false)
  }

  function edit(c: Category) { setEditing(c.id); setName(c.name); setParentId(c.parentId || ""); window.scrollTo({ top: 0, behavior: "smooth" }) }
  async function remove(id: string) { if (!confirm("Delete this category?")) return; const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (!res.ok) alert(data.error || "Could not delete category"); else load() }

  return <div className="max-w-6xl">
    <div className="mb-8"><p className="text-xs uppercase tracking-[0.22em] text-secondary">Catalog</p><h1 className="mt-2 text-3xl font-semibold">Categories & Sub-categories</h1><p className="mt-2 text-sm text-secondary">Create as many departments and nested sub-categories as your NOORÉ catalog needs.</p></div>
    <section className="bg-white rounded-xl border border-cream p-6 mb-6">
      <h2 className="text-lg font-semibold">{editing ? "Edit category" : "Add category"}</h2>
      <p className="text-sm text-secondary mt-1">Leave Parent empty for a main category. Select a Parent to create a sub-category.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <label className="text-sm font-medium">Category name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Women, Saree, Formal Wear" className="mt-1 w-full rounded border border-cream px-3 py-2" /></label>
        <label className="text-sm font-medium">Parent category<select value={parentId} onChange={e => setParentId(e.target.value)} className="mt-1 w-full rounded border border-cream px-3 py-2"><option value="">Main category</option>{parents.filter(p => p.id !== editing).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      </div>
      <div className="flex gap-3 mt-5"><button onClick={save} disabled={saving || !name.trim()} className="rounded bg-charcoal px-6 py-2.5 text-sm text-white disabled:opacity-50">{saving ? "Saving..." : editing ? "Save Category" : "Add Category"}</button>{editing && <button onClick={() => { setEditing(null); setName(""); setParentId("") }} className="rounded border border-cream px-6 py-2.5 text-sm">Cancel</button>}</div>
    </section>
    <section className="bg-white rounded-xl border border-cream overflow-hidden">
      <div className="p-5 border-b border-cream flex items-center justify-between"><div><h2 className="font-semibold">Catalog structure</h2><p className="text-sm text-secondary mt-1">{categories.length} categories configured</p></div></div>
      {loading ? <div className="p-8 text-secondary">Loading categories...</div> : categories.length === 0 ? <div className="p-8 text-secondary">No categories yet. Add your first main category above.</div> : <div className="divide-y divide-cream">{parents.map(parent => <div key={parent.id}><div className="p-4 flex items-center justify-between gap-4"><div><p className="font-semibold">{parent.name}</p><p className="text-xs text-secondary">/{parent.slug} · {categories.filter(c => c.parentId === parent.id).length} sub-categories</p></div><div className="flex gap-2"><button onClick={() => edit(parent)} className="px-3 py-1.5 text-sm border border-cream rounded">Edit</button><button onClick={() => remove(parent.id)} className="px-3 py-1.5 text-sm border border-red-200 text-red-700 rounded">Delete</button></div></div>{categories.filter(c => c.parentId === parent.id).map(child => <div key={child.id} className="ml-6 border-l border-cream pl-5 pr-4 py-3 flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{child.name}</p><p className="text-xs text-secondary">/{child.slug}</p></div><div className="flex gap-2"><button onClick={() => edit(child)} className="px-3 py-1.5 text-xs border border-cream rounded">Edit</button><button onClick={() => remove(child.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded">Delete</button></div></div>)}</div>)}</div>}
    </section>
  </div>
}
