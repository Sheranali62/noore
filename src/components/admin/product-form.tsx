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

type CategoryRecord = {
  id: string
  name: string
  parentId: string | null
  active: boolean
  sortOrder: number
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

const BUILT_IN_DEPARTMENTS = [
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

function normalizeCategory(
  item: any,
  inheritedParentId: string | null = null,
  index = 0,
): CategoryRecord[] {
  if (!item || typeof item !== "object") {
    return []
  }

  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id
      : `category-${index}-${String(item.name ?? "unknown")}`

  const name =
    typeof item.name === "string"
      ? item.name.trim()
      : ""

  if (!name) {
    return []
  }

  const parentId =
    typeof item.parentId === "string" && item.parentId.trim()
      ? item.parentId
      : inheritedParentId

  const active = item.active !== false

  const sortOrder =
    typeof item.sortOrder === "number"
      ? item.sortOrder
      : 0

  const current: CategoryRecord = {
    id,
    name,
    parentId,
    active,
    sortOrder,
  }

  const children = Array.isArray(item.children)
    ? item.children.flatMap((child: any, childIndex: number) =>
        normalizeCategory(child, id, childIndex),
      )
    : []

  return [current, ...children]
}

function normalizeCategoryResponse(data: any): CategoryRecord[] {
  let raw: any[] = []

  if (Array.isArray(data)) {
    raw = data
  } else if (Array.isArray(data?.categories)) {
    raw = data.categories
  } else if (Array.isArray(data?.data)) {
    raw = data.data
  } else if (Array.isArray(data?.items)) {
    raw = data.items
  }

  return raw.flatMap((item, index) =>
    normalizeCategory(item, null, index),
  )
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

  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryError, setCategoryError] = useState("")

  const [formData, setFormData] = useState<ProductFormData>({
    ...emptyProductForm,
    ...initialData,
    images: Array.isArray(initialData.images)
      ? initialData.images.filter(Boolean)
      : [],
  })

  const [variants, setVariants] =
    useState<Variant[]>(initialVariants)

  /*
   * LOAD CATEGORIES
   *
   * Supports:
   *   []
   *   { categories: [] }
   *   { data: [] }
   *   { items: [] }
   *
   * Also supports nested:
   *   Women
   *     Shalwar Kameez
   *       3 Piece
   */
  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoryError("")

      try {
        const response = await fetch(
          "/api/admin/categories",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        )

        const text = await response.text()

        let data: any = null

        if (text) {
          try {
            data = JSON.parse(text)
          } catch {
            data = null
          }
        }

        if (!response.ok) {
          const message =
            typeof data?.error === "string"
              ? data.error
              : `Category API returned ${response.status}`

          throw new Error(message)
        }

        const loadedCategories =
          normalizeCategoryResponse(data)

        if (cancelled) return

        setCategories(loadedCategories)

        /*
         * IMPORTANT:
         * We do NOT delete or replace database categories.
         *
         * If the database/API is temporarily empty,
         * we expose the standard NOORÉ departments so
         * product creation does not become unusable.
         */
        if (
          loadedCategories.length === 0 &&
          !initialData.category
        ) {
          setFormData((current) => ({
            ...current,
            category: "Women",
            subcategory: "",
            collection: "",
          }))
        }
      } catch (error) {
        if (cancelled) return

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load categories."

        console.error(
          "Product form category loading error:",
          error,
        )

        setCategoryError(message)

        /*
         * Keep the product form usable even if the
         * category endpoint temporarily fails.
         */
        setCategories([])
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
  }, [initialData.category])

  /*
   * MAIN CATEGORIES
   *
   * A category is a root category when:
   *   parentId === null
   *
   * Missing active means active.
   */
  const mainCategories = useMemo(() => {
    const databaseCategories = categories
      .filter(
        (category) =>
          !category.parentId &&
          category.active !== false,
      )
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder
        }

        return a.name.localeCompare(b.name)
      })

    /*
     * If DB has categories, use them.
     * Otherwise show the standard department choices.
     */
    if (databaseCategories.length > 0) {
      return databaseCategories
    }

    return BUILT_IN_DEPARTMENTS.map(
      (name, index) => ({
        id: `builtin-${name.toLowerCase()}`,
        name,
        parentId: null,
        active: true,
        sortOrder: index,
      }),
    )
  }, [categories])

  const selectedMainCategory = useMemo(() => {
    return mainCategories.find(
      (category) =>
        category.name === formData.category,
    )
  }, [mainCategories, formData.category])

  /*
   * DIRECT SUBCATEGORIES
   */
  const subcategories = useMemo(() => {
    if (!selectedMainCategory) {
      return []
    }

    /*
     * Built-in departments don't have DB children.
     */
    if (
      selectedMainCategory.id.startsWith("builtin-")
    ) {
      return []
    }

    return categories
      .filter(
        (category) =>
          category.parentId ===
            selectedMainCategory.id &&
          category.active !== false,
      )
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder
        }

        return a.name.localeCompare(b.name)
      })
  }, [
    categories,
    selectedMainCategory,
  ])

  const collectionOptions = useMemo(() => {
    return COLLECTIONS
  }, [])

  const update = (
    key: keyof ProductFormData,
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      category: value,
      subcategory: "",
      collection: "",
    }))
  }

  const handleSubcategoryChange = (
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      subcategory: value,
      collection: "",
    }))
  }

  /*
   * PRODUCT IMAGE REMOVE
   */
  const removeProductImage = (index: number) => {
    setFormData((current) => ({
      ...current,
      images: current.images.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
    }))
  }

  /*
   * PRODUCT IMAGE UPLOAD
   */
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
          alert(
            `${file.name} is not an image file.`,
          )
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

      const uploadedImages =
        await Promise.all(
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

  /*
   * PRODUCT VIDEO UPLOAD
   */
  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.")

      if (videoInputRef.current) {
        videoInputRef.current.value = ""
      }

      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      alert(
        "Video must be 25 MB or smaller.",
      )

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

  /*
   * SUBMIT
   */
  const submit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    /*
     * These three fields are deliberately
     * required in the product workflow.
     */
    if (!formData.category.trim()) {
      alert("Please select a category.")
      return
    }

    if (!formData.subcategory.trim()) {
      alert("Please select or enter a subcategory.")
      return
    }

    if (!formData.collection.trim()) {
      alert("Please select a collection.")
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
      alert("Please enter the regular price.")
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,

        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        slug: formData.slug.trim(),

        category: formData.category.trim(),
        subcategory:
          formData.subcategory.trim(),
        collection:
          formData.collection.trim(),

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

        stock: Number(
          formData.stock || 0,
        ),

        lowStock: Number(
          formData.lowStock || 5,
        ),

        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),

        images: formData.images.filter(Boolean),

        variants: variants.map(
          (variant) => ({
            id: variant.id,
            color:
              variant.color.trim(),
            size:
              variant.size.trim(),
            sku:
              variant.sku
                .trim()
                .toUpperCase(),
            price: variant.price
              ? Number(variant.price)
              : null,
            stock: Number(
              variant.stock || 0,
            ),
            images:
              variant.images.filter(Boolean),
          }),
        ),
      }

      const response = await fetch(
        mode === "create"
          ? "/api/products"
          : `/api/products/${productId}`,
        {
          method:
            mode === "create"
              ? "POST"
              : "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify(
            payload,
          ),
        },
      )

      const data =
        await response
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
      {/* =====================================================
          CORE PRODUCT INFORMATION
          ===================================================== */}
      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">
          Core product information
        </h2>

        <p className="mt-1 text-sm text-secondary">
          The information customers and
          merchandising teams use most.
        </p>

        {/* CATEGORY STATUS */}
        {categoriesLoading && (
          <div className="mt-5 rounded-lg border border-cream bg-cream/20 p-4">
            <p className="text-sm font-medium">
              Loading categories...
            </p>

            <p className="mt-1 text-xs text-secondary">
              Loading your NOORÉ category
              structure.
            </p>
          </div>
        )}

        {categoryError && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Category database could not
              be loaded
            </p>

            <p className="mt-1 text-xs text-red-700">
              {categoryError}
            </p>

            <p className="mt-2 text-xs text-red-700">
              The standard NOORÉ departments
              remain available so you can
              continue working.
            </p>
          </div>
        )}

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
                  .replace(
                    /\s+/g,
                    "-",
                  ),
              )
            }
            required
          />

          {/* CATEGORY */}
          <div className="block text-sm font-medium">
            <label>
              Category *
            </label>

            <select
              required
              value={formData.category}
              onChange={(event) =>
                handleCategoryChange(
                  event.target.value,
                )
              }
              className="mt-1 w-full rounded border border-cream bg-white px-3 py-2"
            >
              <option value="">
                Select Category
              </option>

              {mainCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={
                      category.name
                    }
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* SUBCATEGORY */}
          {subcategories.length > 0 ? (
            <div className="block text-sm font-medium">
              <label>
                Subcategory *
              </label>

              <select
                required
                value={
                  formData.subcategory
                }
                onChange={(event) =>
                  handleSubcategoryChange(
                    event.target.value,
                  )
                }
                className="mt-1 w-full rounded border border-cream bg-white px-3 py-2"
              >
                <option value="">
                  Select Subcategory
                </option>

                {subcategories.map(
                  (subcategory) => (
                    <option
                      key={
                        subcategory.id
                      }
                      value={
                        subcategory.name
                      }
                    >
                      {
                        subcategory.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          ) : (
            <Field
              label="Subcategory *"
              value={
                formData.subcategory
              }
              onChange={(value) =>
                handleSubcategoryChange(
                  value,
                )
              }
              placeholder="e.g. Shalwar Kameez"
              required
            />
          )}

          {/* COLLECTION */}
          <div className="block text-sm font-medium">
            <label>
              Collection *
            </label>

            <select
              required
              value={
                formData.collection
              }
              disabled={
                !formData.subcategory
              }
              onChange={(event) =>
                update(
                  "collection",
                  event.target.value,
                )
              }
              className="mt-1 w-full rounded border border-cream bg-white px-3 py-2 disabled:bg-cream/50 disabled:text-secondary"
            >
              <option value="">
                {formData.subcategory
                  ? "Select Collection"
                  : "Select Subcategory first"}
              </option>

              {collectionOptions.map(
                (collection) => (
                  <option
                    key={collection}
                    value={collection}
                  >
                    {collection}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* GENDER */}
          <Select
            label="Gender"
            value={formData.gender}
            onChange={(value) =>
              update(
                "gender",
                value,
              )
            }
            options={[
              "Women",
              "Men",
              "Kids",
              "Unisex",
            ]}
            allowEmpty
          />

          {/* PRODUCT TYPE */}
          <Field
            label="Product Type"
            value={formData.type}
            onChange={(value) =>
              update("type", value)
            }
            placeholder="3 Piece Suit / Kurta / Bag"
          />

          {/* FABRIC */}
          <Field
            label="Fabric"
            value={formData.fabric}
            onChange={(value) =>
              update(
                "fabric",
                value,
              )
            }
            placeholder="Lawn / Cotton / Silk"
          />

          {/* PIECES */}
          <Field
            label="Pieces"
            type="number"
            min="1"
            value={formData.pieces}
            onChange={(value) =>
              update(
                "pieces",
                value,
              )
            }
            placeholder="3"
          />
        </div>

        <label className="mt-5 block text-sm font-medium">
          Description

          <textarea
            rows={6}
            value={
              formData.description
            }
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

      {/* =====================================================
          PRICING & INVENTORY
          ===================================================== */}
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
              update(
                "price",
                value,
              )
            }
            required
          />

          <Field
            label="Sale Price (PKR)"
            type="number"
            min="0"
            step="0.01"
            value={
              formData.salePrice
            }
            onChange={(value) =>
              update(
                "salePrice",
                value,
              )
            }
          />

          <Field
            label="Cost Price (PKR)"
            type="number"
            min="0"
            step="0.01"
            value={
              formData.costPrice
            }
            onChange={(value) =>
              update(
                "costPrice",
                value,
              )
            }
          />

          <Field
            label="Low-stock alert"
            type="number"
            min="0"
            value={
              formData.lowStock
            }
            onChange={(value) =>
              update(
                "lowStock",
                value,
              )
            }
          />

          <Field
            label="Stock Quantity *"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(value) =>
              update(
                "stock",
                value,
              )
            }
            disabled={
              variants.length > 0
            }
          />

          <Select
            label="Status"
            value={
              formData.status
            }
            onChange={(value) =>
              update(
                "status",
                value,
              )
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
            Total stock is calculated
            automatically from variant
            stock.
          </p>
        )}

        <ProductVariantsForm
          value={variants}
          onChange={setVariants}
        />
      </section>

      {/* =====================================================
          MEDIA
          ===================================================== */}
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
                Upload one or more product
                images. Maximum 3 MB per
                image.
              </p>
            </div>

            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleImageUpload
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  imageInputRef.current?.click()
                }
                disabled={
                  uploadingImages
                }
                className="rounded bg-charcoal px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {uploadingImages
                  ? "Uploading..."
                  : "Upload Images"}
              </button>
            </div>
          </div>

          {formData.images.length >
          0 ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {formData.images.map(
                (image, index) => (
                  <div
                    key={`${image.slice(
                      0,
                      30,
                    )}-${index}`}
                    className="group relative overflow-hidden rounded-lg border border-cream bg-cream/20"
                  >
                    <img
                      src={image}
                      alt={`Product image ${
                        index + 1
                      }`}
                      className="aspect-[3/4] w-full object-cover"
                    />

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

                    {index === 0 && (
                      <span className="absolute left-2 top-2 rounded bg-charcoal px-2 py-1 text-[10px] font-medium text-white">
                        Main Image
                      </span>
                    )}
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
                Click &quot;Upload
                Images&quot; to add
                product photos.
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
                Upload one product video.
                Maximum 25 MB.
              </p>
            </div>

            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={
                  handleVideoUpload
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  videoInputRef.current?.click()
                }
                disabled={
                  uploadingVideo
                }
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
                    update(
                      "video",
                      "",
                    )

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
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field
            label="Tags"
            value={formData.tags}
            onChange={(value) =>
              update(
                "tags",
                value,
              )
            }
            placeholder="festive, embroidered, lawn"
          />
        </div>
      </section>

      {/* =====================================================
          SEO
          ===================================================== */}
      <section className="rounded-xl border border-cream bg-white p-6">
        <h2 className="text-lg font-semibold">
          Search engine optimization
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="SEO Title"
            value={
              formData.seoTitle
            }
            onChange={(value) =>
              update(
                "seoTitle",
                value,
              )
            }
          />

          <label className="block text-sm font-medium">
            SEO Description

            <textarea
              rows={3}
              value={
                formData.seoDesc
              }
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

      {/* =====================================================
          ACTIONS
          ===================================================== */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            loading ||
            uploadingImages ||
            uploadingVideo
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
          onClick={() =>
            router.back()
          }
          className="rounded border border-cream px-7 py-3 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* =========================================================
   FIELD
   ========================================================= */

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
  onChange: (
    value: string,
  ) => void
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
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-cream px-3 py-2 disabled:bg-cream/50"
      />
    </label>
  )
}

/* =========================================================
   SELECT
   ========================================================= */

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  allowEmpty = false,
}: {
  label: string
  value: string
  onChange: (
    value: string,
  ) => void
  options: string[]
  required?: boolean
  allowEmpty?: boolean
}) {
  return (
    <label className="block text-sm font-medium">
      {label}

      <select
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="mt-1 w-full rounded border border-cream bg-white px-3 py-2"
      >
        {allowEmpty && (
          <option value="">
            Select...
          </option>
        )}

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