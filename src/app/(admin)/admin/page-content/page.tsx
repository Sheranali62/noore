"use client"
import { useEffect,useState } from "react"
import Link from "next/link"
import { DEFAULT_PAGE_CONTENT, type EditablePage, type PageContentMap } from "@/lib/site-page-content-defaults"

const labels:Record<EditablePage,string>={women:"Women",men:"Men",kids:"Kids",collections:"Collections",about:"About NOORÉ",journal:"Journal"}
const keys: (keyof PageContentMap["women"])[]=["eyebrow","title","description","secondaryTitle","secondaryDescription","buttonText","buttonUrl"]
const names:Record<string,string>={eyebrow:"Small label",title:"Main page heading",description:"Main description",secondaryTitle:"Second section heading",secondaryDescription:"Second section description",buttonText:"Button text",buttonUrl:"Button link"}
export default function PageContentEditor(){
 const [pages,setPages]=useState<PageContentMap>(DEFAULT_PAGE_CONTENT)
 const [saved,setSaved]=useState<PageContentMap>(DEFAULT_PAGE_CONTENT)
 const [selected,setSelected]=useState<EditablePage>("women")
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false)
 const [error,setError]=useState(""),[message,setMessage]=useState("")
 useEffect(()=>{let live=true;fetch("/api/admin/site-page-content",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load page content");if(live){setPages(d.pages);setSaved(d.pages)}}).catch(e=>live&&setError(e.message)).finally(()=>live&&setLoading(false));return()=>{live=false}},[])
 const update=(field:keyof PageContentMap["women"],value:string)=>setPages(old=>({...old,[selected]:{...old[selected],[field]:value}}))
 const changed=JSON.stringify(pages)!==JSON.stringify(saved)
 const save=async()=>{setSaving(true);setError("");setMessage("");try{const r=await fetch("/api/admin/site-page-content",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(pages)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Save failed");setPages(d.pages);setSaved(d.pages);setMessage("Page content saved and published.")}catch(e){setError(e instanceof Error?e.message:"Save failed")}finally{setSaving(false)}}
 const reset=()=>{setPages(old=>({...old,[selected]:DEFAULT_PAGE_CONTENT[selected]}));setMessage("Default content restored for this page. Save to publish.");setError("")}
 if(loading)return <div className="p-8 text-center text-white/60">Loading page content…</div>
 const previewPath:Record<EditablePage,string>={women:"/women",men:"/men",kids:"/kids",collections:"/collections",about:"/about",journal:"/journal"}
 return <div className="mx-auto max-w-6xl space-y-6 pb-12 text-white">
  <header><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#d6ae72]">NOORÉ / Content Studio</p><h1 className="mt-2 font-editorial text-4xl">Individual page editor</h1><p className="mt-2 text-sm text-white/55">Edit the public page headings, descriptions and main call-to-action without changing products or orders.</p></header>
  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-7">
   <label className="block text-[10px] uppercase tracking-[.18em] text-white/50">Choose a page</label>
   <select value={selected} onChange={e=>{setSelected(e.target.value as EditablePage);setMessage("");setError("")}} className="mt-2 w-full max-w-sm rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-sm text-white">{(Object.keys(labels) as EditablePage[]).map(k=><option key={k} value={k}>{labels[k]}</option>)}</select>
   <div className="mt-6 grid gap-5 md:grid-cols-2">
    {keys.map(k=><label key={k} className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.15em] text-white/50">{names[k]}</span>{k==="description"||k==="secondaryDescription"?<textarea rows={4} value={pages[selected][k]} onChange={e=>update(k,e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ae72]/60"/>:<input value={pages[selected][k]} onChange={e=>update(k,e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ae72]/60"/>}</label>)}
   </div>
   <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5"><p className="text-[9px] uppercase tracking-[.2em] text-[#d6ae72]">Preview text</p><p className="mt-2 text-xs text-white/45">{pages[selected].eyebrow}</p><h2 className="mt-2 font-editorial text-3xl">{pages[selected].title}</h2><p className="mt-2 max-w-2xl text-sm text-white/60">{pages[selected].description}</p><p className="mt-4 font-editorial text-2xl">{pages[selected].secondaryTitle}</p><p className="mt-2 text-sm text-white/60">{pages[selected].secondaryDescription}</p></div>
   {error&&<p className="mt-4 text-sm text-red-300">{error}</p>}{message&&<p className="mt-4 text-sm text-emerald-300">{message}</p>}
   <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving||!changed} onClick={save} className="rounded-xl bg-[#d6ae72] px-5 py-3 text-xs font-bold uppercase tracking-[.14em] text-[#17110a] disabled:opacity-40">{saving?"Publishing…":"Save & publish"}</button><button onClick={reset} className="rounded-xl border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-white/70">Restore page defaults</button><Link href={previewPath[selected]} target="_blank" className="rounded-xl border border-[#d6ae72]/40 px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-[#e4c28e]">Preview page ↗</Link></div>
  </section>
 </div>
}
