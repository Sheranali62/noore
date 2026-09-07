"use client"

import { useMemo, useRef, useState } from "react"

type Variant = {
  id?: string
  color: string
  size: string
  sku: string
  price: string
  stock: string
  images: string[]
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read the selected image"))
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

export default function ProductVariantsForm({
  value,
  onChange,
}: {
  value: Variant[]
  onChange: (value: Variant[]) => void
}) {
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const totalStock = useMemo(
    () =>
      value.reduce(
        (sum, variant) =>
          sum +
          (Number.isFinite(Number(variant.stock))
            ? Number(variant.stock)
            : 0),
        0,
      ),
    [value],
  )

  const update = (
    index: number,
    patch: Partial<Variant>,
  ) => {
    onChange(
      value.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, ...patch }
          : variant,
      ),
    )
  }

  const add = () =>
    onChange([
      ...value,
      {
        color: "",
        size: "",
        sku: "",
        price: "",
        stock: "",
        images: [],
      },
    ])

  const remove = (index: number) =>
    onChange(
      value.filter(
        (_, variantIndex) => variantIndex !== index,
      ),
    )

  const removeImage = (
    variantIndex: number,
    imageIndex: number,
  ) => {
    update(variantIndex, {
      images: value[variantIndex].images.filter(
        (_, index) => index !== imageIndex,
      ),
    })
  }

  const uploadImages = async (
    variantIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || [])

    if (!files.length) return

    setUploading((current) => ({
      ...current,
      [variantIndex]: true,
    }))

    try {
      const validFiles: File[] = []

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file.`)
          continue
        }

        if (file.size > MAX_IMAGE_SIZE) {
          alert(`${file.name} is larger than 3 MB.`)
          continue
        }

        validFiles.push(file)
      }

      if (!validFiles.length) return

      const images = await Promise.all(
        validFiles.map((file) => fileToDataUrl(file)),
      )

      update(variantIndex, {
        images: [
          ...value[variantIndex].images,
          ...images,
        ],
      })
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload variant images.",
      )
    } finally {
      setUploading((current) => ({
        ...current,
        [variantIndex]: false,
      }))

      const input = inputRefs.current[variantIndex]

      if (input) {
        input.value = ""
      }
    }
  }

  return (
    <section className="mt-8 border-t border-cream pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Variants
          </h2>

          <p className="mt-1 text-sm text-secondary">
            Add a separate SKU and stock quantity for every
            Color + Size combination.
          </p>
        </div>

        <div className="text-sm font-medium">
          Variant stock total:{" "}
          <span className="font-semibold">
            {totalStock}
          </span>
        </div>
      </div>

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-cream p-6 text-sm text-secondary">
          No variants yet. Add variants for products that
          have different sizes or colors.
        </div>
      )}

      <div className="space-y-4">
        {value.map((variant, index) => (
          <div
            key={variant.id || index}
            className="rounded-lg border border-cream bg-cream/20 p-4"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Color *
                </label>

                <input
                  required
                  value={variant.color}
                  onChange={(event) =>
                    update(index, {
                      color: event.target.value,
                    })
                  }
                  className="w-full rounded border border-cream bg-white px-3 py-2"
                  placeholder="Black"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Size *
                </label>

                <input
                  required
                  value={variant.size}
                  onChange={(event) =>
                    update(index, {
                      size: event.target.value,
                    })
                  }
                  className="w-full rounded border border-cream bg-white px-3 py-2"
                  placeholder="Medium"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Variant SKU *
                </label>

                <input
                  required
                  value={variant.sku}
                  onChange={(event) =>
                    update(index, {
                      sku: event.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded border border-cream bg-white px-3 py-2"
                  placeholder="PROD-BLK-M"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Price Override
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(event) =>
                    update(index, {
                      price: event.target.value,
                    })
                  }
                  className="w-full rounded border border-cream bg-white px-3 py-2"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Stock *
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(event) =>
                    update(index, {
                      stock: event.target.value,
                    })
                  }
                  className="w-full rounded border border-cream bg-white px-3 py-2"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-cream bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    Variant Images
                  </h3>

                  <p className="mt-1 text-xs text-secondary">
                    Optional. Maximum 3 MB per image.
                  </p>
                </div>

                <div>
                  <input
                    ref={(element) => {
                      inputRefs.current[index] = element
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      uploadImages(index, event)
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      inputRefs.current[index]?.click()
                    }
                    disabled={uploading[index]}
                    className="rounded bg-charcoal px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {uploading[index]
                      ? "Uploading..."
                      : "Upload Images"}
                  </button>
                </div>
              </div>

              {variant.images.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {variant.images.map(
                    (image, imageIndex) => (
                      <div
                        key={`${image.slice(
                          0,
                          30,
                        )}-${imageIndex}`}
                        className="relative overflow-hidden rounded-lg border border-cream"
                      >
                        <img
                          src={image}
                          alt={`${variant.color || "Variant"} ${variant.size || ""} image ${imageIndex + 1}`}
                          className="aspect-square w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              index,
                              imageIndex,
                            )
                          }
                          className="absolute bottom-2 left-2 right-2 rounded bg-white/95 px-2 py-1.5 text-xs font-medium text-red-700 shadow"
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-cream p-5 text-center">
                  <p className="text-xs text-secondary">
                    No variant images uploaded.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded bg-red-100 px-3 py-2 text-sm text-red-700"
              >
                Remove Variant
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-4 rounded border border-charcoal px-4 py-2 text-sm hover:bg-cream"
      >
        + Add Variant
      </button>
    </section>
  )
}