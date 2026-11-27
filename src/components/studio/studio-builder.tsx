"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import ImageUploadField from "@/components/admin/image-upload-field"
import { ArrowDown, ArrowUp, Check, ChevronRight, Copy, ExternalLink, Eye, FilePlus2, Globe2, ImagePlus, Loader2, Plus, Save, Trash2, Undo2, UploadCloud } from "lucide-react"
import type { StudioBlock, StudioBlockType, StudioMediaAsset, StudioNavigationItem, StudioPage, StudioPageHistory, StudioPageVersion, StudioRedirect, StudioWorkspace } from "@/lib/studio-workspace"

type Tab = "pages" | "navigation" | "media" | "redirects" | "history" | "seo"
const blankVersion = (): StudioPageVersion => ({ title: "New page", seoTitle: "", seoDescription: "", canonical: "", ogImage: "", noIndex: false, sections: [] })
const blankBlock = (type: StudioBlockType): StudioBlock => ({
  id: crypto.randomUUID(), type, eyebrow: "", title: type === "hero" ? "Your new page" : "", body: "", image: "", buttonText: "", buttonUrl: "",
  backgroundColor: "#f7f6f2", textColor: "#30352e", align: "left", productCategory: "", productCount: 4, items: [],
})
const emptyWorkspace: StudioWorkspace = { seo: { title: "", description: "", keywords: "", canonical: "", ogImage: "", noIndex: false }, pages: [], navigation: [], media: [], redirects: [] }
const blockTypes: { type: StudioBlockType; label: string; hint: string }[] = [
  { type: "hero", label: "Hero banner", hint: "Large title, image and call to action" },
  { type: "rich-text", label: "Text section", hint: "Editorial heading and body copy" },
  { type: "image", label: "Image", hint: "Full-width editorial image" },
  { type: "image-text", label: "Image + text", hint: "Two-column image and story" },
  { type: "product-grid", label: "Product grid", hint: "Live products from your catalogue" },
  { type: "button", label: "Call to action", hint: "A focused button section" },
  { type: "faq", label: "FAQ", hint: "Expandable questions and answers" },
  { type: "spacer", label: "Spacer", hint: "Add breathing room between sections" },
]
const fieldClass = "mt-1.5 w-full rounded-lg border border-white/10 bg-[#10100f] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d6ae72]/60"
const labelClass = "block text-[10px] font-semibold uppercase tracking-[.13em] text-white/55"

