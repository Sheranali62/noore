"use client"

import {
  useMemo,
  useRef,
  useState,
} from "react"

type Variant = {
  id?: string
  color: string
  size: string
  sku: string
  price: string
  stock: string
  images: string[]
}

const MAX_IMAGE_SIZE =
  3 * 1024 * 1024

function fileToDataUrl(
  file: File,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader()

      reader.onload = () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          reject(
            new Error(
              "Unable to read selected image.",
            ),
          )
          return
        }

        resolve(
          reader.result,
        )
      }

      reader.onerror = () => {
        reject(
          new Error(
            `Unable to read ${file.name}`,
          ),
        )
      }

      reader.readAsDataURL(file)
    },
  )
}

export default function ProductVariantsForm({
  value,
  onChange,
}: {
  value: Variant[]
  onChange: (
    value: Variant[],
  ) => void
}) {
  const [uploading, setUploading] =
    useState<
      Record<number, boolean>
    >({})

  const inputRefs =
    useRef<
      Record<
        number,
        HTMLInputElement | null
      >
    >({})

  const totalStock = useMemo(
    () =>
      value.reduce(
        (
          sum,
          variant,
        ) => {
          const stock =
            Number(
              variant.stock,
            )

          return (
            sum +
            (Number.isFinite(
              stock,
            )
              ? stock
              : 0)
          )
        },
        0,
      ),
    [value],
  )

  const update = (
    index: number,
    patch: Partial<Variant>,
  ) => {
    onChange(
      value.map(
        (
          variant,
          variantIndex,
        ) =>
          variantIndex ===
          index
            ? {
                ...variant,
                ...patch,
              }
            : variant,
      ),
    )
  }

  const add = () => {
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
  }

  const remove = (
    index: number,
  ) => {
    onChange(
      value.filter(
        (
          _,
          variantIndex,
        ) =>
          variantIndex !==
          index,
      ),
    )
  }

  const removeImage = (
    variantIndex: number,
    imageIndex: number,
  ) => {
    const variant =
      value[
        variantIndex
      ]

    if (!variant) {
      return
    }

    update(
      variantIndex,
      {
        images:
          variant.images.filter(
            (
              _,
              currentIndex,
            ) =>
              currentIndex !==
              imageIndex,
          ),
      },
    )
  }

  /*
   * CUSTOM VARIANT IMAGE UPLOAD
   */
  const uploadImages = async (
    variantIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files ??
          [],
      )

    if (
      selectedFiles.length ===
      0
    ) {
      return
    }

    setUploading(
      (current) => ({
        ...current,
        [variantIndex]:
          true,
      }),
    )

    try {
      const validFiles: File[] =
        []

      for (const file of selectedFiles) {
        if (
          !file.type.startsWith(
            "image/",
          )
        ) {
          alert(
            `${file.name} is not an image file.`,
          )
          continue
        }

        if (
          file.size >
          MAX_IMAGE_SIZE
        ) {
          alert(
            `${file.name} is larger than 3 MB.`,
          )
          continue
        }

        validFiles.push(file)
      }

      if (
        validFiles.length ===
        0
      ) {
        return
      }

      const uploadedImages =
        await Promise.all(
          validFiles.map(
            (file) =>
              fileToDataUrl(
                file,
              ),
          ),
        )

      const variant =
        value[
          variantIndex
        ]

      if (!variant) {
        return
      }

      update(
        variantIndex,
        {
          images: [
            ...variant.images,
            ...uploadedImages,
          ],
        },
      )
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload variant images.",
      )
    } finally {
      setUploading(
        (current) => ({
          ...current,
          [variantIndex]:
            false,
        }),
      )

      const input =
        inputRefs.current[
          variantIndex
        ]

      if (input) {
        input.value = ""
      }
    }
  }

  return (
    <section className="mt-8 border-t border-cream pt-8">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Custom Variants
          </h2>

          <p className="mt-1 text-sm text-secondary">
            Add a separate SKU and stock
            quantity for every Color +
            Size combination.
          </p>
        </div>

        <div className="text-sm font-medium">
          Variant stock total:{" "}
          <span className="font-semibold">
            {totalStock}
          </span>
        </div>
      </div>

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {value.length ===
        0 && (
        <div className="rounded-lg border border-dashed border-cream p-6 text-sm text-secondary">
          No variants yet. Add variants
          for products that have
          different sizes or colors.
        </div>
      )}

      {/* ====================================================== */}
      {/* VARIANTS */}
      {/* ====================================================== */}

      <div className="space-y-5">
        {value.map(
          (
            variant,
            index,
          ) => (
            <div
              key={
                variant.id ||
                `variant-${index}`
              }
              className="rounded-xl border border-cream bg-cream/20 p-5"
            >
              {/* ============================================== */}
              {/* VARIANT DETAILS */}
              {/* ============================================== */}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Color *
                  </label>

                  <input
                    required
                    value={
                      variant.color
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        index,
                        {
                          color:
                            event
                              .target
                              .value,
                        },
                      )
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
                    value={
                      variant.size
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        index,
                        {
                          size:
                            event
                              .target
                              .value,
                        },
                      )
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
                    value={
                      variant.sku
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        index,
                        {
                          sku:
                            event
                              .target
                              .value
                              .toUpperCase(),
                        },
                      )
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
                    value={
                      variant.price
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        index,
                        {
                          price:
                            event
                              .target
                              .value,
                        },
                      )
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
                    value={
                      variant.stock
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        index,
                        {
                          stock:
                            event
                              .target
                              .value,
                        },
                      )
                    }
                    className="w-full rounded border border-cream bg-white px-3 py-2"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* ============================================== */}
              {/* VARIANT MEDIA */}
              {/* ============================================== */}

              <div className="mt-5 rounded-lg border border-cream bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Variant Images
                    </h3>

                    <p className="mt-1 text-xs text-secondary">
                      Upload images specifically
                      for this variant.
                      Maximum 3 MB per image.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={(
                        element,
                      ) => {
                        inputRefs.current[
                          index
                        ] =
                          element
                      }}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(
                        event,
                      ) =>
                        uploadImages(
                          index,
                          event,
                        )
                      }
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        inputRefs.current[
                          index
                        ]?.click()
                      }
                      disabled={
                        uploading[
                          index
                        ] === true
                      }
                      className="rounded bg-charcoal px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {uploading[
                        index
                      ]
                        ? "Uploading..."
                        : "Upload Variant Images"}
                    </button>
                  </div>
                </div>

                {/* VARIANT IMAGE PREVIEWS */}

                {variant.images
                  .length >
                0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {variant.images.map(
                      (
                        image,
                        imageIndex,
                      ) => (
                        <div
                          key={`${index}-${imageIndex}-${image.slice(
                            0,
                            20,
                          )}`}
                          className="relative overflow-hidden rounded-lg border border-cream"
                        >
                          <img
                            src={image}
                            alt={`${variant.color || "Variant"} image ${
                              imageIndex +
                              1
                            }`}
                            className="aspect-square w-full object-cover"
                          />

                          {imageIndex ===
                            0 && (
                            <span className="absolute left-2 top-2 rounded bg-charcoal px-2 py-1 text-[10px] font-medium text-white">
                              Main
                            </span>
                          )}

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
                  <div className="mt-5 rounded-lg border border-dashed border-cream p-5 text-center">
                    <p className="text-xs text-secondary">
                      No variant images
                      uploaded.
                    </p>
                  </div>
                )}
              </div>

              {/* ============================================== */}
              {/* REMOVE VARIANT */}
              {/* ============================================== */}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    remove(index)
                  }
                  className="rounded bg-red-100 px-4 py-2 text-sm text-red-700"
                >
                  Remove Variant
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {/* ====================================================== */}
      {/* ADD VARIANT */}
      {/* ====================================================== */}

      <button
        type="button"
        onClick={add}
        className="mt-5 rounded border border-charcoal px-4 py-2 text-sm hover:bg-cream"
      >
        + Add Custom Variant
      </button>
    </section>
  )
}