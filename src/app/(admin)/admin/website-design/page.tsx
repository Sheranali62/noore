"use client"

import { useEffect, useState } from "react"
import type { HomepageDesign } from "@/lib/homepage-design"
import { DEFAULT_HOMEPAGE_DESIGN } from "@/lib/homepage-design"

const textFields: { key: keyof HomepageDesign; label: string; group: string; multiline?: boolean }[] = [
  { key: "heroEyebrow", label: "Hero small label", group: "Hero content" },
  { key: "heroKicker", label: "Hero italic line", group: "Hero content" },
  { key: "heroHeading", label: "Main hero heading", group: "Hero content" },
  { key: "heroDescription", label: "Hero description", group: "Hero content", multiline: true },
  { key: "primaryButtonText", label: "Primary button text", group: "Hero content" },
  { key: "primaryButtonUrl", label: "Primary button link", group: "Hero content" },
  { key: "secondaryButtonText", label: "Secondary button text", group: "Hero content" },
  { key: "secondaryButtonUrl", label: "Secondary button link", group: "Hero content" },
  { key: "collectionsEyebrow", label: "Small label", group: "Collections section" },
  { key: "collectionsHeading", label: "Section heading", group: "Collections section" },
  { key: "favouritesEyebrow", label: "Small label", group: "Customer favourites" },
  { key: "favouritesHeading", label: "Section heading", group: "Customer favourites" },
  { key: "categoriesEyebrow", label: "Small label", group: "Categories section" },
  { key: "categoriesHeading", label: "Section heading", group: "Categories section" },
  { key: "arrivalsEyebrow", label: "Small label", group: "New arrivals" },
  { key: "arrivalsHeading", label: "Section heading", group: "New arrivals" },
  { key: "luxuryEyebrow", label: "Small label", group: "Luxury spotlight" },
  { key: "luxuryHeading", label: "Main heading", group: "Luxury spotlight" },
  { key: "luxuryDescription", label: "Description", group: "Luxury spotlight", multiline: true },
  { key: "luxuryButtonText", label: "Link text", group: "Luxury spotlight" },
  { key: "luxuryButtonUrl", label: "Link destination", group: "Luxury spotlight" },
  { key: "limitedEyebrow", label: "Small label", group: "Limited quantities" },
  { key: "limitedHeading", label: "Section heading", group: "Limited quantities" },
  { key: "limitedDescription", label: "Description", group: "Limited quantities" },
  { key: "saleEyebrow", label: "Small label", group: "Sale section" },
  { key: "saleHeading", label: "Section heading", group: "Sale section" },
  { key: "saleDescription", label: "Description", group: "Sale section" },
  { key: "storiesEyebrow", label: "Small label", group: "Collection stories" },
  { key: "storiesHeading", label: "Section heading", group: "Collection stories" },
  { key: "journalEyebrow", label: "Small label", group: "Journal section" },
  { key: "journalHeading", label: "Section heading", group: "Journal section" },
  { key: "brandEyebrow", label: "Small label", group: "Brand statement" },
  { key: "brandHeading", label: "Main heading", group: "Brand statement" },
  { key: "brandDescription", label: "Description", group: "Brand statement", multiline: true },
  { key: "brandButtonText", label: "Button text", group: "Brand statement" },
  { key: "brandButtonUrl", label: "Button destination", group: "Brand statement" },
  { key: "newsletterEyebrow", label: "Small label", group: "Newsletter section" },
  { key: "newsletterHeading", label: "Heading", group: "Newsletter section" },
  { key: "newsletterDescription", label: "Description", group: "Newsletter section" },
  { key: "newsletterButtonText", label: "Button text", group: "Newsletter section" },
  { key: "newsletterButtonUrl", label: "Button destination", group: "Newsletter section" },
]
const colorFields: {key:keyof HomepageDesign;label:string}[] = [
  {key:"backgroundColor",label:"Page background"},
  {key:"textColor",label:"Main text"},
  {key:"accentColor",label:"Accent"},
  {key:"buttonColor",label:"Primary button"},
  {key:"buttonTextColor",label:"Button text"},
]
const groups = ["Hero content","Collections section","Customer favourites","Categories section","New arrivals","Luxury spotlight","Limited quantities","Sale section","Collection stories","Journal section","Brand statement","Newsletter section"]

