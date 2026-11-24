"use client"

import { useRef, useState } from "react"
import ImageEditor from "@/components/admin/image-editor"

export default function ImageUploadField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const upload = async (file?: File) => {
    if (!file) return
    setBusy(true); setError("")
    try {
      const body = new FormData()
      body.set("file", file)
      const response = await fetch("/api/admin/images/upload", { method: "POST", body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Upload failed.")
      onChange(data.url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload image.")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }
  return <div className="space-y-2">
    <input value={value} onChange={event => onChange(event.target.value)} placeholder="Image URL or upload a file" className="w-full rounded-xl border border-[#d6ae72]/20 bg-[#111110] px-4 py-3 outline-none focus:border-charcoal" required={label === "Desktop Image URL"} />
    <div className="flex flex-wrap items-center gap-3">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={event => upload(event.target.files?.[0])} />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="rounded-lg border border-charcoal/15 bg-[#171715] px-4 py-2 text-xs font-semibold disabled:opacity-50">{busy ? "Uploading…" : "Upload from computer"}</button>
      <span className="text-[11px] text-white/55">JPG, PNG, WebP or AVIF · max 8 MB</span>
    </div>
    {value && <><img src={value} alt={label + " preview"} className="mt-2 aspect-[16/7] max-h-36 w-full rounded-lg border border-[#d6ae72]/20 object-cover" /><button type="button" onClick={() => setEditorOpen(true)} className="rounded-lg border border-[#d6ae72]/30 px-3 py-2 text-xs font-semibold text-[#e8c98e]">Edit this image</button></>}
    {editorOpen && value && <ImageEditor src={value} onSave={onChange} onClose={() => setEditorOpen(false)} /> }
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>
}
