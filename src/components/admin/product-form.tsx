"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import ProductVariantsForm from "@/components/admin/product-variants-form"

type Variant = {
  id?: string
  color: string
  size: string
  sku: string
  price: string
  stock: string
  images: string[]
}

type Category = {
  id: string
  name: string
  slug?: string
  parentId: string | null
  active?: boolean | null
  sortOrder?: number | null
  children?: Category[]
}

export type ProductFormData = {
  name: string
  slug: string
  sku: string
  description: string
  category: string
  subcategory: string
  collection: string
  gender: string
  type: string
  fabric: string
  pieces: string
  costPrice: string
  price: string
  salePrice: string
  stock: string
  lowStock: string
  status: string
  video: string
  tags: string
  seoTitle: string
  seoDesc: string
  images: string[]
}

export const emptyProductForm: ProductFormData = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  category: "",
  subcategory: "",
  collection: "",
  gender: "",
  type: "",
  fabric: "",
  pieces: "",
  costPrice: "",
  price: "",
  salePrice: "",
  stock: "",
  lowStock: "5",
  status: "DRAFT",
  video: "",
  tags: "",
  seoTitle: "",
  seoDesc: "",
  images: [],
}

type Props = {
  mode: "create" | "edit"
  productId?: string
  initialData?: ProductFormData
  initialVariants?: Variant[]
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const MAX_VIDEO_SIZE = 25 * 1024 * 1024

const DEFAULT_DEPARTMENTS = [
  "Women",
  "Men",
  "Kids",
  "Luxury",
  "Accessories",
]

const COLLECTIONS = [
  "New Season",
  "New In",
  "Luxury",
  "Festive",
  "Wedding Guest",
  "Bridal & Occasion",
  "Lawn & Summer",
  "Winter Edit",
  "Everyday",
  "Best Sellers",
  "Sale Edit",
]

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error(`Unable to read ${file.name}`))
    }
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function flattenCategories(input: any[]): Category[] {
  const result: Category[] = []

  const walk = (items: any[], inheritedParentId: string | null = null) => {
    for (const item of items) {
      if (!item || typeof item !== "object" || !item.id || !item.name) continue

      const id = String(item.id)
      const parentId = item.parentId ? String(item.parentId) : inheritedParentId

      result.push({
        id,
        name: String(item.name),
        slug: item.slug ? String(item.slug) : undefined,
        parentId,
        active: item.active !== false,
        sortOrder: Number(item.sortOrder) || 0,
      })

      if (Array.isArray(item.children)) walk(item.children, id)
    }
  }

  walk(input)
  return result
}

