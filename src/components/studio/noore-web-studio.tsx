"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight, Check, Eye, Globe2, History, LayoutTemplate,
  Loader2, Monitor, Palette, RotateCcw, Save, Smartphone, Sparkles,
  Type, WandSparkles, X,
} from "lucide-react"
import { DEFAULT_HOMEPAGE_DESIGN, type HomepageDesign } from "@/lib/homepage-design"
import StudioBuilder from "@/components/studio/studio-builder"

type StudioTab = "design" | "content" | "pages" | "seo" | "history"
type Field = { key: keyof HomepageDesign; label: string; group: string; multiline?: boolean }

const fields: Field[] = [
  { key: "announcementMessage", label: "Announcement message", group: "Header" },
  { key: "heroEyebrow", label: "Eyebrow", group: "Hero" },
  { key: "heroKicker", label: "Kicker", group: "Hero" },
  { key: "heroHeading", label: "Main heading", group: "Hero" },
  { key: "heroDescription", label: "Description", group: "Hero", multiline: true },
  { key: "primaryButtonText", label: "Primary button", group: "Hero" },
  { key: "primaryButtonUrl", label: "Primary button URL", group: "Hero" },
  { key: "secondaryButtonText", label: "Secondary button", group: "Hero" },
  { key: "secondaryButtonUrl", label: "Secondary button URL", group: "Hero" },
  { key: "collectionsEyebrow", label: "Eyebrow", group: "Collections" },
  { key: "collectionsHeading", label: "Heading", group: "Collections" },
  { key: "favouritesEyebrow", label: "Eyebrow", group: "Customer favourites" },
  { key: "favouritesHeading", label: "Heading", group: "Customer favourites" },
  { key: "categoriesEyebrow", label: "Eyebrow", group: "Categories" },
  { key: "categoriesHeading", label: "Heading", group: "Categories" },
  { key: "arrivalsEyebrow", label: "Eyebrow", group: "New arrivals" },
  { key: "arrivalsHeading", label: "Heading", group: "New arrivals" },
  { key: "luxuryEyebrow", label: "Eyebrow", group: "Luxury edit" },
  { key: "luxuryHeading", label: "Heading", group: "Luxury edit" },
  { key: "luxuryDescription", label: "Description", group: "Luxury edit", multiline: true },
  { key: "luxuryButtonText", label: "Button text", group: "Luxury edit" },
  { key: "luxuryButtonUrl", label: "Button URL", group: "Luxury edit" },
  { key: "saleEyebrow", label: "Eyebrow", group: "Sale" },
  { key: "saleHeading", label: "Heading", group: "Sale" },
  { key: "saleDescription", label: "Description", group: "Sale", multiline: true },
  { key: "brandEyebrow", label: "Eyebrow", group: "Brand statement" },
  { key: "brandHeading", label: "Heading", group: "Brand statement" },
  { key: "brandDescription", label: "Description", group: "Brand statement", multiline: true },
  { key: "brandButtonText", label: "Button text", group: "Brand statement" },
  { key: "brandButtonUrl", label: "Button URL", group: "Brand statement" },
  { key: "newsletterEyebrow", label: "Eyebrow", group: "Newsletter" },
  { key: "newsletterHeading", label: "Heading", group: "Newsletter" },
  { key: "newsletterDescription", label: "Description", group: "Newsletter", multiline: true },
  { key: "footerDescription", label: "Footer description", group: "Footer", multiline: true },
]

const colors: { key: keyof HomepageDesign; label: string }[] = [
  { key: "backgroundColor", label: "Page background" },
  { key: "textColor", label: "Main text" },
  { key: "accentColor", label: "Accent" },
  { key: "buttonColor", label: "Buttons" },
  { key: "buttonTextColor", label: "Button text" },
  { key: "surfaceColor", label: "Surfaces" },
  { key: "mutedTextColor", label: "Muted text" },
  { key: "borderColor", label: "Borders" },
  { key: "headerColor", label: "Header" },
  { key: "headerTextColor", label: "Header text" },
  { key: "footerColor", label: "Footer" },
  { key: "footerTextColor", label: "Footer text" },
  { key: "announcementColor", label: "Announcement" },
  { key: "announcementTextColor", label: "Announcement text" },
]

