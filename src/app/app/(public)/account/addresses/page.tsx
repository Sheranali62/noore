"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Address = { id:string; name:string; phone:string; address:string; city:string; province:string; postal:string; default:boolean }
const empty = { name:"", phone:"", address:"", city:"", province:"", postal:"", default:false }

export default function AddressesPage() {
  const [addresses,setAddresses]=useState<Address[]>([]); const [form,setForm]=useState(empty); const [editing,setEditing]=useState<string|null>(null); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState("")
  const load=async()=>{const r=await fetch("/api/addresses"); if(r.ok){const d=await r.json();setAddresses(d.addresses||[])} setLoading(false)}
  useEffect(()=>{load()},[])
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError("");const r=await fetch("/api/addresses",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?{...form,id:editing}:form)});const d=await r.json();if(!r.ok)setError(d.error||"Could not save address");else{setForm(empty);setEditing(null);await load()}setSaving(false)}
  const edit=(a:Address)=>{setEditing(a.id);setForm({...a})}
  const remove=async(id:string)=>{if(!confirm("Remove this address?"))return;const r=await fetch("/api/addresses",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const d=await r.json();if(!r.ok)setError(d.error||"Could not delete address");else load()}
  return <div className="min-h-screen bg-cream py-10"><div className="max-w-6xl mx-auto px-4"><Link href="/account" className="text-sm text-secondary hover:text-charcoal">← Back to account</Link><div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-secondary">Delivery</p><h1 className="font-editorial text-4xl mt-2">Saved addresses</h1></div><p className="text-sm text-secondary">{addresses.length} saved</p></div>
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 mt-8">
      <form onSubmit={submit} className="bg-white border border-cream rounded-2xl p-6 space-y-4 h-fit"><div><h2 className="font-semibold text-lg">{editing?"Edit address":"Add a new address"}</h2><p className="text-sm text-secondary mt-1">Used for faster COD checkout.</p></div>
      {([['name','Full name'],['phone','Phone'],['address','Street address'],['city','City'],['province','Province'],['postal','Postal code']] as const).map(([key,label])=><label key={key} className="block text-sm font-medium">{label}<input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1.5 w-full border border-cream rounded-lg px-3 py-2.5 outline-none focus:border-charcoal" required /></label>)}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.default} onChange={e=>setForm({...form,default:e.target.checked})}/> Make this my default address</label>
      {error&&<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-3"><button disabled={saving} className="bg-charcoal text-white rounded-lg px-5 py-2.5 disabled:opacity-50">{saving?"Saving…":editing?"Update address":"Save address"}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty)}} className="border border-cream rounded-lg px-5 py-2.5">Cancel</button>}</div></form>
      <div className="space-y-4">{loading?<div className="bg-white rounded-2xl p-8 text-secondary">Loading addresses…</div>:addresses.length===0?<div className="bg-white rounded-2xl p-10 text-center border border-cream"><div className="text-4xl">⌂</div><h2 className="font-editorial text-2xl mt-3">No saved addresses</h2><p className="text-secondary mt-2">Add one to speed up your next order.</p></div>:addresses.map(a=><div key={a.id} className="bg-white border border-cream rounded-2xl p-5"><div className="flex justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="font-semibold">{a.name}</h3>{a.default&&<span className="text-[10px] uppercase tracking-wider bg-charcoal text-white rounded px-2 py-1">Default</span>}</div><p className="text-sm text-secondary mt-2">{a.phone}</p><p className="text-sm mt-2">{a.address}, {a.city}, {a.province} — {a.postal}</p></div><div className="flex gap-3 text-sm"><button onClick={()=>edit(a)} className="hover:underline">Edit</button><button onClick={()=>remove(a.id)} className="text-red-600 hover:underline">Delete</button></div></div></div>)}</div>
    </div></div></div>
}