export default function ProductForm({
  mode,
  productId,
  initialData = emptyProductForm,
  initialVariants = [],
}: Props) {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryError, setCategoryError] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const [formData, setFormData] = useState<ProductFormData>({
    ...emptyProductForm,
    ...initialData,
    images: Array.isArray(initialData.images)
      ? initialData.images.filter(Boolean)
      : [],
  })
  const [variants, setVariants] = useState<Variant[]>(initialVariants)

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoryError("")

      try {
        const response = await fetch("/api/admin/categories", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || `Category API returned ${response.status}`)
        }

        const raw = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
            ? data.categories
            : Array.isArray(data?.data)
              ? data.data
              : []

        const normalized = flattenCategories(raw)

        if (cancelled) return

        setCategories(normalized)

        if (!initialData.category && normalized.length === 0) {
          setFormData(current => ({ ...current, category: "Women" }))
        }
      } catch (error) {
        console.error("Product category loading error:", error)

        if (!cancelled) {
          setCategoryError(error instanceof Error ? error.message : "Unable to load categories")
          setCategories([])

          if (!initialData.category) {
            setFormData(current => ({ ...current, category: "Women" }))
          }
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [initialData.category])

  const mainCategories = useMemo(() => {
    const databaseRoots = categories
      .filter(category => !category.parentId && category.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name))

    if (databaseRoots.length) return databaseRoots

    return DEFAULT_DEPARTMENTS.map((name, index) => ({
      id: `default-${name.toLowerCase()}`,
      name,
      parentId: null,
      active: true,
      sortOrder: index,
    }))
  }, [categories])

  const selectedMainCategory = useMemo(
    () => mainCategories.find(category => category.name === formData.category),
    [mainCategories, formData.category],
  )

  const subcategories = useMemo(() => {
    if (!selectedMainCategory || selectedMainCategory.id.startsWith("default-")) return []

    return categories
      .filter(
        category =>
          category.parentId === selectedMainCategory.id &&
          category.active !== false,
      )
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name))
  }, [categories, selectedMainCategory])

  const update = (key: keyof ProductFormData, value: string) => {
    setFormData(current => ({ ...current, [key]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(current => ({
      ...current,
      category: value,
      subcategory: "",
      collection: "",
    }))
  }

  const handleSubcategoryChange = (value: string) => {
    setFormData(current => ({
      ...current,
      subcategory: value,
      collection: "",
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setUploadingImages(true)

    try {
      const valid = files.filter(file => {
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file.`)
          return false
        }
        if (file.size > MAX_IMAGE_SIZE) {
          alert(`${file.name} is larger than 3 MB.`)
          return false
        }
        return true
      })

      const urls = await Promise.all(valid.map(fileToDataUrl))

      setFormData(current => ({
        ...current,
        images: [...current.images, ...urls],
      }))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to upload images")
    } finally {
      setUploadingImages(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.")
      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      alert("Video must be 25 MB or smaller.")
      return
    }

    setUploadingVideo(true)

    try {
      const url = await fileToDataUrl(file)
      setFormData(current => ({ ...current, video: url }))
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to upload video")
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.category) return alert("Please select a category.")
    if (!formData.subcategory) return alert("Please select a subcategory.")
    if (!formData.collection) return alert("Please select a collection.")
    if (!formData.name.trim()) return alert("Please enter the product name.")
    if (!formData.sku.trim()) return alert("Please enter the product SKU.")
    if (!formData.slug.trim()) return alert("Please enter the product slug.")
    if (!formData.price) return alert("Please enter the regular price.")

    setLoading(true)

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        pieces: formData.pieces ? Number(formData.pieces) : null,
        stock: Number(formData.stock || 0),
        lowStock: Number(formData.lowStock || 5),
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        images: formData.images.filter(Boolean),
        variants: variants.map(v => ({
          id: v.id,
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: v.price ? Number(v.price) : null,
          stock: Number(v.stock || 0),
          images: v.images.filter(Boolean),
        })),
      }

      const response = await fetch(
        mode === "create" ? "/api/products" : `/api/products/${productId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      )

      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Failed to save product")

      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">Core product information</h2>
        <p className="mt-1 text-sm text-secondary">Category → Subcategory → Collection.</p>

        {categoryError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Category database warning: {categoryError}. Standard departments are still available.
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Product Name *" value={formData.name} onChange={v => update("name", v)} required />
          <Field label="SKU *" value={formData.sku} onChange={v => update("sku", v.toUpperCase())} required />
          <Field label="Slug *" value={formData.slug} onChange={v => update("slug", v.toLowerCase().replace(/\s+/g, "-"))} required />

          <label className="block text-sm font-medium">
            Category *
            <select
              required
              value={formData.category}
              onChange={e => handleCategoryChange(e.target.value)}
              className="mt-1 w-full rounded border border-cream bg-white px-3 py-2"
            >
              <option value="">{categoriesLoading ? "Loading categories..." : "Select Category"}</option>
              {mainCategories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Subcategory *
            {subcategories.length ? (
              <select
                required
                value={formData.subcategory}
                onChange={e => handleSubcategoryChange(e.target.value)}
                className="mt-1 w-full rounded border border-cream bg-white px-3 py-2"
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            ) : (
              <input
                required
                value={formData.subcategory}
                onChange={e => handleSubcategoryChange(e.target.value)}
                placeholder={formData.category ? "Enter subcategory" : "Select category first"}
                className="mt-1 w-full rounded border border-cream px-3 py-2 disabled:bg-cream/50"
                disabled={!formData.category}
              />
            )}
          </label>

          <label className="block text-sm font-medium">
            Collection *
            <select
              required
              value={formData.collection}
              onChange={e => update("collection", e.target.value)}
              disabled={!formData.subcategory}
              className="mt-1 w-full rounded border border-cream bg-white px-3 py-2 disabled:bg-cream/50"
            >
              <option value="">{formData.subcategory ? "Select Collection" : "Select Subcategory first"}</option>
              {COLLECTIONS.map(collection => <option key={collection} value={collection}>{collection}</option>)}
            </select>
          </label>

          <Select label="Gender" value={formData.gender} onChange={v => update("gender", v)} options={["Women", "Men", "Kids", "Unisex"]} allowEmpty />
          <Field label="Product Type" value={formData.type} onChange={v => update("type", v)} placeholder="3 Piece Suit / Kurta / Bag" />
          <Field label="Fabric" value={formData.fabric} onChange={v => update("fabric", v)} placeholder="Lawn / Cotton / Silk" />
          <Field label="Pieces" type="number" min="1" value={formData.pieces} onChange={v => update("pieces", v)} placeholder="3" />
        </div>

        <label className="mt-5 block text-sm font-medium">
          Description
          <textarea rows={6} value={formData.description} onChange={e => update("description", e.target.value)} className="mt-1 w-full resize-y rounded border border-cream px-3 py-2" />
        </label>
      </section>

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">Pricing & inventory</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-4">
          <Field label="Regular Price (PKR) *" type="number" min="0" step="0.01" value={formData.price} onChange={v => update("price", v)} required />
          <Field label="Sale Price (PKR)" type="number" min="0" step="0.01" value={formData.salePrice} onChange={v => update("salePrice", v)} />
          <Field label="Cost Price (PKR)" type="number" min="0" step="0.01" value={formData.costPrice} onChange={v => update("costPrice", v)} />
          <Field label="Low-stock alert" type="number" min="0" value={formData.lowStock} onChange={v => update("lowStock", v)} />
          <Field label="Stock Quantity *" type="number" min="0" value={formData.stock} onChange={v => update("stock", v)} disabled={variants.length > 0} />
          <Select label="Status" value={formData.status} onChange={v => update("status", v)} options={["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]} />
        </div>
        {variants.length > 0 && <p className="mt-3 text-xs text-secondary">Total stock is calculated automatically from variant stock.</p>}
        <ProductVariantsForm value={variants} onChange={setVariants} />
      </section>

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">Media & merchandising</h2>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Product Images</h3>
            <p className="mt-1 text-xs text-secondary">Upload multiple images. Maximum 3 MB per image.</p>
          </div>
          <div>
            <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImages} className="rounded bg-charcoal px-4 py-2 text-sm text-white disabled:opacity-50">
              {uploadingImages ? "Uploading..." : "Upload Images"}
            </button>
          </div>
        </div>

        {formData.images.length ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {formData.images.map((image, index) => (
              <div key={`${index}-${image.slice(0, 20)}`} className="relative overflow-hidden rounded-lg border border-cream">
                <img src={image} alt={`Product image ${index + 1}`} className="aspect-[3/4] w-full object-cover" />
                {index === 0 && <span className="absolute left-2 top-2 rounded bg-charcoal px-2 py-1 text-[10px] text-white">Main Image</span>}
                <button type="button" onClick={() => setFormData(current => ({ ...current, images: current.images.filter((_, i) => i !== index) }))} className="absolute inset-x-2 bottom-2 rounded bg-white px-2 py-1 text-xs font-medium text-red-700 shadow">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-cream p-8 text-center text-sm text-secondary">No product images uploaded.</div>
        )}

        <div className="mt-8 border-t border-cream pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Product Video</h3>
              <p className="mt-1 text-xs text-secondary">Upload one video. Maximum 25 MB.</p>
            </div>
            <div>
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo} className="rounded border border-charcoal px-4 py-2 text-sm disabled:opacity-50">
                {uploadingVideo ? "Uploading..." : formData.video ? "Replace Video" : "Upload Video"}
              </button>
            </div>
          </div>

          {formData.video && (
            <div className="mt-4 overflow-hidden rounded-lg border border-cream bg-black">
              <video src={formData.video} controls className="max-h-[420px] w-full" />
              <button type="button" onClick={() => update("video", "")} className="w-full bg-white px-3 py-2 text-xs font-medium text-red-700">Remove Video</button>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Field label="Tags" value={formData.tags} onChange={v => update("tags", v)} placeholder="festive, embroidered, lawn" />
        </div>
      </section>

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">Search engine optimization</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="SEO Title" value={formData.seoTitle} onChange={v => update("seoTitle", v)} />
          <label className="block text-sm font-medium">
            SEO Description
            <textarea rows={3} value={formData.seoDesc} onChange={e => update("seoDesc", e.target.value)} className="mt-1 w-full resize-y rounded border border-cream px-3 py-2" />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button disabled={loading || uploadingImages || uploadingVideo} className="rounded bg-charcoal px-7 py-3 text-sm text-white disabled:opacity-50">
          {loading ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded border border-cream px-7 py-3 text-sm">Cancel</button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = "text", placeholder, required = false, min, step, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; step?: string; disabled?: boolean }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input required={required} type={type} min={min} step={step} disabled={disabled} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded border border-cream px-3 py-2 disabled:bg-cream/50" />
    </label>
  )
}

function Select({ label, value, onChange, options, required = false, allowEmpty = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean; allowEmpty?: boolean }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select required={required} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded border border-cream bg-white px-3 py-2">
        {allowEmpty && <option value="">Select...</option>}
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
