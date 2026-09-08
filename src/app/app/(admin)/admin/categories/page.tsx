"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  parent?: { id: string; name: string; slug?: string; parentId?: string | null } | null
  active: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
  _count?: { children: number }
}

interface CategoryNode extends Category {
  children: CategoryNode[]
}

const blankForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  active: true,
  sortOrder: "0",
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(blankForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [parentSearch, setParentSearch] = useState("")
  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const loadCategories = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/categories", {
        method: "GET",
        cache: "no-store",
      })
      const data = await response.json().catch(() => [])

      if (!response.ok) throw new Error(data?.error || "Failed to load categories")
      if (!Array.isArray(data)) throw new Error("Invalid category response")
      setCategories(data)
    } catch (err) {
      console.error("Load categories error:", err)
      setError(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const tree = useMemo<CategoryNode[]>(() => {
    const map = new Map<string, CategoryNode>()
    for (const category of categories) map.set(category.id, { ...category, children: [] })

    const roots: CategoryNode[] = []
    for (const category of categories) {
      const node = map.get(category.id)
      if (!node) continue
      if (category.parentId && map.has(category.parentId)) {
        map.get(category.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.name.localeCompare(b.name))
      nodes.forEach((node) => sortNodes(node.children))
    }
    sortNodes(roots)
    return roots
  }, [categories])

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])

  const rootCount = useMemo(() => categories.filter((category) => !category.parentId).length, [categories])
  const nestedCount = Math.max(0, categories.length - rootCount)
  const activeCount = useMemo(() => categories.filter((category) => category.active).length, [categories])

  const getDescendantIds = useCallback((categoryId: string) => {
    const result = new Set<string>()
    const walk = (parentId: string) => {
      for (const category of categories) {
        if (category.parentId === parentId && !result.has(category.id)) {
          result.add(category.id)
          walk(category.id)
        }
      }
    }
    walk(categoryId)
    return result
  }, [categories])

  const parentOptions = useMemo(() => {
    const excluded = editing ? getDescendantIds(editing) : new Set<string>()
    if (editing) excluded.add(editing)

    const result: Array<{ category: Category; depth: number }> = []
    const walk = (nodes: CategoryNode[], depth: number) => {
      nodes.forEach((node) => {
        if (!excluded.has(node.id)) {
          result.push({ category: node, depth })
          walk(node.children, depth + 1)
        }
      })
    }
    walk(tree, 0)
    return result
  }, [editing, getDescendantIds, tree])

  const filteredParentOptions = useMemo(() => {
    const query = parentSearch.trim().toLowerCase()
    if (!query) return parentOptions
    return parentOptions.filter(({ category }) =>
      category.name.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query),
    )
  }, [parentOptions, parentSearch])

  const selectedParent = parentOptions.find(({ category }) => category.id === form.parentId)?.category

  const filteredTree = useMemo<CategoryNode[]>(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tree

    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      const result: CategoryNode[] = []
      for (const node of nodes) {
        const ownMatch = node.name.toLowerCase().includes(query) || node.slug.toLowerCase().includes(query) || Boolean(node.description?.toLowerCase().includes(query))
        const children = filterNodes(node.children)
        if (ownMatch || children.length > 0) result.push({ ...node, children })
      }
      return result
    }
    return filterNodes(tree)
  }, [search, tree])

  function resetForm() {
    setForm(blankForm)
    setEditing(null)
    setParentSearch("")
    setParentPickerOpen(false)
    setError("")
    setSuccess("")
  }

  function startAdd(parentId = "") {
    setEditing(null)
    setForm({ ...blankForm, parentId })
    setParentSearch("")
    setParentPickerOpen(false)
    setError("")
    setSuccess("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function startEdit(category: Category) {
    setEditing(category.id)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parentId || "",
      active: category.active,
      sortOrder: String(category.sortOrder),
    })
    setParentSearch("")
    setParentPickerOpen(false)
    setError("")
    setSuccess("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function updateForm(field: keyof typeof blankForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")

    const name = form.name.trim()
    if (!name) {
      setError("Category name is required.")
      return
    }
    if (editing && form.parentId === editing) {
      setError("A category cannot be its own parent.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        slug: form.slug.trim(),
        description: form.description.trim(),
        parentId: form.parentId || null,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
      }

      const response = await fetch(editing ? `/api/admin/categories/${editing}` : "/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Could not save category")

      setSuccess(editing ? "Category updated successfully." : "Category created successfully.")
      setForm(blankForm)
      setEditing(null)
      setParentPickerOpen(false)
      await loadCategories(false)

      const parentId = data?.parentId as string | null | undefined
      if (parentId) setExpanded((current) => ({ ...current, [parentId]: true }))
    } catch (err) {
      console.error("Save category error:", err)
      setError(err instanceof Error ? err.message : "Could not save category")
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(category: Category) {
    if (deleting) return
    const childCount = category._count?.children || 0
    const message = childCount > 0
      ? `"${category.name}" has ${childCount} child categor${childCount === 1 ? "y" : "ies"}. Move or delete its children first.`
      : `Delete "${category.name}"?`

    if (!window.confirm(message)) return
    if (childCount > 0) return

    setDeleting(category.id)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Could not delete category")
      if (editing === category.id) resetForm()
      setSuccess("Category deleted successfully.")
      await loadCategories(false)
    } catch (err) {
      console.error("Delete category error:", err)
      setError(err instanceof Error ? err.message : "Could not delete category")
    } finally {
      setDeleting(null)
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((current) => ({ ...current, [id]: !current[id] }))
  }

  function expandAll() {
    const next: Record<string, boolean> = {}
    categories.forEach((category) => {
      if (category._count?.children) next[category.id] = true
    })
    setExpanded(next)
  }

  function collapseAll() {
    setExpanded({})
  }

  function renderTree(nodes: CategoryNode[], depth = 0): React.ReactNode {
    return nodes.map((node) => {
      const hasChildren = node.children.length > 0
      const isExpanded = search.trim() ? true : Boolean(expanded[node.id])
      const isEditing = editing === node.id

      return (
        <div key={node.id} className="border-b border-white/[0.06] last:border-b-0">
          <div
            className={`group flex items-center gap-3 px-4 py-3.5 transition sm:px-5 ${isEditing ? "bg-white/[0.07]" : "hover:bg-white/[0.035]"}`}
            style={{ paddingLeft: 16 + depth * 28 }}
          >
            <button
              type="button"
              onClick={() => hasChildren && toggleExpanded(node.id)}
              disabled={!hasChildren}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs transition ${hasChildren ? "border-white/15 bg-white/[0.04] text-white hover:bg-white hover:text-black" : "border-transparent text-white/20"}`}
            >
              {hasChildren ? (isExpanded ? "−" : "+") : "•"}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-white">{node.name}</span>
                {depth === 0 && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-black">Main</span>}
                {depth > 0 && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">L{depth + 1}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${node.active ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{node.active ? "Active" : "Inactive"}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
                <span>/{node.slug}</span>
                {hasChildren && <span>{node.children.length} child{node.children.length === 1 ? "" : "ren"}</span>}
                {node.description && <span className="truncate">{node.description}</span>}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <button type="button" onClick={() => startAdd(node.id)} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 transition hover:border-white/30 hover:bg-white hover:text-black">+ Child</button>
              <button type="button" onClick={() => startEdit(node)} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 transition hover:border-white/30 hover:bg-white hover:text-black">Edit</button>
              <button type="button" onClick={() => deleteCategory(node)} disabled={deleting === node.id || Boolean(node._count?.children)} className="rounded-full border border-red-400/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:border-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-25">{deleting === node.id ? "..." : "Delete"}</button>
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-3 sm:hidden" style={{ paddingLeft: 56 + depth * 28 }}>
            <button type="button" onClick={() => startAdd(node.id)} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">+ Child</button>
            <button type="button" onClick={() => startEdit(node)} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Edit</button>
            <button type="button" onClick={() => deleteCategory(node)} disabled={deleting === node.id || Boolean(node._count?.children)} className="rounded-full border border-red-400/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300 disabled:opacity-25">Delete</button>
          </div>

          {hasChildren && isExpanded && <div>{renderTree(node.children, depth + 1)}</div>}
        </div>
      )
    })
  }

  const inputClass = "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/35 focus:bg-black/30"

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-transparent p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.035] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">Catalog Studio</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">Live structure</span>
            </div>
            <h1 className="mt-3 font-editorial text-4xl tracking-tight sm:text-5xl">Categories</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Design the NOORÉ catalog hierarchy. Create departments, subcategories and deeper levels without leaving this workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => startAdd()} className="rounded-full bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-black transition hover:bg-white/90">+ Main Category</button>
            <button type="button" onClick={expandAll} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/65 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white">Expand All</button>
            <button type="button" onClick={collapseAll} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/65 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white">Collapse</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total", categories.length, "all catalog nodes"],
          ["Departments", rootCount, "top-level categories"],
          ["Subcategories", nestedCount, "nested nodes"],
          ["Active", activeCount, "visible to product forms"],
        ].map(([label, value, copy]) => (
          <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2"><span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">{label}</span><span className="h-1.5 w-1.5 rounded-full bg-white/40" /></div>
            <div className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">{value}</div>
            <div className="mt-1 text-[11px] text-white/30">{copy}</div>
          </div>
        ))}
      </section>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

      <section className="overflow-visible rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-xl">
        <div className="border-b border-white/[0.07] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/35">{editing ? "Editing node" : "Create node"}</p>
              <h2 className="mt-1 text-xl font-medium tracking-tight">{editing ? "Update category" : "Add to catalog"}</h2>
            </div>
            {editing && <button type="button" onClick={resetForm} className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55 transition hover:border-white/25 hover:text-white">Cancel</button>}
          </div>
        </div>

        <form onSubmit={saveCategory} className="grid gap-5 p-5 sm:p-7 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Category name *</span>
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="e.g. Lawn" className={inputClass} />
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Slug</span>
            <input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="Auto-generated if empty" className={inputClass} />
            <span className="mt-1.5 block text-[10px] text-white/25">Leave empty to generate automatically.</span>
          </label>

          <div className="relative">
            <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Parent category</span>
            <button type="button" onClick={() => setParentPickerOpen((open) => !open)} className={`${inputClass} flex items-center justify-between text-left`}>
              <span className={selectedParent ? "text-white" : "text-white/35"}>{selectedParent?.name || "No parent · Main category"}</span>
              <span className="text-white/35">{parentPickerOpen ? "−" : "+"}</span>
            </button>
            <span className="mt-1.5 block text-[10px] text-white/25">Choose any category as a parent. Unlimited nesting supported.</span>

            {parentPickerOpen && (
              <div className="absolute left-0 right-0 top-[76px] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#171717] shadow-2xl shadow-black/50">
                <div className="border-b border-white/[0.07] p-3">
                  <input autoFocus value={parentSearch} onChange={(event) => setParentSearch(event.target.value)} placeholder="Search parent categories..." className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25" />
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  <button type="button" onClick={() => { updateForm("parentId", ""); setParentPickerOpen(false); setParentSearch("") }} className={`mb-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition ${!form.parentId ? "bg-white text-black" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}>No parent · Main category</button>
                  {filteredParentOptions.map(({ category, depth }) => (
                    <button key={category.id} type="button" onClick={() => { updateForm("parentId", category.id); setParentPickerOpen(false); setParentSearch(""); setExpanded((current) => ({ ...current, [category.id]: true })) }} className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition ${form.parentId === category.id ? "bg-white text-black" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`} style={{ paddingLeft: 12 + depth * 18 }}>
                      <span className="mr-2 text-white/25">{depth > 0 ? "└" : "◆"}</span>{category.name}
                    </button>
                  ))}
                  {filteredParentOptions.length === 0 && <div className="px-3 py-6 text-center text-xs text-white/30">No matching parent categories.</div>}
                </div>
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Sort order</span>
            <input type="number" min="0" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", event.target.value)} className={inputClass} />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Description</span>
            <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={3} placeholder="Optional category description..." className={`${inputClass} resize-none`} />
          </label>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-4 lg:col-span-2">
            <div><p className="text-sm font-medium">Category active</p><p className="mt-1 text-[11px] text-white/30">Active categories are available in the admin product category selector.</p></div>
            <button type="button" onClick={() => updateForm("active", !form.active)} className={`relative h-7 w-12 rounded-full transition ${form.active ? "bg-white" : "bg-white/15"}`} aria-label="Toggle category active"><span className={`absolute top-1 h-5 w-5 rounded-full shadow transition ${form.active ? "left-6 bg-black" : "left-1 bg-white/70"}`} /></button>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row lg:col-span-2">
            <button type="submit" disabled={saving} className="rounded-full bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : editing ? "Update Category" : "Create Category"}</button>
            <button type="button" onClick={() => startAdd()} disabled={saving} className="rounded-full border border-white/10 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55 transition hover:border-white/25 hover:text-white disabled:opacity-50">Clear</button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-xl">
        <div className="border-b border-white/[0.07] p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/35">Catalog tree</p><h2 className="mt-1 text-xl font-medium">{categories.length} {categories.length === 1 ? "category" : "categories"}</h2></div>
            <div className="w-full lg:max-w-md"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by category, slug or description..." className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/25" /></div>
          </div>
        </div>

        {loading ? <div className="p-12 text-center text-sm text-white/35">Loading catalog structure...</div> : filteredTree.length === 0 ? (
          <div className="p-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-white/45">+</div><h3 className="mt-4 text-base font-medium">{search ? "No categories found" : "Your catalog is empty"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/30">{search ? "Try another search term." : "Create your first main category to start building the NOORÉ catalog."}</p>{!search && <button type="button" onClick={() => startAdd()} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black">+ Create Main Category</button>}</div>
        ) : <div>{renderTree(filteredTree)}</div>}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/[0.045] to-transparent p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">01 · Department</p><p className="mt-2 text-sm text-white/75">Women, Men, Kids, Luxury, Accessories.</p></div>
          <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">02 · Subcategory</p><p className="mt-2 text-sm text-white/75">Choose a parent to place the category underneath it.</p></div>
          <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">03 · Product</p><p className="mt-2 text-sm text-white/75">The Add Product form automatically reads active category children.</p></div>
        </div>
      </section>

      {editing && categoryMap.has(editing) && <span className="hidden">Editing: {categoryMap.get(editing)?.name}</span>}
    </div>
  )
}
