"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  parent?: {
    id: string
    name: string
    slug?: string
    parentId?: string | null
  } | null
  active: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
  _count?: {
    children: number
  }
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

  const [editing, setEditing] = useState<string | null>(
    null
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(
    null
  )

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<
    Record<string, boolean>
  >({})

  /*
   * Load all categories.
   */
  const loadCategories = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true)
      }

      setError("")

      try {
        const response = await fetch(
          "/api/admin/categories",
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const data = await response
          .json()
          .catch(() => [])

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load categories"
          )
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid category response"
          )
        }

        setCategories(data)
      } catch (err) {
        console.error(
          "Load categories error:",
          err
        )

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load categories"
        )
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  /*
   * Create recursive category tree.
   */
  const tree = useMemo<CategoryNode[]>(() => {
    const map = new Map<string, CategoryNode>()

    for (const category of categories) {
      map.set(category.id, {
        ...category,
        children: [],
      })
    }

    const roots: CategoryNode[] = []

    for (const category of categories) {
      const node = map.get(category.id)

      if (!node) {
        continue
      }

      if (
        category.parentId &&
        map.has(category.parentId)
      ) {
        map
          .get(category.parentId)!
          .children.push(node)
      } else {
        roots.push(node)
      }
    }

    const sortNodes = (
      nodes: CategoryNode[]
    ) => {
      nodes.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder
        }

        return a.name.localeCompare(
          b.name
        )
      })

      for (const node of nodes) {
        sortNodes(node.children)
      }
    }

    sortNodes(roots)

    return roots
  }, [categories])

  /*
   * Find category by ID.
   */
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()

    for (const category of categories) {
      map.set(category.id, category)
    }

    return map
  }, [categories])

  /*
   * Find all descendants of a category.
   *
   * Used to prevent selecting one of the category's
   * own children as its parent while editing.
   */
  const getDescendantIds = useCallback(
    (categoryId: string) => {
      const result = new Set<string>()

      const walk = (parentId: string) => {
        for (const category of categories) {
          if (
            category.parentId === parentId &&
            !result.has(category.id)
          ) {
            result.add(category.id)
            walk(category.id)
          }
        }
      }

      walk(categoryId)

      return result
    },
    [categories]
  )

  /*
   * Parent dropdown options.
   *
   * Every category can become a parent.
   * This is what enables unlimited nesting.
   */
  const parentOptions = useMemo(() => {
    const excluded = editing
      ? getDescendantIds(editing)
      : new Set<string>()

    if (editing) {
      excluded.add(editing)
    }

    const result: Array<{
      category: Category
      depth: number
    }> = []

    const walk = (
      nodes: CategoryNode[],
      depth: number
    ) => {
      for (const node of nodes) {
        if (!excluded.has(node.id)) {
          result.push({
            category: node,
            depth,
          })

          walk(
            node.children,
            depth + 1
          )
        }
      }
    }

    walk(tree, 0)

    return result
  }, [
    editing,
    getDescendantIds,
    tree,
  ])

  /*
   * Filter tree by search.
   *
   * If a child matches, its parents remain visible.
   */
  const filteredTree = useMemo<
    CategoryNode[]
  >(() => {
    const query = search
      .trim()
      .toLowerCase()

    if (!query) {
      return tree
    }

    const filterNodes = (
      nodes: CategoryNode[]
    ): CategoryNode[] => {
      const result: CategoryNode[] = []

      for (const node of nodes) {
        const ownMatch =
          node.name
            .toLowerCase()
            .includes(query) ||
          node.slug
            .toLowerCase()
            .includes(query) ||
          Boolean(
            node.description
              ?.toLowerCase()
              .includes(query)
          )

        const children =
          filterNodes(node.children)

        if (
          ownMatch ||
          children.length > 0
        ) {
          result.push({
            ...node,
            children,
          })
        }
      }

      return result
    }

    return filterNodes(tree)
  }, [search, tree])

  /*
   * Reset form.
   */
  function resetForm() {
    setForm(blankForm)
    setEditing(null)
    setError("")
    setSuccess("")
  }

  /*
   * Start adding a category.
   */
  function startAdd(parentId = "") {
    setEditing(null)

    setForm({
      ...blankForm,
      parentId,
    })

    setError("")
    setSuccess("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  /*
   * Start editing a category.
   */
  function startEdit(category: Category) {
    setEditing(category.id)

    setForm({
      name: category.name,
      slug: category.slug,
      description:
        category.description || "",
      parentId:
        category.parentId || "",
      active: category.active,
      sortOrder: String(
        category.sortOrder
      ),
    })

    setError("")
    setSuccess("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  /*
   * Update form field.
   */
  function updateForm(
    field: keyof typeof blankForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  /*
   * Save category.
   */
  async function saveCategory(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")

    const name = form.name.trim()

    if (!name) {
      setError(
        "Category name is required."
      )
      return
    }

    if (
      editing &&
      form.parentId === editing
    ) {
      setError(
        "A category cannot be its own parent."
      )
      return
    }

    setSaving(true)

    try {
      const payload = {
        name,
        slug: form.slug.trim(),
        description:
          form.description.trim(),
        parentId:
          form.parentId || null,
        active: form.active,
        sortOrder:
          Number(form.sortOrder) || 0,
      }

      const response = await fetch(
        editing
          ? `/api/admin/categories/${editing}`
          : "/api/admin/categories",
        {
          method: editing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not save category"
        )
      }

      const savedId =
        data?.id as string | undefined

      setSuccess(
        editing
          ? "Category updated successfully."
          : "Category created successfully."
      )

      setForm(blankForm)
      setEditing(null)

      await loadCategories(false)

      /*
       * Automatically expand the new/updated
       * category's parent.
       */
      if (savedId) {
        const parentId =
          data?.parentId as
            | string
            | null
            | undefined

        if (parentId) {
          setExpanded((current) => ({
            ...current,
            [parentId]: true,
          }))
        }
      }
    } catch (err) {
      console.error(
        "Save category error:",
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : "Could not save category"
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * Delete category.
   */
  async function deleteCategory(
    category: Category
  ) {
    if (deleting) {
      return
    }

    const childCount =
      category._count?.children || 0

    const message =
      childCount > 0
        ? `"${category.name}" has ${childCount} child categor${
            childCount === 1
              ? "y"
              : "ies"
          }. Move or delete its children first.`
        : `Delete "${category.name}"?`

    if (!window.confirm(message)) {
      return
    }

    if (childCount > 0) {
      return
    }

    setDeleting(category.id)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not delete category"
        )
      }

      if (editing === category.id) {
        resetForm()
      }

      setSuccess(
        "Category deleted successfully."
      )

      await loadCategories(false)
    } catch (err) {
      console.error(
        "Delete category error:",
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete category"
      )
    } finally {
      setDeleting(null)
    }
  }

  /*
   * Toggle tree node.
   */
  function toggleExpanded(
    id: string
  ) {
    setExpanded((current) => ({
      ...current,
      [id]: !current[id],
    }))
  }

  /*
   * Expand all categories.
   */
  function expandAll() {
    const next: Record<
      string,
      boolean
    > = {}

    for (const category of categories) {
      if (
        category._count?.children
      ) {
        next[category.id] = true
      }
    }

    setExpanded(next)
  }

  /*
   * Collapse all categories.
   */
  function collapseAll() {
    setExpanded({})
  }

  /*
   * Render recursive tree.
   */
  function renderTree(
    nodes: CategoryNode[],
    depth = 0
  ): React.ReactNode {
    return nodes.map((node) => {
      const hasChildren =
        node.children.length > 0

      const isExpanded =
        search.trim()
          ? true
          : Boolean(
              expanded[node.id]
            )

      const isEditing =
        editing === node.id

      return (
        <div
          key={node.id}
          className="border-b border-black/5 last:border-b-0"
        >
          <div
            className={`group flex items-center gap-3 px-4 py-3 transition ${
              isEditing
                ? "bg-black/[0.04]"
                : "hover:bg-black/[0.02]"
            }`}
            style={{
              paddingLeft:
                16 + depth * 28,
            }}
          >
            <button
              type="button"
              onClick={() =>
                hasChildren &&
                toggleExpanded(node.id)
              }
              disabled={!hasChildren}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                hasChildren
                  ? "border-black/10 bg-white hover:bg-black hover:text-white"
                  : "border-transparent text-black/20"
              }`}
              aria-label={
                hasChildren
                  ? isExpanded
                    ? "Collapse"
                    : "Expand"
                  : undefined
              }
            >
              {hasChildren
                ? isExpanded
                  ? "−"
                  : "+"
                : "•"}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-black">
                  {node.name}
                </span>

                {depth === 0 && (
                  <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                    Main
                  </span>
                )}

                {depth > 0 && (
                  <span className="rounded-full border border-black/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/50">
                    Level {depth + 1}
                  </span>
                )}

                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                    node.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {node.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-black/40">
                <span>
                  /{node.slug}
                </span>

                {hasChildren && (
                  <span>
                    {node.children.length}{" "}
                    child
                    {node.children.length ===
                    1
                      ? ""
                      : "ren"}
                  </span>
                )}

                {node.description && (
                  <span className="truncate">
                    {node.description}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              <button
                type="button"
                onClick={() =>
                  startAdd(node.id)
                }
                className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/60 transition hover:border-black hover:bg-black hover:text-white"
              >
                + Child
              </button>

              <button
                type="button"
                onClick={() =>
                  startEdit(node)
                }
                className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/60 transition hover:border-black hover:bg-black hover:text-white"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  deleteCategory(node)
                }
                disabled={
                  deleting === node.id ||
                  Boolean(
                    node._count?.children
                  )
                }
                className="rounded-full border border-red-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500 transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {deleting === node.id
                  ? "..."
                  : "Delete"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-3 sm:hidden"
            style={{
              paddingLeft:
                16 +
                depth * 28 +
                40,
            }}
          >
            <button
              type="button"
              onClick={() =>
                startAdd(node.id)
              }
              className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              + Child
            </button>

            <button
              type="button"
              onClick={() =>
                startEdit(node)
              }
              className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                deleteCategory(node)
              }
              disabled={
                deleting === node.id ||
                Boolean(
                  node._count?.children
                )
              }
              className="rounded-full border border-red-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500 disabled:opacity-30"
            >
              Delete
            </button>
          </div>

          {hasChildren &&
            isExpanded && (
              <div>
                {renderTree(
                  node.children,
                  depth + 1
                )}
              </div>
            )}
        </div>
      )
    })
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-black/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
            Catalog structure
          </p>

          <h1 className="text-3xl font-light tracking-[-0.03em] text-black">
            Categories
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
            Build your NOORÉ catalog with
            unlimited category and
            subcategory levels.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startAdd()}
            className="rounded-full bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/80"
          >
            + Main Category
          </button>

          <button
            type="button"
            onClick={expandAll}
            className="rounded-full border border-black/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 transition hover:border-black hover:text-black"
          >
            Expand All
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="rounded-full border border-black/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 transition hover:border-black hover:text-black"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Form */}
      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
              {editing
                ? "Edit category"
                : "Create category"}
            </p>

            <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">
              {editing
                ? "Update category"
                : "Add to catalog"}
            </h2>
          </div>

          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="self-start rounded-full border border-black/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/60 hover:border-black hover:text-black"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form
          onSubmit={saveCategory}
          className="grid gap-5 lg:grid-cols-2"
        >
          {/* Name */}
          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              Category name *
            </span>

            <input
              value={form.name}
              onChange={(event) =>
                updateForm(
                  "name",
                  event.target.value
                )
              }
              placeholder="e.g. Lawn"
              className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
            />
          </label>

          {/* Slug */}
          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              Slug
            </span>

            <input
              value={form.slug}
              onChange={(event) =>
                updateForm(
                  "slug",
                  event.target.value
                )
              }
              placeholder="Auto-generated if empty"
              className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
            />

            <span className="mt-1 block text-[10px] text-black/35">
              Leave empty to generate
              automatically.
            </span>
          </label>

          {/* Parent */}
          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              Parent category
            </span>

            <select
              value={form.parentId}
              onChange={(event) =>
                updateForm(
                  "parentId",
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
            >
              <option value="">
                — Main Category —
              </option>

              {parentOptions.map(
                ({
                  category,
                  depth,
                }) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {"　".repeat(depth)}
                    {depth > 0
                      ? "└ "
                      : ""}
                    {category.name}
                  </option>
                )
              )}
            </select>

            <span className="mt-1 block text-[10px] text-black/35">
              Any category can be a parent.
              Unlimited nesting is supported.
            </span>
          </label>

          {/* Sort */}
          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              Sort order
            </span>

            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                updateForm(
                  "sortOrder",
                  event.target.value
                )
              }
              min="0"
              className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
            />
          </label>

          {/* Description */}
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              Description
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm(
                  "description",
                  event.target.value
                )
              }
              rows={3}
              placeholder="Optional category description..."
              className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
            />
          </label>

          {/* Active */}
          <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 lg:col-span-2">
            <div>
              <p className="text-sm font-medium">
                Category active
              </p>

              <p className="mt-1 text-[11px] text-black/40">
                Inactive categories can remain
                in your catalog structure
                without being shown as active.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                updateForm(
                  "active",
                  !form.active
                )
              }
              className={`relative h-7 w-12 rounded-full transition ${
                form.active
                  ? "bg-black"
                  : "bg-black/15"
              }`}
              aria-label="Toggle category active"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                  form.active
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Update Category"
                  : "Create Category"}
            </button>

            <button
              type="button"
              onClick={() => startAdd()}
              disabled={saving}
              className="rounded-full border border-black/10 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 transition hover:border-black hover:text-black disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Category Tree */}
      <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                Catalog tree
              </p>

              <h2 className="mt-1 text-xl font-medium">
                {categories.length}{" "}
                {categories.length === 1
                  ? "Category"
                  : "Categories"}
              </h2>
            </div>

            <div className="w-full lg:max-w-sm">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search categories..."
                className="w-full rounded-full border border-black/10 bg-[#fafafa] px-4 py-2.5 text-sm outline-none transition focus:border-black focus:bg-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-black/40">
            Loading categories...
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04] text-xl">
              +
            </div>

            <h3 className="text-base font-medium">
              {search
                ? "No categories found"
                : "No categories yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">
              {search
                ? "Try another search term."
                : "Create your first main category to start building your catalog."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => startAdd()}
                className="mt-5 rounded-full bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
              >
                + Create Main Category
              </button>
            )}
          </div>
        ) : (
          <div>
            {renderTree(filteredTree)}
          </div>
        )}
      </section>

      {/* Structure hint */}
      <section className="rounded-3xl border border-black/10 bg-[#fafafa] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
          Example
        </p>

        <div className="mt-4 overflow-x-auto">
          <pre className="min-w-max text-xs leading-6 text-black/60">
{`Women
 ├── Clothing
 │    ├── Lawn
 │    │    ├── 2 Piece
 │    │    └── 3 Piece
 │    ├── Formal Wear
 │    │    └── Wedding Guest
 │    └── Casual Wear
 ├── Accessories
 │    ├── Dupattas
 │    └── Shawls
 └── Sale

Men
 ├── Clothing
 │    ├── Shalwar Kameez
 │    ├── Kurta
 │    └── Suits
 └── Accessories

Kids
 ├── Girls
 │    ├── Shalwar Kameez
 │    └── Festive Wear
 └── Boys
      ├── Kurta
      └── Waistcoats`}
          </pre>
        </div>
      </section>

      {/* Debug-safe category information */}
      {editing && categoryMap.has(editing) && (
        <div className="hidden">
          Editing: {categoryMap.get(editing)?.name}
        </div>
      )}
    </div>
  )
}