export default function WebsiteDesignPage() {
  const [design,setDesign]=useState<HomepageDesign>(DEFAULT_HOMEPAGE_DESIGN)
  const [saved,setSaved]=useState<HomepageDesign>(DEFAULT_HOMEPAGE_DESIGN)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")
  useEffect(()=>{let active=true;fetch("/api/admin/homepage-design",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load design");if(active){setDesign(d.design);setSaved(d.design)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])
  const update=(key:keyof HomepageDesign,value:string)=>{setDesign(v=>({...v,[key]:value}));setMessage("");setError("")}
  const changed=Object.keys(design).some(k=>design[k as keyof HomepageDesign]!==saved[k as keyof HomepageDesign])
  const save=async()=>{
    setError("");setMessage("")
    const hexKeys = ["backgroundColor","textColor","accentColor","buttonColor","buttonTextColor"] as const
    for (const key of hexKeys) if (!/^#[0-9a-fA-F]{6}$/.test(design[key])) { setError(`Please enter a valid HEX color for ${key} (example: #535F4C).`); return }
    const urlKeys = ["primaryButtonUrl","secondaryButtonUrl","luxuryButtonUrl","brandButtonUrl","newsletterButtonUrl"] as const
    for (const key of urlKeys) { const value=design[key].trim(); if (!(value.startsWith("/") && !value.startsWith("//")) && !value.toLowerCase().startsWith("https://")) { setError(`Please use a site path like /products or a secure https:// link for ${key}.`); return } }
    setSaving(true);try{const r=await fetch("/api/admin/homepage-design",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(design)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save");setDesign(d.design);setSaved(d.design);setMessage("Your homepage design is saved and published.")}catch(e){setError(e instanceof Error?e.message:"Unable to save design")}finally{setSaving(false)}}
  const reset=()=>{setDesign(DEFAULT_HOMEPAGE_DESIGN);setMessage("Default values loaded. Save to publish them.");setError("")}
  if(loading)return <div className="mx-auto max-w-6xl"><Header/><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center text-sm text-white/50">Loading design settings…</div></div>
  return <div className="mx-auto max-w-6xl pb-12"><Header/>
    <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6ae72]">01 / Brand palette</p><h2 className="mt-2 text-lg font-semibold text-white">Storefront colors</h2><p className="mt-1 text-xs text-white/45">Choose your colors using the picker or enter a six-digit HEX value.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {colorFields.map(f=><label key={f.key} className="block text-sm"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{f.label}</span><div className="flex gap-2"><input type="color" value={design[f.key] as string} onChange={e=>update(f.key,e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"/><input value={design[f.key] as string} onChange={e=>update(f.key,e.target.value)} maxLength={7} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#090909] px-3 py-2 text-sm uppercase text-white outline-none focus:border-[#d6ae72]/60"/></div></label>)}
        </div>
        <div className="mt-5 rounded-xl border border-white/10 p-4" style={{backgroundColor:design.backgroundColor,color:design.textColor}}><p className="text-[9px] uppercase tracking-[0.2em] opacity-60">Live palette preview</p><p className="mt-2 text-2xl" style={{fontFamily:design.headingFont==="sans"?"Arial, sans-serif":design.headingFont==="serif"?"Times New Roman, serif":"Georgia, serif"}}>Wear your own light.</p><button type="button" className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold" style={{backgroundColor:design.buttonColor,color:design.buttonTextColor}}>Discover NOORÉ</button><span className="ml-3 inline-block h-7 w-7 rounded-full align-middle" style={{backgroundColor:design.accentColor}}/></div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6ae72]">02 / Typography</p><h2 className="mt-2 text-lg font-semibold text-white">Heading style</h2><p className="mt-1 text-xs text-white/45">Change the display font used for editorial headings.</p><div className="mt-5 space-y-2">{([{value:"editorial",label:"NOORÉ Editorial"},{value:"serif",label:"Classic Serif"},{value:"sans",label:"Modern Sans"}] as const).map(o=><button key={o.value} type="button" onClick={()=>update("headingFont",o.value)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${design.headingFont===o.value?"border-[#d6ae72]/60 bg-[#d6ae72]/10 text-[#e4c28e]":"border-white/10 text-white/70 hover:bg-white/[0.04]"}`}><span>{o.label}</span><span className="text-xs opacity-60">{design.headingFont===o.value?"Selected":"Select"}</span></button>)}</div></section>
    </div>
    <div className="space-y-4">{groups.map((group,index)=><section key={group} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg border border-[#d6ae72]/20 bg-[#d6ae72]/10 text-xs text-[#e4c28e]">{String(index+3).padStart(2,"0")}</span><h2 className="text-base font-semibold text-white">{group}</h2></div><div className="grid gap-4 md:grid-cols-2">{textFields.filter(f=>f.group===group).map(f=><label key={f.key} className={`block text-sm ${f.multiline?"md:col-span-2":""}`}><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">{f.label}</span>{f.multiline?<textarea rows={3} value={design[f.key] as string} onChange={e=>update(f.key,e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ae72]/60"/>:<input value={design[f.key] as string} onChange={e=>update(f.key,e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ae72]/60"/>}</label>)}</div></section>)}</div>
    {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">{error}</p>}{message&&<p role="status" className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">{message}</p>}
    <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6ae72]/25 bg-[#111110]/95 p-4 shadow-2xl backdrop-blur"><div><p className="text-sm font-medium text-white">{changed?"Unsaved design changes":"Design is saved"}</p><p className="mt-1 text-xs text-white/40">Changes update the public homepage. Products, orders and customer data are untouched.</p></div><div className="flex gap-2"><button type="button" onClick={reset} className="rounded-xl border border-white/15 px-4 py-3 text-xs font-semibold text-white/75">Reset defaults</button><button type="button" onClick={save} disabled={saving||!changed} className="rounded-xl bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#17110a] disabled:opacity-40">{saving?"Saving…":"Save & Publish"}</button></div></div>
  </div>
}
function Header(){return <header className="mb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6ae72]">NOORÉ / Storefront</p><div className="mt-3 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-editorial text-4xl text-white sm:text-5xl">Website Design Studio</h1><p className="mt-2 max-w-2xl text-sm text-white/45">Edit homepage copy, brand colors, typography and campaign buttons in one place.</p></div><div className="flex gap-2"><a href="/" target="_blank" rel="noreferrer" className="rounded-xl border border-[#d6ae72]/25 px-4 py-2.5 text-xs font-semibold text-[#e4c28e]">Preview storefront ↗</a><a href="/admin/homepage" className="rounded-xl border border-[#d6ae72]/25 px-4 py-2.5 text-xs font-semibold text-[#e4c28e]">Back to Homepage Builder</a></div></div></header>}