export default function StudioBuilder() {
  const [tab, setTab] = useState<Tab>("pages")
  const [workspace, setWorkspace] = useState<StudioWorkspace>(emptyWorkspace)
  const [history, setHistory] = useState<StudioPageHistory[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [draft, setDraft] = useState<StudioPageVersion>(blankVersion())
  const [slug, setSlug] = useState("")
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [navLabel, setNavLabel] = useState("")
  const [navUrl, setNavUrl] = useState("")
  const [assetName, setAssetName] = useState("")
  const [assetUrl, setAssetUrl] = useState("")
  const [assetAlt, setAssetAlt] = useState("")
  const [assetFolder, setAssetFolder] = useState("General")
  const [redirectFrom, setRedirectFrom] = useState("")
  const [redirectTo, setRedirectTo] = useState("")
  const [redirectStatus, setRedirectStatus] = useState<301 | 302>(301)

  async function load() {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/admin/studio/workspace", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load Studio workspace")
      setWorkspace(data.workspace || emptyWorkspace)
      setHistory(data.history || [])
      const first = data.workspace?.pages?.[0]
      if (first) selectPage(first)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load Studio") }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  function selectPage(page: StudioPage) {
    setSelectedId(page.id); setSlug(page.slug); setDraft(structuredClone(page.draft)); setIsNew(false); setError(""); setNotice("")
  }
  function newPage() {
    setSelectedId(""); setSlug("new-page"); setDraft(blankVersion()); setIsNew(true); setTab("pages"); setError(""); setNotice("")
  }
  function updateDraft<K extends keyof StudioPageVersion>(key: K, value: StudioPageVersion[K]) {
    setDraft(current => ({ ...current, [key]: value }))
  }
  function updateBlock(id: string, patch: Partial<StudioBlock>) {
    setDraft(current => ({ ...current, sections: current.sections.map(block => block.id === id ? { ...block, ...patch } : block) }))
  }
  function moveBlock(id: string, direction: -1 | 1) {
    setDraft(current => {
      const sections = [...current.sections], index = sections.findIndex(item => item.id === id), next = index + direction
      if (index < 0 || next < 0 || next >= sections.length) return current
      ;[sections[index], sections[next]] = [sections[next], sections[index]]
      return { ...current, sections }
    })
  }
  function addBlock(type: StudioBlockType) {
    setDraft(current => ({ ...current, sections: [...current.sections, blankBlock(type)] }))
  }

  async function post(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("")
    try {
      const response = await fetch("/api/admin/studio/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Studio action failed")
      if (data.workspace) setWorkspace(data.workspace)
      if (data.history) setHistory(data.history)
      if (data.page) { setSelectedId(data.page.id); setSlug(data.page.slug); setDraft(data.page.draft); setIsNew(false) }
      setNotice(data.message || "Saved.")
      return data
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Studio action failed"); return null }
    finally { setBusy(false) }
  }
  async function savePage() {
    const result = await post({ action: "save-page", page: { id: selectedId || undefined, slug, draft } })
    if (result?.page) setWorkspace(result.workspace)
  }
  async function publishPage() {
    if (isNew || !selectedId) { const saved = await post({ action: "save-page", page: { slug, draft } }); if (!saved?.page) return; const result = await post({ action: "publish-page", pageId: saved.page.id }); if (result?.workspace) setWorkspace(result.workspace); return }
    await post({ action: "save-page", page: { id: selectedId, slug, draft } }).then(async saved => { if (saved?.page) await post({ action: "publish-page", pageId: saved.page.id }) })
  }
  async function saveGlobal() {
    await post({ action: "save-global", workspace: { seo: workspace.seo, navigation: workspace.navigation, media: workspace.media, redirects: workspace.redirects } })
  }
  function updateWorkspace<K extends keyof StudioWorkspace>(key: K, value: StudioWorkspace[K]) {
    setWorkspace(current => ({ ...current, [key]: value }))
  }
  function addNavigation() {
    const label = navLabel.trim(), url = navUrl.trim()
    if (!label || !url) { setError("Enter a menu label and destination."); return }
    updateWorkspace("navigation", [...workspace.navigation, { id: crypto.randomUUID(), label, url, enabled: true, sortOrder: workspace.navigation.length + 1 }])
    setNavLabel(""); setNavUrl("")
  }
  function addAsset() {
    if (!assetName.trim() || !assetUrl.trim() || !((assetUrl.startsWith("/") && !assetUrl.startsWith("//")) || assetUrl.startsWith("https://"))) { setError("Enter an asset name and a valid HTTPS or site-relative image URL."); return }
    const item: StudioMediaAsset = { id: crypto.randomUUID(), name: assetName.trim(), url: assetUrl.trim(), alt: assetAlt.trim(), folder: assetFolder.trim() || "General", createdAt: new Date().toISOString() }
    updateWorkspace("media", [item, ...workspace.media])
    setAssetName(""); setAssetUrl(""); setAssetAlt("")
  }
  function addRedirect() {
    if (!redirectFrom.startsWith("/") || redirectFrom.startsWith("//") || !redirectTo.trim()) { setError("Redirect source must start with / and destination must be a valid URL."); return }
    updateWorkspace("redirects", [...workspace.redirects, { id: crypto.randomUUID(), from: redirectFrom.trim(), to: redirectTo.trim(), status: redirectStatus, enabled: true }])
    setRedirectFrom(""); setRedirectTo("")
  }
  const activePage = workspace.pages.find(page => page.id === selectedId)
  const usage = useMemo(() => {
    const urls = workspace.pages.flatMap(page => [...page.draft.sections.map(block => block.image), ...(page.published?.sections.map(block => block.image) || []), page.draft.ogImage, page.published?.ogImage || ""])
    return (url: string) => urls.filter(value => value === url).length
  }, [workspace.pages])

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin" /> Loading complete page builder…</div>

  return <div className="space-y-5 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[9px] font-bold uppercase tracking-[.28em] text-[#d6ae72]">NOORÉ / Website Studio</p><h2 className="mt-2 font-editorial text-3xl text-white md:text-4xl">Website builder</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">Create custom storefront pages, compose sections, manage metadata and publish with revision history.</p></div>
      <div className="flex gap-2"><button onClick={() => void load()} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65">Refresh</button><button onClick={newPage} className="inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-4 py-2.5 text-xs font-bold text-[#17130e]"><FilePlus2 className="h-4 w-4" /> New page</button></div>
    </header>

    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {([{id:"pages",label:"Page builder",icon:FilePlus2},{id:"navigation",label:"Navigation",icon:Globe2},{id:"media",label:"Media library",icon:ImagePlus},{id:"redirects",label:"Redirects",icon:Undo2},{id:"history",label:"Revisions",icon:Copy},{id:"seo",label:"Site SEO",icon:Globe2}] as const).map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab===item.id?"bg-[#d6ae72] text-[#17130e]":"border border-white/10 text-white/55 hover:text-white"}`}><item.icon className="h-3.5 w-3.5" />{item.label}</button>)}
    </div>

    {tab === "pages" && <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-white/10 bg-[#151513] p-3">
        <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Your pages</p><span className="text-[10px] text-white/35">{workspace.pages.length}</span></div>
        {workspace.pages.length === 0 && <p className="py-5 text-xs leading-5 text-white/35">No custom pages yet. Create your first landing page.</p>}
        <div className="space-y-1">{workspace.pages.map(page => <button key={page.id} onClick={() => selectPage(page)} className={`w-full rounded-lg p-3 text-left transition ${selectedId===page.id?"bg-[#d6ae72]/15 ring-1 ring-[#d6ae72]/30":"hover:bg-white/5"}`}><span className="block truncate text-xs font-semibold text-white/85">{page.draft.title}</span><span className="mt-1 block truncate text-[10px] text-white/35">/pages/{page.slug}</span><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] ${page.published?"bg-emerald-400/10 text-emerald-200":"bg-amber-300/10 text-amber-200"}`}>{page.published?(page.draft.title===page.published.title && page.draft.sections.length===page.published.sections.length?"Published":"Published · draft changes"):"Draft"}</span></button>)}</div>
        {selectedId && activePage && <div className="mt-4 border-t border-white/10 pt-3"><button onClick={() => { if (confirm("Delete this custom page? Its published URL will stop working.")) void post({action:"delete-page",pageId:selectedId}) }} className="inline-flex items-center gap-2 px-2 py-2 text-[10px] text-red-300"><Trash2 className="h-3 w-3" /> Delete page</button></div>}
      </aside>

      <section className="min-w-0 space-y-5">
        <div className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Page details</p><h3 className="mt-1 text-base font-semibold">{isNew?"Create a page":draft.title}</h3></div><div className="flex flex-wrap gap-2">{!isNew && <a href={`/studio/preview/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[10px] text-white/70"><Eye className="h-3 w-3" /> Preview draft</a>}{activePage?.published && <a href={`/pages/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/25 px-3 py-2 text-[10px] text-emerald-200"><ExternalLink className="h-3 w-3" /> Live page</a>}</div></div>
          <div className="grid gap-4 md:grid-cols-2"><label className={labelClass}>Page title<input className={fieldClass} value={draft.title} onChange={e=>updateDraft("title",e.target.value)} maxLength={160}/></label><label className={labelClass}>URL slug<div className="mt-1.5 flex rounded-lg border border-white/10 bg-[#10100f]"><span className="border-r border-white/10 px-3 py-2.5 text-xs text-white/35">/pages/</span><input className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-"))}/></div></label></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-white/35">Save creates a private draft. Publish makes this page publicly accessible.</p><div className="flex gap-2"><button onClick={()=>void savePage()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/75 disabled:opacity-40"><Save className="h-3.5 w-3.5"/> Save draft</button><button onClick={()=>void publishPage()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-4 py-2.5 text-xs font-bold text-[#17130e] disabled:opacity-40"><Check className="h-3.5 w-3.5"/> Publish page</button></div></div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Search visibility</p><h3 className="mt-1 text-base font-semibold">SEO & social sharing</h3></div><label className="flex items-center gap-2 text-[10px] text-white/55"><input type="checkbox" checked={draft.noIndex} onChange={e=>updateDraft("noIndex",e.target.checked)}/> Hide from search</label></div>
          <div className="grid gap-4 md:grid-cols-2"><label className={labelClass}>SEO title<input className={fieldClass} value={draft.seoTitle} onChange={e=>updateDraft("seoTitle",e.target.value)} placeholder={draft.title}/><span className="mt-1 block text-[9px] text-white/30">{draft.seoTitle.length}/180</span></label><label className={labelClass}>Canonical URL<input className={fieldClass} value={draft.canonical} onChange={e=>updateDraft("canonical",e.target.value)} placeholder="Optional absolute or site-relative URL"/></label><label className={`${labelClass} md:col-span-2`}>Meta description<textarea rows={2} className={fieldClass} value={draft.seoDescription} onChange={e=>updateDraft("seoDescription",e.target.value)} maxLength={320}/><span className="mt-1 block text-[9px] text-white/30">{draft.seoDescription.length}/320</span></label><label className={`${labelClass} md:col-span-2`}>Social share image URL<input className={fieldClass} value={draft.ogImage} onChange={e=>updateDraft("ogImage",e.target.value)} placeholder="Paste a URL from your media library"/></label></div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Page structure</p><h3 className="mt-1 text-base font-semibold">Sections & content blocks</h3></div><span className="text-[10px] text-white/35">{draft.sections.length} / 40 blocks</span></div>
          {draft.sections.length===0 && <div className="rounded-lg border border-dashed border-white/15 px-4 py-10 text-center"><p className="text-sm text-white/60">Your page is empty</p><p className="mt-2 text-xs text-white/35">Add a hero, text, image or product section below.</p></div>}
          <div className="space-y-3">{draft.sections.map((block,index)=><article key={block.id} className="rounded-xl border border-white/10 bg-[#10100f] p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#d6ae72]/15 text-[10px] text-[#e8c98e]">{index+1}</span><div><p className="text-xs font-semibold text-white/85">{blockTypes.find(x=>x.type===block.type)?.label}</p><p className="text-[9px] text-white/35">{blockTypes.find(x=>x.type===block.type)?.hint}</p></div></div><div className="flex gap-1"><button aria-label="Move section up" disabled={index===0} onClick={()=>moveBlock(block.id,-1)} className="rounded p-2 text-white/45 hover:bg-white/10 disabled:opacity-20"><ArrowUp className="h-3.5 w-3.5"/></button><button aria-label="Move section down" disabled={index===draft.sections.length-1} onClick={()=>moveBlock(block.id,1)} className="rounded p-2 text-white/45 hover:bg-white/10 disabled:opacity-20"><ArrowDown className="h-3.5 w-3.5"/></button><button aria-label="Remove section" onClick={()=>updateDraft("sections",draft.sections.filter(item=>item.id!==block.id))} className="rounded p-2 text-red-300/70 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5"/></button></div></div>
            {block.type!=="spacer" && <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>Eyebrow<input className={fieldClass} value={block.eyebrow} onChange={e=>updateBlock(block.id,{eyebrow:e.target.value})}/></label>
              <label className={labelClass}>Heading<input className={fieldClass} value={block.title} onChange={e=>updateBlock(block.id,{title:e.target.value})}/></label>
              {["hero","rich-text","image-text","button"].includes(block.type) && <label className={`${labelClass} md:col-span-2`}>Body<textarea rows={3} className={fieldClass} value={block.body} onChange={e=>updateBlock(block.id,{body:e.target.value})}/></label>}
              {["hero","image","image-text"].includes(block.type) && <label className={`${labelClass} md:col-span-2`}>Image URL<select className={fieldClass} value={block.image} onChange={e=>updateBlock(block.id,{image:e.target.value})}><option value="">No image</option>{workspace.media.map(asset=><option key={asset.id} value={asset.url}>{asset.name} · {asset.folder}</option>)}</select><input className={fieldClass} value={block.image} onChange={e=>updateBlock(block.id,{image:e.target.value})} placeholder="Or paste an HTTPS image URL"/></label>}
              {block.type==="product-grid" && <><label className={labelClass}>Product category (optional)<input className={fieldClass} value={block.productCategory} onChange={e=>updateBlock(block.id,{productCategory:e.target.value})} placeholder="e.g. Women"/></label><label className={labelClass}>Products to show<input type="number" min={1} max={12} className={fieldClass} value={block.productCount} onChange={e=>updateBlock(block.id,{productCount:Number(e.target.value)})}/></label></>}
              {["hero","image-text","button"].includes(block.type) && <><label className={labelClass}>Button label<input className={fieldClass} value={block.buttonText} onChange={e=>updateBlock(block.id,{buttonText:e.target.value})}/></label><label className={labelClass}>Button URL<input className={fieldClass} value={block.buttonUrl} onChange={e=>updateBlock(block.id,{buttonUrl:e.target.value})} placeholder="/products"/></label></>}
              {block.type==="faq" && <div className="md:col-span-2"><p className={labelClass}>Questions & answers</p>{block.items.map((item,i)=><div key={i} className="mt-2 grid gap-2 rounded-lg border border-white/10 p-3"><input className={fieldClass} value={item.question} placeholder="Question" onChange={e=>updateBlock(block.id,{items:block.items.map((x,j)=>j===i?{...x,question:e.target.value}:x)})}/><textarea className={fieldClass} value={item.answer} placeholder="Answer" rows={2} onChange={e=>updateBlock(block.id,{items:block.items.map((x,j)=>j===i?{...x,answer:e.target.value}:x)})}/><button onClick={()=>updateBlock(block.id,{items:block.items.filter((_,j)=>j!==i)})} className="justify-self-start text-[10px] text-red-300">Remove question</button></div>)}<button onClick={()=>updateBlock(block.id,{items:[...block.items,{question:"",answer:""}]})} className="mt-2 text-[10px] font-semibold text-[#e8c98e]">+ Add question</button></div>}
              <label className={labelClass}>Section background<input type="color" className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-[#10100f] p-1" value={block.backgroundColor} onChange={e=>updateBlock(block.id,{backgroundColor:e.target.value})}/></label><label className={labelClass}>Text color<input type="color" className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-[#10100f] p-1" value={block.textColor} onChange={e=>updateBlock(block.id,{textColor:e.target.value})}/></label>
            </div>}
          </article>)}</div>
          <div className="mt-4"><p className={labelClass}>Add a section</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{blockTypes.map(item=><button key={item.type} disabled={draft.sections.length>=40} onClick={()=>addBlock(item.type)} className="rounded-lg border border-white/10 px-3 py-3 text-left transition hover:border-[#d6ae72]/40 hover:bg-[#d6ae72]/[.06] disabled:opacity-30"><span className="block text-[10px] font-semibold text-white/80">{item.label}</span><span className="mt-1 block text-[9px] leading-4 text-white/35">{item.hint}</span></button>)}</div></div>
        </div>
      </section>
    </div>}

    {tab === "navigation" && <section className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-6"><div className="mb-5"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Storefront navigation</p><h3 className="mt-1 text-lg font-semibold">Custom menu links</h3><p className="mt-1 text-xs text-white/40">These links appear in a supplemental navigation row beneath your existing NOORÉ header.</p></div><div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]"><label className={labelClass}>Label<input className={fieldClass} value={navLabel} onChange={e=>setNavLabel(e.target.value)} placeholder="About us"/></label><label className={labelClass}>Destination<input className={fieldClass} value={navUrl} onChange={e=>setNavUrl(e.target.value)} placeholder="/pages/about-us"/></label><button onClick={addNavigation} className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#d6ae72] px-4 py-3 text-xs font-bold text-[#17130e]"><Plus className="h-4 w-4"/> Add link</button></div><div className="mt-5 space-y-2">{workspace.navigation.map((item,index)=><div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#10100f] p-3"><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{item.label}</span><span className="block truncate text-[10px] text-white/35">{item.url}</span></span><label className="flex items-center gap-2 text-[10px] text-white/55"><input type="checkbox" checked={item.enabled} onChange={e=>updateWorkspace("navigation",workspace.navigation.map(x=>x.id===item.id?{...x,enabled:e.target.checked}:x))}/> Visible</label><button onClick={()=>updateWorkspace("navigation",workspace.navigation.filter(x=>x.id!==item.id))} className="rounded p-2 text-red-300"><Trash2 className="h-3.5 w-3.5"/></button><span className="text-[10px] text-white/30">#{index+1}</span></div>)}</div><button onClick={()=>void saveGlobal()} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-5 py-3 text-xs font-bold text-[#17130e]"><Save className="h-4 w-4"/> Save navigation</button></section>}

    {tab === "media" && <section className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-6"><div className="mb-5"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Asset library</p><h3 className="mt-1 text-lg font-semibold">Media assets</h3><p className="mt-1 text-xs text-white/40">Organize image URLs, alt text and folders. Usage counts include draft and published Studio pages.</p></div><div className="grid gap-3 md:grid-cols-2"><label className={labelClass}>Asset name<input className={fieldClass} value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="Spring campaign"/></label><div><p className={labelClass}>Image URL or upload</p><div className="mt-1.5"><ImageUploadField label="Studio media asset" value={assetUrl} onChange={setAssetUrl}/></div></div><label className={labelClass}>Alt text<input className={fieldClass} value={assetAlt} onChange={e=>setAssetAlt(e.target.value)} placeholder="Describe the image"/></label><label className={labelClass}>Folder<input className={fieldClass} value={assetFolder} onChange={e=>setAssetFolder(e.target.value)} placeholder="Campaigns"/></label></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={addAsset} className="inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-4 py-2.5 text-xs font-bold text-[#17130e]"><Plus className="h-4 w-4"/> Add asset</button><Link href="/admin/storefront-media" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs text-white/70"><UploadCloud className="h-4 w-4"/> Open upload manager</Link><button onClick={()=>void saveGlobal()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs text-white/70"><Save className="h-4 w-4"/> Save library</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{workspace.media.map(asset=><article key={asset.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#10100f]"><img src={asset.url} alt={asset.alt} className="h-40 w-full object-cover" /><div className="p-3"><p className="text-xs font-semibold">{asset.name}</p><p className="mt-1 text-[10px] text-white/35">{asset.folder} · Used {usage(asset.url)} times</p><p className="mt-1 truncate text-[9px] text-white/25">{asset.url}</p><div className="mt-3 flex justify-between"><button onClick={()=>void navigator.clipboard?.writeText(asset.url)} className="text-[10px] text-[#e8c98e]">Copy URL</button><button onClick={()=>updateWorkspace("media",workspace.media.filter(x=>x.id!==asset.id))} className="text-[10px] text-red-300">Remove</button></div></div></article>)}</div></section>}

    {tab === "redirects" && <section className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-6"><div className="mb-5"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">URL management</p><h3 className="mt-1 text-lg font-semibold">Redirect rules</h3><p className="mt-1 text-xs leading-5 text-white/40">Manage permanent (301) and temporary (302) redirects for legacy or custom URLs that do not collide with existing application routes.</p></div><div className="grid gap-3 md:grid-cols-[1fr_1fr_110px_auto]"><label className={labelClass}>From<input className={fieldClass} value={redirectFrom} onChange={e=>setRedirectFrom(e.target.value)} placeholder="/old-page"/></label><label className={labelClass}>To<input className={fieldClass} value={redirectTo} onChange={e=>setRedirectTo(e.target.value)} placeholder="/pages/new-page"/></label><label className={labelClass}>Type<select className={fieldClass} value={redirectStatus} onChange={e=>setRedirectStatus(Number(e.target.value) as 301|302)}><option value={301}>301</option><option value={302}>302</option></select></label><button onClick={addRedirect} className="mt-auto rounded-lg bg-[#d6ae72] px-4 py-3 text-xs font-bold text-[#17130e]">Add rule</button></div><div className="mt-5 space-y-2">{workspace.redirects.map(rule=><div key={rule.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#10100f] p-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{rule.from} <ChevronRight className="inline h-3 w-3"/> {rule.to}</p><p className="mt-1 text-[9px] text-white/35">{rule.status} redirect</p></div><label className="flex items-center gap-2 text-[10px] text-white/55"><input type="checkbox" checked={rule.enabled} onChange={e=>updateWorkspace("redirects",workspace.redirects.map(x=>x.id===rule.id?{...x,enabled:e.target.checked}:x))}/> Active</label><button onClick={()=>updateWorkspace("redirects",workspace.redirects.filter(x=>x.id!==rule.id))} className="text-red-300"><Trash2 className="h-3.5 w-3.5"/></button></div>)}</div><button onClick={()=>void saveGlobal()} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-5 py-3 text-xs font-bold text-[#17130e]"><Save className="h-4 w-4"/> Save redirect rules</button></section>}

    {tab === "seo" && <section className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-6"><div className="mb-5"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Search appearance</p><h3 className="mt-1 text-lg font-semibold">Global website SEO</h3><p className="mt-1 text-xs leading-5 text-white/40">These defaults apply to the site shell. Individual custom pages can override title, description, canonical URL, social image and indexing.</p></div><div className="grid gap-4 md:grid-cols-2"><label className={labelClass}>Default site title<input className={fieldClass} value={workspace.seo.title} onChange={e=>updateWorkspace("seo",{...workspace.seo,title:e.target.value})} placeholder="NOORÉ — Premium Pakistani Fashion"/></label><label className={labelClass}>Canonical site URL<input className={fieldClass} value={workspace.seo.canonical} onChange={e=>updateWorkspace("seo",{...workspace.seo,canonical:e.target.value})} placeholder="https://noore-nine.vercel.app"/></label><label className={`${labelClass} md:col-span-2`}>Default meta description<textarea rows={3} className={fieldClass} value={workspace.seo.description} onChange={e=>updateWorkspace("seo",{...workspace.seo,description:e.target.value})} maxLength={320}/><span className="mt-1 block text-[9px] text-white/30">{workspace.seo.description.length}/320</span></label><label className={labelClass}>Keywords<input className={fieldClass} value={workspace.seo.keywords} onChange={e=>updateWorkspace("seo",{...workspace.seo,keywords:e.target.value})} placeholder="Pakistani fashion, premium clothing…"/></label><label className={labelClass}>Default social share image<input className={fieldClass} value={workspace.seo.ogImage} onChange={e=>updateWorkspace("seo",{...workspace.seo,ogImage:e.target.value})} placeholder="https://…"/></label><label className="flex items-center gap-2 text-xs text-white/60 md:col-span-2"><input type="checkbox" checked={workspace.seo.noIndex} onChange={e=>updateWorkspace("seo",{...workspace.seo,noIndex:e.target.checked})}/> Ask search engines not to index the website</label></div><button onClick={()=>void saveGlobal()} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-5 py-3 text-xs font-bold text-[#17130e]"><Save className="h-4 w-4"/> Save global SEO settings</button></section>}

    {tab === "history" && <section className="rounded-xl border border-white/10 bg-[#151513] p-4 md:p-6"><div className="mb-5"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d6ae72]">Revision history</p><h3 className="mt-1 text-lg font-semibold">Published page revisions</h3><p className="mt-1 text-xs text-white/40">When a published page is replaced, its previous version is stored here. Restore sends it to drafts first; publishing remains a separate action.</p></div>{history.length===0?<p className="rounded-lg border border-dashed border-white/15 p-8 text-center text-xs text-white/35">No page revisions yet. Publish an update to create a restore point.</p>:<div className="space-y-2">{history.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#10100f] p-3"><div><p className="text-xs font-semibold">{item.pageTitle}</p><p className="mt-1 text-[10px] text-white/35">{new Date(item.createdAt).toLocaleString()} · {item.snapshot.sections.length} sections</p></div><button onClick={()=>void post({action:"restore-page",versionId:item.id})} disabled={busy} className="rounded-lg border border-[#d6ae72]/30 px-3 py-2 text-[10px] font-semibold text-[#e8c98e]">Restore to draft</button></div>)}</div>}</section>}

    {error && <p role="alert" className="rounded-lg border border-red-400/25 bg-red-950/25 p-3 text-xs text-red-200">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-3 text-xs text-emerald-200"><Check className="h-4 w-4"/>{notice}</p>}
    {busy && <p className="flex items-center gap-2 text-[10px] text-white/35"><Loader2 className="h-3 w-3 animate-spin"/> Working…</p>}
  </div>
}
