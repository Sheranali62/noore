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

type Category = {
  id: string
  name: string
  parentId: string | null
  active: boolean
  sortOrder: number
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const MAX_VIDEO_SIZE = 25 * 1024 * 1024

const COLLECTIONS = [
  "New Season",
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read the selected file"))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(new Error(`Unable to read ${file.name}`))
    }

    reader.readAsDataURL(file)
  })
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

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  /*
   * Load categories from the admin category system.
   *
   * We do NOT automatically select anything.
   *
   * Workflow:
   * Category
   *   ↓
   * Subcategory
   *   ↓
   * Collection
   */
  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setCategoriesLoading(true)

      try {
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Unable to load categories")
        }

        const data = await response.json()

        if (!cancelled) {
          setCategories(
            Array.isArray(data)
              ? data.filter(
                  (category): category is Category =>
                    Boolean(
                      category &&
                        typeof category.id === "string" &&
                        typeof category.name === "string",
                    ),
                )
              : [],
          )
        }
      } catch {
        if (!cancelled) {
          setCategories([])
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * Only root categories are shown in Category.
   */
  const mainCategories = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            !category.parentId && category.active,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  )

  /*
   * Subcategory depends on selected Category.
   */
  const selectedCategory = useMemo(
    () =>
      mainCategories.find(
        (category) =>
          category.name === formData.category,
      ),
    [mainCategories, formData.category],
  )

  const subcategories = useMemo(
    () =>
      selectedCategory
        ? categories
            .filter(
              (category) =>
                category.parentId === selectedCategory.id &&
                category.active,
            )
            .sort(
              (a, b) => a.sortOrder - b.sortOrder,
            )
        : [],
    [categories, selectedCategory],
  )

  const update = (
    key: keyof ProductFormData,
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  /*
   * CATEGORY CHANGE
   *
   * Category changes:
   * - category = new category
   * - subcategory = cleared
   * - collection = cleared
   */
  const handleCategoryChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      category: value,
      subcategory: "",
      collection: "",
    }))
  }

  /*
   * SUBCATEGORY CHANGE
   *
   * Subcategory changes:
   * - subcategory = new subcategory
   * - collection = cleared
   */
  const handleSubcategoryChange = (
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      subcategory: value,
      collection: "",
    }))
  }

  const removeProductImage = (index: number) => {
    setFormData((current) => ({
      ...current,
      images: current.images.filter(
        (_, imageIndex) => imageIndex !== index,
      ),
    }))
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files || [],
    )

    if (!files.length) return

    setUploadingImages(true)

    try {
      const validFiles: File[] = []

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file.`)
          continue
        }

        if (file.size > MAX_IMAGE_SIZE) {
          alert(
            `${file.name} is larger than 3 MB.`,
          )
          continue
        }

        validFiles.push(file)
      }

      if (!validFiles.length) return

      const uploadedImages = await Promise.all(
        validFiles.map((file) =>
          fileToDataUrl(file),
        ),
      )

      setFormData((current) => ({
        ...current,
        images: [
          ...current.images,
          ...uploadedImages,
        ],
      }))
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload product images.",
      )
    } finally {
      setUploadingImages(false)

      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
    }
  }

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.")

      if (videoInputRef.current) {
        videoInputRef.current.value = ""
      }

      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      alert("Video must be 25 MB or smaller.")

      if (videoInputRef.current) {
        videoInputRef.current.value = ""
      }

      return
    }

    setUploadingVideo(true)

    try {
      const videoDataUrl =
        await fileToDataUrl(file)

      setFormData((current) => ({
        ...current,
        video: videoDataUrl,
      }))
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload product video.",
      )
    } finally {
      setUploadingVideo(false)

      if (videoInputRef.current) {
        videoInputRef.current.value = ""
      }
    }
  }

  const submit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    /*
     * STRICT CLASSIFICATION FLOW
     */
    if (!formData.category.trim()) {
      alert("Please select a Category.")
      return
    }

    if (!formData.subcategory.trim()) {
      alert("Please select a Subcategory.")
      return
    }

    if (!formData.collection.trim()) {
      alert("Please select a Collection.")
      return
    }

    if (!formData.name.trim()) {
      alert("Please enter the product name.")
      return
    }

    if (!formData.sku.trim()) {
      alert("Please enter the product SKU.")
      return
    }

    if (!formData.slug.trim()) {
      alert("Please enter the product slug.")
      return
    }

    if (!formData.price.trim()) {
      alert("Please enter the product price.")
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,

        price: Number(formData.price),

        salePrice: formData.salePrice
          ? Number(formData.salePrice)
          : null,

        costPrice: formData.costPrice
          ? Number(formData.costPrice)
          : null,

        pieces: formData.pieces
          ? Number(formData.pieces)
          : null,

        stock: Number(formData.stock || 0),

        lowStock: Number(
          formData.lowStock || 5,
        ),

        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),

        images: formData.images.filter(Boolean),

        variants: variants.map((variant) => ({
          id: variant.id,
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          price: variant.price
            ? Number(variant.price)
            : null,
          stock: Number(variant.stock || 0),
          images: variant.images.filter(Boolean),
        })),
      }

      const response = await fetch(
        mode === "create"
          ? "/api/products"
          : `/api/products/${productId}`,
        {
          method:
            mode === "create" ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      const data = await response
        .json()
        .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Failed to ${
              mode === "create"
                ? "create"
                : "update"
            } product`,
        )
      }

      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      {/* ========================================================= */}
      {/* CORE PRODUCT INFORMATION */}
      {/* ========================================================= */}

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">
          Core product information
        </h2>

        <p className="mt-1 text-sm text-secondary">
          Product information and merchandising
          classification.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Product Name *"
            value={formData.name}
            onChange={(value) =>
              update("name", value)
            }
            required
          />

          <Field
            label="SKU *"
            value={formData.sku}
            onChange={(value) =>
              update(
                "sku",
                value.toUpperCase(),
              )
            }
            required
          />

          <Field
            label="Slug *"
            value={formData.slug}
            onChange={(value) =>
              update(
                "slug",
                value
                  .toLowerCase()
                  .replace(/\s+/g, "-"),
              )
            }
            required
          />

          {/* ===================================================== */}
          {/* 1. CATEGORY */}
          {/* ===================================================== */}

          <Select
            label="1. Category *"
            value={formData.category}
            onChange={handleCategoryChange}
            options={mainCategories.map(
              (category) => category.name,
            )}
            required
            loading={categoriesLoading}
            placeholder={
              categoriesLoading
                ? "Loading categories..."
                : "Select Category"
            }
          />

          {/* ===================================================== */}
          {/* 2. SUBCATEGORY */}
          {/* ===================================================== */}

          <Select
            label="2. Subcategory *"
            value={formData.subcategory}
            onChange={handleSubcategoryChange}
            options={subcategories.map(
              (category) => category.name,
            )}
            required
            disabled={
              !formData.category ||
              categoriesLoading ||
              subcategories.length === 0
            }
            placeholder={
              !formData.category
                ? "Select Category first"
                : subcategories.length === 0
                  ? "No subcategories available"
                  : "Select Subcategory"
            }
          />

          {/* ===================================================== */}
          {/* 3. COLLECTION */}
          {/* ===================================================== */}

          <Select
            label="3. Collection *"
            value={formData.collection}
            onChange={(value) =>
              update("collection", value)
            }
            options={COLLECTIONS}
            required
            disabled={!formData.subcategory}
            placeholder={
              !formData.subcategory
                ? "Select Subcategory first"
                : "Select Collection"
            }
          />

          <Select
            label="Gender"
            value={formData.gender}
            onChange={(value) =>
              update("gender", value)
            }
            options={[
              "Women",
              "Men",
              "Kids",
              "Unisex",
            ]}
            allowEmpty
          />

          <Field
            label="Product Type"
            value={formData.type}
            onChange={(value) =>
              update("type", value)
            }
            placeholder="3 Piece Suit / Kurta / Bag"
          />

          <Field
            label="Fabric"
            value={formData.fabric}
            onChange={(value) =>
              update("fabric", value)
            }
            placeholder="Lawn / Cotton / Silk"
          />

          <Field
            label="Pieces"
            type="number"
            min="1"
            value={formData.pieces}
            onChange={(value) =>
              update("pieces", value)
            }
            placeholder="3"
          />
        </div>

        {/* Classification status */}
        <div className="mt-6 rounded-lg border border-cream bg-cream/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Product Classification
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-charcoal px-3 py-1.5 text-white">
              {formData.category ||
                "Category not selected"}
            </span>

            <span className="text-secondary">
              →
            </span>

            <span
              className={`rounded-full px-3 py-1.5 ${
                formData.subcategory
                  ? "bg-charcoal text-white"
                  : "bg-white text-secondary"
              }`}
            >
              {formData.subcategory ||
                "Subcategory not selected"}
            </span>

            <span className="text-secondary">
              →
            </span>

            <span
              className={`rounded-full px-3 py-1.5 ${
                formData.collection
                  ? "bg-charcoal text-white"
                  : "bg-white text-secondary"
              }`}
            >
              {formData.collection ||
                "Collection not selected"}
            </span>
          </div>
        </div>

        <label className="mt-5 block text-sm font-medium">
          Description

          <textarea
            rows={6}
            value={formData.description}
            onChange={(event) =>
              update(
                "description",
                event.target.value,
              )
            }
            className="mt-1 w-full resize-y rounded border border-cream px-3 py-2"
          />
        </label>
      </section>

      {/* ========================================================= */}
      {/* PRICING & INVENTORY */}
      {/* ========================================================= */}

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">
          Pricing & inventory
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-4">
          <Field
            label="Regular Price (PKR) *"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(value) =>
              update("price", value)
            }
            required
          />

          <Field
            label="Sale Price (PKR)"
            type="number"
            min="0"
            step="0.01"
            value={formData.salePrice}
            onChange={(value) =>
              update("salePrice", value)
            }
          />

          <Field
            label="Cost Price (PKR)"
            type="number"
            min="0"
            step="0.01"
            value={formData.costPrice}
            onChange={(value) =>
              update("costPrice", value)
            }
          />

          <Field
            label="Low-stock alert"
            type="number"
            min="0"
            value={formData.lowStock}
            onChange={(value) =>
              update("lowStock", value)
            }
          />

          <Field
            label="Stock Quantity *"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(value) =>
              update("stock", value)
            }
            disabled={variants.length > 0}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(value) =>
              update("status", value)
            }
            options={[
              "DRAFT",
              "ACTIVE",
              "ARCHIVED",
              "OUT_OF_STOCK",
            ]}
          />
        </div>

        {variants.length > 0 && (
          <p className="mt-3 text-xs text-secondary">
            Total stock is calculated from variant
            stock quantities.
          </p>
        )}

        <ProductVariantsForm
          value={variants}
          onChange={setVariants}
        />
      </section>

      {/* ========================================================= */}
      {/* MEDIA */}
      {/* ========================================================= */}

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">
          Media & merchandising
        </h2>

        {/* PRODUCT IMAGES */}

        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                Product Images
              </h3>

              <p className="mt-1 text-xs text-secondary">
                Upload one or more product images.
                Maximum 3 MB per image.
              </p>
            </div>

            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  imageInputRef.current?.click()
                }
                disabled={uploadingImages}
                className="rounded bg-charcoal px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {uploadingImages
                  ? "Uploading..."
                  : "Upload Images"}
              </button>
            </div>
          </div>

          {formData.images.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {formData.images.map(
                (image, index) => (
                  <div
                    key={`${image.slice(
                      0,
                      30,
                    )}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-cream bg-cream/20"
                  >
                    <img
                      src={image}
                      alt={`Product image ${
                        index + 1
                      }`}
                      className="aspect-[3/4] w-full object-cover"
                    />

                    {index === 0 && (
                      <span className="absolute left-2 top-2 rounded bg-charcoal px-2 py-1 text-[10px] font-medium text-white">
                        Main Image
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                      <button
                        type="button"
                        onClick={() =>
                          removeProductImage(
                            index,
                          )
                        }
                        className="w-full rounded bg-white px-2 py-1.5 text-xs font-medium text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-cream p-8 text-center">
              <p className="text-sm font-medium">
                No product images uploaded
              </p>

              <p className="mt-1 text-xs text-secondary">
                Click &quot;Upload Images&quot; to
                add product photos.
              </p>
            </div>
          )}
        </div>

        {/* PRODUCT VIDEO */}

        <div className="mt-8 border-t border-cream pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                Product Video
              </h3>

              <p className="mt-1 text-xs text-secondary">
                Upload one product video. Maximum
                25 MB.
              </p>
            </div>

            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  videoInputRef.current?.click()
                }
                disabled={uploadingVideo}
                className="rounded border border-charcoal px-4 py-2 text-sm disabled:opacity-50"
              >
                {uploadingVideo
                  ? "Uploading..."
                  : formData.video
                    ? "Replace Video"
                    : "Upload Video"}
              </button>
            </div>
          </div>

          {formData.video ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-cream bg-black">
              <video
                src={formData.video}
                controls
                preload="metadata"
                className="max-h-[420px] w-full"
              />

              <div className="flex items-center justify-between gap-3 bg-white p-3">
                <span className="text-xs text-secondary">
                  Product video uploaded
                </span>

                <button
                  type="button"
                  onClick={() => {
                    update("video", "")

                    if (
                      videoInputRef.current
                    ) {
                      videoInputRef.current.value =
                        ""
                    }
                  }}
                  className="rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
                >
                  Remove Video
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-cream p-6 text-center">
              <p className="text-sm font-medium">
                No product video uploaded
              </p>

              <p className="mt-1 text-xs text-secondary">
                Video is optional.
              </p>
            </div>
          )}
        </div>

        {/* TAGS */}

        <div className="mt-8">
          <Field
            label="Tags"
            value={formData.tags}
            onChange={(value) =>
              update("tags", value)
            }
            placeholder="festive, embroidered, lawn"
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* SEO */}
      {/* ========================================================= */}

      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">
          Search engine optimization
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="SEO Title"
            value={formData.seoTitle}
            onChange={(value) =>
              update("seoTitle", value)
            }
          />

          <label className="block text-sm font-medium">
            SEO Description

            <textarea
              rows={3}
              value={formData.seoDesc}
              onChange={(event) =>
                update(
                  "seoDesc",
                  event.target.value,
                )
              }
              className="mt-1 w-full resize-y rounded border border-cream px-3 py-2"
            />
          </label>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ACTIONS */}
      {/* ========================================================= */}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            loading ||
            uploadingImages ||
            uploadingVideo ||
            categoriesLoading
          }
          className="rounded bg-charcoal px-7 py-3 text-sm text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : mode === "create"
              ? "Create Product"
              : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-cream px-7 py-3 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* =============================================================== */
/* FIELD */
/* =============================================================== */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  step,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  min?: string
  step?: string
  disabled?: boolean
}) {
  return (
    <label className="block text-sm font-medium">
      {label}

      <input
        required={required}
        type={type}
        min={min}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-cream px-3 py-2 disabled:bg-cream/50"
      />
    </label>
  )
}

/* =============================================================== */
/* SELECT */
/* =============================================================== */

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  allowEmpty = false,
  disabled = false,
  loading = false,
  placeholder = "Select...",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  required?: boolean
  allowEmpty?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium">
      {label}

      <select
        required={required}
        disabled={disabled || loading}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-1 w-full rounded border border-cream px-3 py-2 disabled:bg-cream/50 disabled:text-secondary"
      >
        <option value="">
          {loading
            ? "Loading..."
            : allowEmpty
              ? "Select..."
              : placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}