const tabItems: { id: StudioTab; label: string; icon: typeof Palette; description: string }[] = [
  { id: "design", label: "Design", icon: Palette, description: "Colors, typography and visual identity" },
  { id: "content", label: "Content", icon: Type, description: "Edit homepage copy and calls to action" },
  { id: "pages", label: "Builder", icon: LayoutTemplate, description: "Build custom pages, menus and content" },
  { id: "seo", label: "SEO", icon: Globe2, description: "Search appearance and discoverability" },
  { id: "history", label: "History", icon: History, description: "Restore an earlier homepage design" },
]

export default function NooreWebStudio() {
  const [design, setDesign] = useState<HomepageDesign>(DEFAULT_HOMEPAGE_DESIGN)
  const [saved, setSaved] = useState<HomepageDesign>(DEFAULT_HOMEPAGE_DESIGN)
  const [tab, setTab] = useState<StudioTab>("design")
  const [group, setGroup] = useState("Hero")
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [versions, setVersions] = useState<Array<{ id: string; createdAt: string; label: string; design: HomepageDesign }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoring, setRestoring] = useState("")

  useEffect(() => {
    let active = true
    fetch("/api/admin/homepage-design", { cache: "no-store" })
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || "Unable to load your homepage design")
        if (active) {
          setDesign(payload.design)
          setSaved(payload.design)
        }
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load design") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (tab !== "history") return
    let active = true
    setHistoryLoading(true)
    fetch("/api/admin/homepage-design/history", { cache: "no-store" })
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || "Unable to load version history")
        if (active) setVersions(Array.isArray(payload.versions) ? payload.versions : [])
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load version history") })
      .finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [tab])

  async function restoreVersion(versionId: string) {
    if (!window.confirm("Restore this saved homepage design? Your current design will first be saved to version history.")) return
    setRestoring(versionId)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/homepage-design/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not restore version")
      setDesign(payload.design)
      setSaved(payload.design)
      setVersions(payload.versions || [])
      setNotice("Previous homepage design restored.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not restore version")
    } finally {
      setRestoring("")
    }
  }

  const changed = useMemo(
    () => (Object.keys(design) as (keyof HomepageDesign)[]).some(key => design[key] !== saved[key]),
    [design, saved],
  )
  const groups = useMemo(() => Array.from(new Set(fields.map(field => field.group))), [])
  const update = (key: keyof HomepageDesign, value: string) => {
    setDesign(current => ({ ...current, [key]: value }))
    setNotice("")
    setError("")
  }

  async function saveDesign() {
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/homepage-design", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(design),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not save design")
      setDesign(payload.design)
      setSaved(payload.design)
      setNotice("Your homepage design has been saved.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save design")
    } finally {
      setSaving(false)
    }
  }

  function discardChanges() {
    setDesign(saved)
    setError("")
    setNotice("Unsaved changes were discarded.")
  }

  const heroStyle = {
    backgroundColor: design.backgroundColor,
    color: design.textColor,
    fontFamily: design.bodyFont === "serif" ? "Georgia, serif" : "Arial, sans-serif",
  }

  if (tab === "pages") return (
    <div className="min-h-screen bg-[#090909] text-white">
      <header className="sticky top-0 z-40 border-b border-[#d6ae72]/20 bg-[#0b0b0b]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div><Link href="/admin" className="font-editorial text-2xl tracking-wide text-[#e8c98e]">NOORÉ</Link><p className="mt-1 text-[9px] font-semibold uppercase tracking-[.22em] text-[#d6ae72]">Complete website builder</p></div>
          <div className="flex gap-2"><button onClick={() => setTab("design")} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70">Homepage editor</button><Link href="/" target="_blank" className="rounded-lg bg-[#d6ae72] px-3 py-2 text-xs font-bold text-[#17130e]">View website</Link></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><StudioBuilder /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <header className="sticky top-0 z-40 border-b border-[#d6ae72]/20 bg-[#0b0b0b]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/admin" className="font-editorial text-2xl tracking-wide text-[#e8c98e]">NOORÉ</Link>
            <span className="hidden h-7 w-px bg-white/15 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[.24em] text-[#d6ae72]">Creative workspace</p>
              <h1 className="truncate text-sm font-semibold sm:text-base">Web Studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 transition hover:border-[#d6ae72]/60 hover:text-white sm:inline-flex">
              <Eye className="h-4 w-4" /> Live website <ArrowUpRight className="h-3 w-3" />
            </Link>
            <button type="button" onClick={discardChanges} disabled={!changed || saving} className="hidden items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65 hover:text-white disabled:opacity-35 md:inline-flex">
              <RotateCcw className="h-4 w-4" /> Discard
            </button>
            <button type="button" onClick={saveDesign} disabled={!changed || saving || loading} className="inline-flex items-center gap-2 rounded-lg bg-[#d6ae72] px-4 py-2.5 text-xs font-bold text-[#17110a] transition hover:bg-[#e8c98e] disabled:cursor-not-allowed disabled:opacity-45">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{saving ? "Saving…" : "Publish changes"}</span>
              <span className="sm:hidden">{saving ? "Saving" : "Save"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[230px_minmax(300px,390px)_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#0c0c0c] p-3 lg:min-h-[calc(100vh-76px)] lg:border-b-0 lg:border-r lg:p-4">
          <p className="px-3 pb-3 pt-2 text-[9px] font-bold uppercase tracking-[.24em] text-white/35">Workspace</p>
          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="Studio sections">
            {tabItems.map(item => {
              const Icon = item.icon
              const active = tab === item.id
              return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex min-h-[58px] items-center gap-3 rounded-xl border px-3 text-left transition ${active ? "border-[#d6ae72]/35 bg-[#d6ae72]/10 text-[#e8c98e]" : "border-transparent text-white/55 hover:bg-white/[.04] hover:text-white"}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0"><span className="block text-xs font-semibold">{item.label}</span><span className="hidden truncate text-[10px] opacity-55 xl:block">{item.description}</span></span>
              </button>
            })}
          </nav>
          <div className="mt-6 hidden rounded-xl border border-[#d6ae72]/15 bg-[#d6ae72]/[.045] p-4 lg:block">
            <div className="flex items-center gap-2 text-[#e8c98e]"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.16em]">NOORÉ Studio</span></div>
            <p className="mt-2 text-xs leading-5 text-white/50">Your existing storefront remains the source of truth. Studio edits the current homepage design settings.</p>
          </div>
          <Link href="/admin" className="mt-5 hidden items-center gap-2 px-3 text-xs text-white/40 hover:text-[#e8c98e] lg:flex">← Back to admin</Link>
        </aside>

        <section className="border-b border-white/10 bg-[#10100f] p-4 sm:p-6 lg:min-h-[calc(100vh-76px)] lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#d6ae72]">{tabItems.find(item => item.id === tab)?.label} editor</p><h2 className="mt-1 text-lg font-semibold">{tab === "design" ? "Visual identity" : tab === "content" ? "Homepage content" : tab === "history" ? "Saved versions" : "Search visibility"}</h2></div>
            {changed && <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[9px] font-semibold text-amber-200">Unsaved</span>}
          </div>

          {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading current design…</div> : null}
          {!loading && tab === "design" && <div className="space-y-6">
            <div><label className="mb-2 block text-xs font-semibold text-white/75">Typography</label><div className="grid grid-cols-2 gap-2">
              <label className="rounded-xl border border-white/10 p-3 text-xs text-white/65">Heading font<select value={design.headingFont} onChange={event => update("headingFont", event.target.value)} className="mt-2 w-full bg-transparent text-sm text-white outline-none"><option className="bg-[#151515]" value="editorial">Editorial</option><option className="bg-[#151515]" value="serif">Serif</option><option className="bg-[#151515]" value="sans">Sans</option></select></label>
              <label className="rounded-xl border border-white/10 p-3 text-xs text-white/65">Body font<select value={design.bodyFont} onChange={event => update("bodyFont", event.target.value)} className="mt-2 w-full bg-transparent text-sm text-white outline-none"><option className="bg-[#151515]" value="sans">Sans</option><option className="bg-[#151515]" value="serif">Serif</option></select></label>
            </div></div>
            <div><label className="mb-3 block text-xs font-semibold text-white/75">Brand color palette</label><div className="grid grid-cols-2 gap-2">{colors.map(color => <label key={color.key} className="flex items-center gap-2 rounded-xl border border-white/10 p-2.5"><input type="color" value={String(design[color.key])} onChange={event => update(color.key, event.target.value)} className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent" /><span className="min-w-0"><span className="block truncate text-[10px] text-white/65">{color.label}</span><span className="text-[9px] uppercase text-white/35">{String(design[color.key])}</span></span></label>)}</div></div>
          </div>}

          {!loading && tab === "content" && <div className="space-y-4">
            <label className="block text-xs font-semibold text-white/70">Section to edit<select value={group} onChange={event => setGroup(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171716] px-3 py-3 text-sm text-white outline-none focus:border-[#d6ae72]/60">{groups.map(item => <option key={item}>{item}</option>)}</select></label>
            {fields.filter(field => field.group === group).map(field => <label key={field.key} className="block text-xs font-medium text-white/65">{field.label}{field.multiline ? <textarea rows={3} value={String(design[field.key])} onChange={event => update(field.key, event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#171716] px-3 py-3 text-sm leading-5 text-white outline-none focus:border-[#d6ae72]/60" /> : <input value={String(design[field.key])} onChange={event => update(field.key, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171716] px-3 py-3 text-sm text-white outline-none focus:border-[#d6ae72]/60" />}</label>)}
            {fields.filter(field => field.group === group).length === 0 && <p className="rounded-xl border border-white/10 p-4 text-sm text-white/45">No editable fields are configured for this section yet.</p>}
          </div>}

          {!loading && tab === "history" && <div className="space-y-3">
            <div className="rounded-xl border border-[#d6ae72]/20 bg-[#d6ae72]/[.05] p-4">
              <p className="text-xs font-semibold text-[#e8c98e]">Homepage version history</p>
              <p className="mt-2 text-xs leading-5 text-white/50">Every changed homepage save keeps the previous version. Up to 30 versions are retained in the existing settings store. Restoring creates a safety snapshot of the current design first.</p>
            </div>
            {historyLoading ? <p className="flex items-center gap-2 p-4 text-xs text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading versions…</p> : versions.length === 0 ? <p className="rounded-xl border border-white/10 p-4 text-xs text-white/45">No saved versions yet. Save a homepage design change to create your first restore point.</p> : versions.map((version, index) => <article key={version.id} className="rounded-xl border border-white/10 bg-white/[.025] p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white/85">{version.label || "Homepage version"}</p><p className="mt-1 text-[10px] text-white/40">{new Date(version.createdAt).toLocaleString()}</p></div><span className="text-[9px] text-white/30">v{versions.length - index}</span></div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/55">{version.design?.heroHeading || "Homepage design snapshot"}</p>
              <button type="button" onClick={() => restoreVersion(version.id)} disabled={!!restoring || historyLoading} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#d6ae72]/30 px-3 py-2 text-[10px] font-semibold text-[#e8c98e] hover:bg-[#d6ae72]/10 disabled:opacity-40">{restoring === version.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Restore this version</button>
            </article>)}
          </div>}

          {!loading && tab === "seo" && <div className="space-y-4">
            <div className="rounded-xl border border-[#d6ae72]/20 bg-[#d6ae72]/[.05] p-4"><div className="flex items-center gap-2 text-[#e8c98e]"><WandSparkles className="h-4 w-4" /><p className="text-xs font-semibold">SEO workspace foundation</p></div><p className="mt-2 text-xs leading-5 text-white/50">Dedicated per-page metadata editing, redirects and SEO audits are not connected yet. Your existing metadata and sitemap remain unchanged.</p></div>
            <Link href="/admin/page-content" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:text-white">Open page content <ArrowUpRight className="h-3 w-3" /></Link>
          </div>}

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}
          {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200"><Check className="h-4 w-4" />{notice}</p>}
        </section>

        <section className="min-w-0 bg-[#080808] p-4 sm:p-6 lg:sticky lg:top-[76px] lg:h-[calc(100vh-76px)] lg:overflow-y-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#d6ae72]">Canvas</p><h2 className="mt-1 text-sm font-semibold">Live design preview</h2></div>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[.04] p-1">
              <button type="button" onClick={() => setDevice("desktop")} aria-label="Desktop preview" aria-pressed={device === "desktop"} className={`rounded-md p-2 ${device === "desktop" ? "bg-[#d6ae72] text-black" : "text-white/45"}`}><Monitor className="h-4 w-4" /></button>
              <button type="button" onClick={() => setDevice("mobile")} aria-label="Mobile preview" aria-pressed={device === "mobile"} className={`rounded-md p-2 ${device === "mobile" ? "bg-[#d6ae72] text-black" : "text-white/45"}`}><Smartphone className="h-4 w-4" /></button>
            </div>
          </div>
          <div className={`mx-auto overflow-hidden rounded-xl border border-white/15 bg-white shadow-2xl transition-all ${device === "mobile" ? "max-w-[390px]" : "max-w-[1100px]"}`}>
            <div className="flex h-8 items-center gap-1.5 border-b border-black/10 bg-[#f4f3ef] px-3"><span className="h-2 w-2 rounded-full bg-[#d7a29b]" /><span className="h-2 w-2 rounded-full bg-[#e5c989]" /><span className="h-2 w-2 rounded-full bg-[#9cb89b]" /><span className="ml-2 truncate text-[9px] text-black/40">noore — homepage preview · unsaved changes</span></div>
            <div style={{ backgroundColor: design.announcementColor, color: design.announcementTextColor }} className="px-3 py-2 text-center text-[9px] font-semibold tracking-[.13em]">{design.announcementMessage}</div>
            <div style={{ backgroundColor: design.headerColor, color: design.headerTextColor }} className="flex items-center justify-between border-b px-5 py-4" ><span className="text-[10px] tracking-[.25em]">MENU</span><span className="font-serif text-xl tracking-[.2em]">NOORÉ</span><span className="text-[10px]">BAG · 0</span></div>
            <div style={heroStyle} className={`px-6 py-12 sm:px-12 sm:py-20 ${device === "mobile" ? "text-center" : "text-left"}`}>
              <p style={{ color: design.accentColor }} className="text-[9px] font-bold uppercase tracking-[.28em]">{design.heroEyebrow}</p>
              <p className="mt-4 font-serif text-sm italic opacity-65">{design.heroKicker}</p>
              <h3 style={{ fontFamily: design.headingFont === "sans" ? "Arial, sans-serif" : "Georgia, serif" }} className={`mt-3 max-w-2xl text-4xl leading-[1.12] tracking-tight sm:text-6xl ${device === "mobile" ? "mx-auto" : ""}`}>{design.heroHeading}</h3>
              <p className={`mt-5 max-w-lg text-xs leading-6 opacity-65 ${device === "mobile" ? "mx-auto" : ""}`}>{design.heroDescription}</p>
              <div className={`mt-7 flex flex-wrap gap-3 ${device === "mobile" ? "justify-center" : ""}`}>
                <span style={{ backgroundColor: design.buttonColor, color: design.buttonTextColor }} className="px-5 py-3 text-[9px] font-bold uppercase tracking-[.15em]">{design.primaryButtonText}</span>
                <span style={{ borderColor: design.borderColor }} className="border px-5 py-3 text-[9px] font-bold uppercase tracking-[.15em]">{design.secondaryButtonText}</span>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-2 opacity-70"><div style={{ backgroundColor: design.surfaceColor, borderColor: design.borderColor }} className="aspect-[3/4] border" /><div style={{ backgroundColor: design.surfaceColor, borderColor: design.borderColor }} className="aspect-[3/4] border" /><div style={{ backgroundColor: design.surfaceColor, borderColor: design.borderColor }} className="aspect-[3/4] border" /></div>
            </div>
            <div style={{ backgroundColor: design.footerColor, color: design.footerTextColor }} className="px-6 py-8 text-center"><p className="font-serif text-lg tracking-[.2em]">NOORÉ</p><p className="mx-auto mt-3 max-w-md text-[9px] leading-5 opacity-65">{design.footerDescription}</p></div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-white/35"><span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> Local canvas preview · not the published storefront</span><span>{device === "desktop" ? "Desktop" : "Mobile"}</span></div>
        </section>
      </div>
    </div>
  )
}
