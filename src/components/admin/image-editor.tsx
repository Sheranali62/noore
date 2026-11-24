"use client"

import { useEffect, useRef, useState } from "react"

type Props = { src: string; onSave: (url: string) => void; onClose: () => void }
type Ratio = "original" | "1:1" | "4:5" | "3:2" | "16:9"
const getRatio = (r: Ratio, original: number) => r === "original" ? original : Number(r.split(":")[0]) / Number(r.split(":")[1])

export default function ImageEditor({ src, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [flip, setFlip] = useState(false)
  const [ratio, setRatio] = useState<Ratio>("original")
  const [cropSize, setCropSize] = useState(100)
  const [cropX, setCropX] = useState(50)
  const [cropY, setCropY] = useState(50)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const draw = () => {
    const img = imageRef.current, canvas = canvasRef.current
    if (!img || !canvas) return
    const rotated = document.createElement("canvas")
    const swap = Math.abs(rotation) % 180 === 90
    rotated.width = swap ? img.height : img.width
    rotated.height = swap ? img.width : img.height
    const rc = rotated.getContext("2d")
    if (!rc) return
    rc.translate(rotated.width / 2, rotated.height / 2)
    rc.rotate(rotation * Math.PI / 180)
    rc.scale(flip ? -1 : 1, 1)
    rc.drawImage(img, -img.width / 2, -img.height / 2)
    const targetRatio = getRatio(ratio, rotated.width / rotated.height)
    let baseW = rotated.width, baseH = baseW / targetRatio
    if (baseH > rotated.height) { baseH = rotated.height; baseW = baseH * targetRatio }
    const cw = baseW * cropSize / 100, ch = baseH * cropSize / 100
    const sx = (rotated.width - cw) * cropX / 100
    const sy = (rotated.height - ch) * cropY / 100
    canvas.width = 1200
    canvas.height = Math.max(1, Math.round(1200 / targetRatio))
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    ctx.drawImage(rotated, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => { imageRef.current = img; draw() }
    img.onerror = () => setError("This image cannot be edited here. Upload it to your image library first.")
    img.src = src
  }, [src])
  useEffect(() => { draw() }, [brightness, contrast, saturation, rotation, flip, ratio, cropSize, cropX, cropY])

  const reset = () => {
    setBrightness(100); setContrast(100); setSaturation(100)
    setRotation(0); setFlip(false); setRatio("original")
    setCropSize(100); setCropX(50); setCropY(50)
  }
  const save = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setBusy(true); setError("")
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not export image")), "image/jpeg", .92))
      const form = new FormData()
      form.set("file", blob, "noore-edited-image.jpg")
      const response = await fetch("/api/admin/images/upload", { method: "POST", body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Upload failed")
      onSave(data.url); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save image") }
    finally { setBusy(false) }
  }
  const slider = (label: string, value: number, set: (n: number) => void, min = 0, max = 200) => (
    <label className="block text-xs text-white/75">{label}<span className="float-right text-[#e8c98e]">{value}%</span>
      <input className="mt-2 w-full accent-[#d6ae72]" type="range" min={min} max={max} value={value} onChange={e => set(Number(e.target.value))} />
    </label>
  )

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
    <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#d6ae72]/30 bg-[#111110] p-5 text-white shadow-2xl">
      <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-[#d6ae72]">NOORÉ Studio</p><h2 className="mt-1 text-xl font-semibold">Crop & adjust image</h2></div><button onClick={onClose} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Close</button></div>
      <div className="mt-4 grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="flex min-h-64 items-center justify-center rounded-xl bg-[#080808] p-3"><canvas ref={canvasRef} className="max-h-[62vh] max-w-full object-contain" /></div>
        <div className="space-y-5">
          <section className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-[#e8c98e]">Crop shape</p><div className="grid grid-cols-3 gap-2">
            {(["original", "1:1", "4:5", "3:2", "16:9"] as Ratio[]).map(v => <button key={v} onClick={() => { setRatio(v); setCropSize(100); setCropX(50); setCropY(50) }} className={`rounded-lg border px-2 py-2 text-xs ${ratio === v ? "border-[#d6ae72] bg-[#d6ae72]/15 text-[#e8c98e]" : "border-white/15 text-white/70"}`}>{v === "original" ? "Original" : v}</button>)}
          </div><p className="text-[10px] leading-4 text-white/45">Choose a shape for homepage banners, category tiles or portrait campaign images.</p></section>
          <section className="space-y-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#e8c98e]">Crop position & size</p>{slider("Crop size", cropSize, setCropSize, 40, 100)}{slider("Horizontal position", cropX, setCropX)}{slider("Vertical position", cropY, setCropY)}</section>
          <section className="space-y-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#e8c98e]">Image adjustments</p>{slider("Brightness", brightness, setBrightness)}{slider("Contrast", contrast, setContrast)}{slider("Saturation", saturation, setSaturation)}</section>
          <div className="flex flex-wrap gap-2"><button onClick={() => setRotation(v => (v + 90) % 360)} className="rounded-lg border border-[#d6ae72]/30 px-3 py-2 text-xs">Rotate 90°</button><button onClick={() => setFlip(v => !v)} className="rounded-lg border border-[#d6ae72]/30 px-3 py-2 text-xs">Flip</button><button onClick={reset} className="rounded-lg border border-white/15 px-3 py-2 text-xs">Reset all</button></div>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <button disabled={busy || !imageRef.current} onClick={save} className="w-full rounded-xl bg-[#d6ae72] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#17110a] disabled:opacity-50">{busy ? "Saving edited copy…" : "Save edited copy"}</button>
          <p className="text-[10px] text-white/40">Your original image stays unchanged. The edited copy is saved to your image library.</p>
        </div>
      </div>
    </div>
  </div>
}
