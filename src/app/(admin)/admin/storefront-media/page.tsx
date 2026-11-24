"use client"

import { useEffect, useMemo, useState } from "react"
import ImageUploadField from "@/components/admin/image-upload-field"

type Asset = { key: string; label: string; group: string; fallback: string }
const assets: Asset[] = [
  { key: "home:hero", label: "Homepage main hero", group: "Homepage", fallback: "Main homepage campaign image" },
  { key: "home:world:women", label: "Homepage Women image", group: "Homepage categories", fallback: "Women category card" },
  { key: "home:world:men", label: "Homepage Men image", group: "Homepage categories", fallback: "Men category card" },
  { key: "home:world:kids", label: "Homepage Kids image", group: "Homepage categories", fallback: "Kids category card" },
  { key: "home:category:unstitched", label: "Homepage Unstitched image", group: "Homepage categories", fallback: "Unstitched category card" },
  { key: "home:category:luxury", label: "Homepage Luxury image", group: "Homepage categories", fallback: "Luxury category card" },
  { key: "page:women:hero", label: "Women page main banner", group: "Department page banners", fallback: "Women landing hero" },
  { key: "page:men:hero", label: "Men page main banner", group: "Department page banners", fallback: "Men landing hero" },
  { key: "page:kids:hero", label: "Kids page main banner", group: "Department page banners", fallback: "Kids landing hero" },
  ...[
    ["women", ["Saree","Shalwar Kameez","2 Piece","3 Piece","Kurta","Kurtis","Suits","Lawn","Chiffon","Linen","Cambric","Formal Wear","Party Wear","Casual Wear","Pret","Unstitched","Dupattas","Shawls","Bottoms","New Arrivals","Sale"]],
    ["men", ["Shalwar Kameez","Kurta","2 Piece","3 Piece","Waistcoats","Prince Coats","Suits","Formal Wear","Casual Wear","Unstitched","Kameez","Shalwar","Trousers","Jackets","Festive Wear","New Arrivals","Sale"]],
    ["kids", ["Girls Shalwar Kameez","Girls 2 Piece","Girls 3 Piece","Girls Kurtis","Girls Festive Wear","Boys Shalwar Kameez","Boys Kurta","Boys Waistcoats","Boys 2 Piece","Girls Casual","Boys Casual","Formal","Festive","New Arrivals","Sale"]],
  ].flatMap(([department, names]) => (names as string[]).map(name => ({ key: `page:${department}:category:${name}`, label: name, group: `${String(department).toUpperCase()} category tiles`, fallback: `Automatic category image for ${name}` }))),
]

export default function StorefrontMediaPage() {
  const [media, setMedia] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState("All")
  const groups = useMemo(() => ["All", ...Array.from(new Set(assets.map(a => a.group)))], [])
  useEffect(() => { fetch("/api/admin/storefront-media", { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load image settings"); setMedia(d.media || {}) }).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  const save = async () => { setSaving(true); setError(""); setMessage(""); try { const r = await fetch("/api/admin/storefront-media", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ media }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Save failed"); setMedia(d.media); setMessage("All image changes saved. Refresh the storefront to view them.") } catch (e) { setError(e instanceof Error ? e.message : "Save failed") } finally { setSaving(false) } }
  const visible = filter === "All" ? assets : assets.filter(a => a.group === filter)
  return <div className="max-w-7xl pb-12 text-white"><header className="mb-8"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">NOORÉ / Storefront</p><h1 className="mt-2 font-editorial text-4xl text-[#e8c98e] md:text-5xl">Storefront Image Manager</h1><p className="mt-2 max-w-3xl text-sm text-white/60">Replace images across the homepage and department pages. Existing images remain in place until you save your changes.</p></header>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6ae72]/20 bg-[#171715] p-4"><div className="flex flex-wrap gap-2">{groups.map(g => <button key={g} onClick={() => setFilter(g)} className={`rounded-full border px-3 py-2 text-xs ${filter===g?"border-[#d6ae72] bg-[#d6ae72] text-black":"border-white/15 text-white/70"}`}>{g}</button>)}</div><button onClick={save} disabled={saving || loading} className="rounded-xl bg-[#d6ae72] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50">{saving?"Saving…":"Save all image changes"}</button></div>
    {loading ? <div className="rounded-2xl bg-[#171715] p-10 text-center">Loading image settings…</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(asset => <section key={asset.key} className="rounded-2xl border border-[#d6ae72]/20 bg-[#171715] p-4"><div className="mb-3"><p className="text-[9px] uppercase tracking-[.2em] text-[#d6ae72]">{asset.group}</p><h2 className="mt-1 font-medium">{asset.label}</h2><p className="mt-1 text-xs text-white/45">{asset.fallback}</p></div><ImageUploadField label="Image" value={media[asset.key] || ""} onChange={value => setMedia(current => ({...current,[asset.key]:value}))} />{media[asset.key] && <button onClick={() => setMedia(current => { const next={...current}; delete next[asset.key]; return next })} className="mt-3 text-xs text-red-300 underline">Use original default image</button>}</section>)}</div>}
    {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}{message && <p className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</p>}
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#171715] p-4 text-xs leading-6 text-white/55">Tip: Upload portrait images for category cards and wide landscape images for the main department banners. Changes affect only storefront presentation; products, prices, orders and checkout are not changed.</div>
  </div>
}
