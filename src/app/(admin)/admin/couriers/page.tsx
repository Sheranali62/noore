"use client"

import { useEffect, useState } from "react"

type Courier = {
  id: string
  name: string
  accountNumber: string | null
  contractNumber: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  pickupAddress: string | null
  pickupCity: string | null
  serviceNotes: string | null
  apiBaseUrl: string | null
  apiKey: string | null
  apiSecret: string | null
  active: boolean
}

type CourierForm = {
  name: string
  accountNumber: string
  contractNumber: string
  contactName: string
  contactPhone: string
  contactEmail: string
  pickupAddress: string
  pickupCity: string
  serviceNotes: string
  apiBaseUrl: string
  apiKey: string
  apiSecret: string
  active: boolean
}

const blank: CourierForm = {
  name: "",
  accountNumber: "",
  contractNumber: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  pickupAddress: "",
  pickupCity: "",
  serviceNotes: "",
  apiBaseUrl: "",
  apiKey: "",
  apiSecret: "",
  active: true,
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [form, setForm] = useState<CourierForm>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const response = await fetch(
        "/api/admin/couriers",
        {
          cache: "no-store",
        }
      )

      if (!response.ok) {
        setCouriers([])
        return
      }

      const data = await response.json()

      setCouriers(
        Array.isArray(data) ? data : []
      )
    } catch {
      setCouriers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(
    key: keyof CourierForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function edit(courier: Courier) {
    setEditing(courier.id)

    setForm({
      name: courier.name || "",
      accountNumber:
        courier.accountNumber || "",
      contractNumber:
        courier.contractNumber || "",
      contactName:
        courier.contactName || "",
      contactPhone:
        courier.contactPhone || "",
      contactEmail:
        courier.contactEmail || "",
      pickupAddress:
        courier.pickupAddress || "",
      pickupCity:
        courier.pickupCity || "",
      serviceNotes:
        courier.serviceNotes || "",
      apiBaseUrl:
        courier.apiBaseUrl || "",
      apiKey:
        courier.apiKey || "",
      apiSecret:
        courier.apiSecret || "",
      active:
        courier.active ?? true,
    })

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function cancelEdit() {
    setEditing(null)
    setForm(blank)
  }

  async function save() {
    if (!form.name.trim()) {
      alert(
        "Please enter the courier company name."
      )
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        editing
          ? `/api/admin/couriers/${editing}`
          : "/api/admin/couriers",
        {
          method: editing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not save courier"
        )
      }

      setForm(blank)
      setEditing(null)

      await load()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not save courier"
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    const confirmed = confirm(
      "Delete this courier company?"
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/couriers/${id}`,
        {
          method: "DELETE",
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not delete courier"
        )
      }

      if (editing === id) {
        cancelEdit()
      }

      await load()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete courier"
      )
    }
  }

  return (
    <div className="admin-page space-y-7">
      <header><p className="admin-eyebrow">Operations / Delivery</p><h1 className="admin-title">Courier companies</h1><p className="admin-subtitle">Save contracted courier profiles once so orders can reuse them without re-entering company information.</p></header>
      <section className="admin-surface"><div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="admin-eyebrow">{editing?"Editing profile":"New profile"}</p><h2 className="mt-2 text-base font-semibold text-white">{editing?"Edit courier contract":"Add courier company"}</h2><p className="mt-1 text-sm text-white/45">Contract, contact, pickup and future API fields remain unchanged.</p></div>{editing&&<button type="button" onClick={cancelEdit} className="admin-button-secondary w-fit">Cancel edit</button>}</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[['name','Company name *','Courier company'],['accountNumber','Account number','Account number'],['contractNumber','Contract number','Contract number'],['contactName','Account/contact person','Contact person'],['contactPhone','Contact phone','+92…'],['contactEmail','Contact email','contact@courier.com'],['pickupCity','Pickup city','Lahore'],['apiBaseUrl','API base URL','Optional']].map(([key,label,placeholder])=><label key={key} className="block text-sm"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45">{label}</span><input type={key==='contactEmail'?'email':'text'} value={form[key as keyof CourierForm] as string} onChange={e=>update(key as keyof CourierForm,e.target.value)} placeholder={placeholder} className="admin-input"/></label>)}
          <label className="block text-sm"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45">API key</span><input type="password" value={form.apiKey} onChange={e=>update('apiKey',e.target.value)} placeholder="Optional" className="admin-input"/></label>
          <label className="block text-sm"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45">API secret</span><input type="password" value={form.apiSecret} onChange={e=>update('apiSecret',e.target.value)} placeholder="Optional" className="admin-input"/></label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="block text-sm"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45">Pickup address</span><textarea rows={3} value={form.pickupAddress} onChange={e=>update('pickupAddress',e.target.value)} placeholder="Courier pickup address" className="admin-input resize-y"/></label><label className="block text-sm"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45">Service notes</span><textarea rows={3} value={form.serviceNotes} onChange={e=>update('serviceNotes',e.target.value)} placeholder="Contract terms, COD notes, pickup schedule…" className="admin-input resize-y"/></label></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-3 text-sm text-white/70"><input type="checkbox" checked={form.active} onChange={e=>update('active',e.target.checked)} className="h-4 w-4 accent-white"/> Active courier</label><div className="flex gap-2"><button type="button" onClick={save} disabled={saving||!form.name.trim()} className="admin-button-primary">{saving?'Saving…':editing?'Save courier':'Add courier'}</button>{editing&&<button type="button" onClick={cancelEdit} className="admin-button-secondary">Cancel</button>}</div></div><p className="mt-4 text-xs leading-5 text-white/35">API credentials are reserved for future real courier integrations. No shipment booking is simulated.</p>
      </section>
      <section className="admin-surface p-0 overflow-hidden"><div className="border-b border-white/10 px-5 py-4 md:px-6"><h2 className="text-sm font-semibold text-white">Saved courier contracts</h2><p className="mt-1 text-xs text-white/40">{couriers.length} configured courier{couriers.length===1?'':'s'}.</p></div>{loading?<div className="p-10 text-center text-sm text-white/45">Loading couriers…</div>:couriers.length===0?<div className="p-12 text-center"><p className="font-medium text-white">No courier companies configured</p><p className="mt-1 text-sm text-white/40">Add a contract above to make it available in orders.</p></div>:<div className="divide-y divide-white/[0.07]">{couriers.map(courier=><div key={courier.id} className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{courier.name}</p><span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${courier.active?'border-emerald-400/20 bg-emerald-400/10 text-emerald-200':'border-white/10 bg-white/[0.04] text-white/40'}`}>{courier.active?'Active':'Disabled'}</span></div><p className="mt-2 text-sm text-white/45">{courier.contactName||'No contact person'}{courier.contactPhone?` · ${courier.contactPhone}`:''}{courier.pickupCity?` · Pickup ${courier.pickupCity}`:''}</p>{courier.accountNumber&&<p className="mt-1 text-xs text-white/30">Account {courier.accountNumber}{courier.contractNumber?` · Contract ${courier.contractNumber}`:''}</p>}</div><div className="flex gap-2"><button type="button" onClick={()=>edit(courier)} className="admin-button-secondary !px-3 !py-2 text-xs">Edit</button><button type="button" onClick={()=>remove(courier.id)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10">Delete</button></div></div>)}</div>}</section>
    </div>
  )
}
