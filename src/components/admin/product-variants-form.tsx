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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read image"))
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export default function ProductVariantsForm({ value, onChange }: { value: Variant[]; onChange: (value: Variant[]) => void }) {
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const totalStock = useMemo(
    () => value.reduce((sum, variant) => sum + (Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0), 0),
    [value],
  )

  const update = (index: number, patch: Partial<Variant>) => onChange(value.map((variant, i) => i === index ? { ...variant, ...patch } : variant))
  const add = () => onChange([...value, { color: "", size: "", sku: "", price: "", stock: "", images: [] }])
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index))

  const uploadVariantImages = async (index: number, files: File[]) => {
    setUploading(current => ({ ...current, [index]: true }))

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
      update(index, { images: [...value[index].images, ...urls] })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to upload variant images")
    } finally {
      setUploading(current => ({ ...current, [index]: false }))
      if (inputRefs.current[index]) inputRefs.current[index]!.value = ""
    }
  }

  return (
    <section className="mt-8 border-t border-cream pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Variants</h2>
          <p className="mt-1 text-sm text-secondary">Add a separate SKU and stock quantity for every Color + Size combination.</p>
        </div>
        <div className="text-sm font-medium">Variant stock total: <span className="font-semibold">{totalStock}</span></div>
      </div>

      {!value.length && <div className="rounded-lg border border-dashed border-cream p-6 text-sm text-secondary">No variants yet. Add variants for products with different sizes or colors.</div>}

      <div className="space-y-4">
        {value.map((variant, index) => (
          <div key={variant.id || index} className="rounded-lg border border-cream bg-cream/20 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <Field label="Color *" value={variant.color} onChange={v => update(index, { color: v })} required placeholder="Black" />
              <Field label="Size *" value={variant.size} onChange={v => update(index, { size: v })} required placeholder="Medium" />
              <Field label="Variant SKU *" value={variant.sku} onChange={v => update(index, { sku: v.toUpperCase() })} required placeholder="PROD-BLK-M" />
              <Field label="Price Override" type="number" min="0" step="0.01" value={variant.price} onChange={v => update(index, { price: v })} placeholder="Optional" />
              <Field label="Stock *" type="number" min="0" value={variant.stock} onChange={v => update(index, { stock: v })} required placeholder="10" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={element => { inputRefs.current[index] = element }}
                type="file"
                accept="image/*"
                multiple
                onChange={e => uploadVariantImages(index, Array.from(e.target.files || []))}
                className="hidden"
              />
              <button type="button" onClick={() => inputRefs.current[index]?.click()} disabled={uploading[index]} className="rounded border border-charcoal bg-white px-4 py-2 text-sm disabled:opacity-50">
                {uploading[index] ? "Uploading..." : "Upload Variant Images"}
              </button>
              <button type="button" onClick={() => remove(index)} className="rounded bg-red-100 px-4 py-2 text-sm text-red-700">Remove Variant</button>
            </div>

            {variant.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {variant.images.map((image, imageIndex) => (
                  <div key={`${imageIndex}-${image.slice(0, 15)}`} className="relative overflow-hidden rounded border border-cream bg-white">
                    <img src={image} alt={`Variant ${index + 1} image ${imageIndex + 1}`} className="aspect-square w-full object-cover" />
                    <button type="button" onClick={() => update(index, { images: variant.images.filter((_, i) => i !== imageIndex) })} className="absolute inset-x-1 bottom-1 rounded bg-white/95 px-1 py-1 text-[10px] font-medium text-red-700">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="mt-4 rounded border border-charcoal px-4 py-2 text-sm hover:bg-cream">+ Add Variant</button>
    </section>
  )
}

function Field({ label, value, onChange, type = "text", placeholder, required = false, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; step?: string }) {
  return <label className="block text-xs font-medium">{label}<input required={required} type={type} min={min} step={step} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded border border-cream bg-white px-3 py-2 text-sm" /></label>
}
