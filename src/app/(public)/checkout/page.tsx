"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, ChevronDown, LockKeyhole, MapPin, Minus, Plus, ShieldCheck, Truck } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"
import { useSession } from "next-auth/react"

type Address = { id: string; name: string; phone: string; address: string; city: string; province: string; postal: string; default: boolean }

type Coupon = { code: string; type: string; value: number; discount: number }

const FALLBACK = { freeShippingThreshold: 5000, standardShipping: 250, expressShipping: 500 }

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, count, clearCart } = useCart()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [error, setError] = useState("")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [settings, setSettings] = useState(FALLBACK)
  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState("")
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", city: "", province: "", postal: "", deliveryMethod: "standard", paymentMethod: "cod" })

  const provinces = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "Gilgit-Baltistan", "Azad Kashmir"]
  const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala", "Peshawar", "Quetta", "Sialkot", "Hyderabad"]

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/settings").then(r => r.ok ? r.json() : null),
      session?.user ? fetch("/api/addresses").then(r => r.ok ? r.json() : null) : Promise.resolve(null),
    ]).then(([settingsResult, addressesResult]) => {
      if (settingsResult.status === "fulfilled" && settingsResult.value) {
        const s = settingsResult.value.settings || settingsResult.value
        setSettings({
          freeShippingThreshold: Number(s.freeShippingThreshold ?? FALLBACK.freeShippingThreshold),
          standardShipping: Number(s.standardShipping ?? FALLBACK.standardShipping),
          expressShipping: Number(s.expressShipping ?? FALLBACK.expressShipping),
        })
      }
      if (addressesResult.status === "fulfilled" && addressesResult.value?.addresses) {
        const list = addressesResult.value.addresses as Address[]
        setAddresses(list)
        const preferred = list.find(a => a.default) || list[0]
        if (preferred) selectAddress(preferred)
      }
    })
  }, [session])

  useEffect(() => {
    if (!session?.user?.email) return
    setFormData(prev => ({ ...prev, email: prev.email || session.user.email || "" }))
  }, [session])

  useEffect(() => {
    if (!items.length) router.replace("/cart")
  }, [items.length, router])

  const shipping = formData.deliveryMethod === "express" ? settings.expressShipping : (total >= settings.freeShippingThreshold ? 0 : settings.standardShipping)
  const discount = coupon?.discount || 0
  const grandTotal = Math.max(0, total - discount + shipping)
  const freeShippingGap = Math.max(0, settings.freeShippingThreshold - total)

  const update = (key: keyof typeof formData, value: string) => setFormData(prev => ({ ...prev, [key]: value }))

  function selectAddress(address: Address) {
    setFormData(prev => ({ ...prev, name: address.name, phone: address.phone, address: address.address, city: address.city, province: address.province, postal: address.postal }))
  }

  const canContinue = useMemo(() => {
    if (step === 1) return formData.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && formData.phone.replace(/\D/g, "").length >= 10
    if (step === 2) return formData.address.trim().length >= 8 && formData.city && formData.province && formData.postal.trim().length >= 4
    return true
  }, [formData, step])

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true); setCouponMessage(""); setError("")
    try {
      const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal: total }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "This coupon cannot be applied")
      setCoupon({ code, type: data.coupon?.type || data.type, value: Number(data.coupon?.value ?? data.value ?? 0), discount: Number(data.discount || 0) })
      setCouponMessage("Coupon applied successfully.")
    } catch (e: any) {
      setCoupon(null); setCouponMessage(e?.message || "Invalid coupon code")
    } finally { setCouponLoading(false) }
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    try {
      const orderData = {
        customer: { name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone.trim() },
        address: { address: formData.address.trim(), city: formData.city, province: formData.province, postal: formData.postal.trim() },
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: "cod",
        couponCode: coupon?.code || undefined,
        discount,
        items: items.map(item => ({ productId: item.productId, variantId: (item as any).variantId || undefined, quantity: item.quantity, price: item.price })),
        subtotal: total,
        shipping,
        total: grandTotal,
      }
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to place your order. Please try again.")
      setOrderNumber(data.orderNumber)
      localStorage.setItem("last_order_number", data.orderNumber)
      clearCart()
      setStep(4)
    } catch (e: any) { setError(e?.message || "Something went wrong. Please try again.") }
    finally { setLoading(false) }
  }

  if (!items.length && step !== 4) return null

  if (step === 4) {
    return <main className="min-h-[75vh] bg-[#faf9f6] flex items-center justify-center px-4 py-16"><div className="max-w-xl w-full bg-white border border-black/5 p-8 md:p-12 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-cream flex items-center justify-center"><Check size={28} /></div>
      <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-secondary">Thank you for choosing NOORÉ</p>
      <h1 className="font-editorial text-4xl font-semibold mt-2">Order confirmed</h1>
      <p className="text-sm text-secondary mt-3">Your order has been received and will be prepared for delivery.</p>
      <div className="mt-7 p-4 bg-[#faf9f6]"><p className="text-[10px] uppercase tracking-[0.18em] text-secondary">Order number</p><p className="font-mono text-xl font-semibold mt-1">#{orderNumber}</p><p className="text-xs text-secondary mt-2">Payment: Cash on Delivery</p></div>
      <div className="grid sm:grid-cols-2 gap-3 mt-7"><Link href="/account/orders" className="py-3 border border-charcoal text-sm font-medium hover:bg-charcoal hover:text-white transition">View my orders</Link><Link href="/products" className="py-3 bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition">Continue shopping</Link></div>
    </div></main>
  }

  return <main className="min-h-screen bg-[#faf9f6]">
    <div className="bg-white border-b border-black/5"><div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between"><Link href="/cart" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-charcoal"><ArrowLeft size={16}/> Bag</Link><p className="text-xs uppercase tracking-[0.2em]">Secure checkout</p><div className="flex items-center gap-1 text-xs text-secondary"><LockKeyhole size={14}/> Secure</div></div></div>
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8"><p className="text-[10px] uppercase tracking-[0.28em] text-secondary">NOORÉ checkout</p><h1 className="font-editorial text-4xl md:text-5xl font-semibold mt-2">Complete your order</h1></div>
      <div className="grid lg:grid-cols-[1fr_390px] gap-8 lg:gap-12 items-start">
        <section>
          <div className="bg-white border border-black/5 p-4 mb-5"><div className="grid grid-cols-3 gap-2">{["Contact", "Delivery", "Payment"].map((label, i) => { const n=i+1; return <button key={label} type="button" onClick={() => n < step && setStep(n)} className={`text-left ${n < step ? "cursor-pointer" : "cursor-default"}`}><div className="flex items-center gap-2"><span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${step===n?"bg-charcoal text-white":step>n?"bg-black text-white":"bg-cream text-secondary"}`}>{step>n?<Check size={13}/>:n}</span><span className={`hidden sm:block text-xs ${step===n?"font-medium":"text-secondary"}`}>{label}</span></div><div className="h-0.5 mt-3 bg-cream"><div className={`h-full bg-charcoal transition-all ${step>n?"w-full":step===n?"w-1/2":"w-0"}`}/></div></button>})}</div></div>

          <form onSubmit={placeOrder} className="bg-white border border-black/5 p-5 md:p-7">
            {step===1 && <div className="space-y-5"><div><h2 className="font-editorial text-2xl font-semibold">Contact information</h2><p className="text-sm text-secondary mt-1">We’ll use these details to confirm your order.</p></div><div className="grid sm:grid-cols-2 gap-4"><Field label="Full name" value={formData.name} onChange={v=>update("name",v)} placeholder="Your full name"/><Field label="Email address" type="email" value={formData.email} onChange={v=>update("email",v)} placeholder="you@example.com"/><Field label="Phone number" type="tel" value={formData.phone} onChange={v=>update("phone",v)} placeholder="03XX XXXXXXX"/><div className="hidden sm:block"/></div><div className="p-4 bg-[#faf9f6] flex gap-3"><ShieldCheck size={18} className="shrink-0 mt-0.5"/><p className="text-xs text-secondary">Your information is used only to process and deliver your order.</p></div><button type="button" disabled={!canContinue} onClick={()=>setStep(2)} className="w-full py-3.5 bg-charcoal text-white text-sm font-medium disabled:opacity-40">Continue to delivery <ArrowRight size={15} className="inline ml-2"/></button></div>}

            {step===2 && <div className="space-y-5"><div><h2 className="font-editorial text-2xl font-semibold">Delivery address</h2><p className="text-sm text-secondary mt-1">Where should we deliver your NOORÉ pieces?</p></div>{addresses.length>0 && <div><label className="text-xs font-medium">Saved addresses</label><select onChange={e=>{const a=addresses.find(x=>x.id===e.target.value); if(a) selectAddress(a)}} className="mt-2 w-full border border-black/10 px-4 py-3 text-sm bg-white focus:outline-none focus:border-charcoal"><option value="">Choose a saved address</option>{addresses.map(a=><option key={a.id} value={a.id}>{a.name} · {a.city}{a.default?" · Default":""}</option>)}</select></div>}<Field label="Street address" value={formData.address} onChange={v=>update("address",v)} placeholder="House / apartment / street"/><div className="grid sm:grid-cols-2 gap-4"><SelectField label="City" value={formData.city} onChange={v=>update("city",v)} options={cities}/><SelectField label="Province" value={formData.province} onChange={v=>update("province",v)} options={provinces}/><Field label="Postal code" value={formData.postal} onChange={v=>update("postal",v)} placeholder="54000"/></div><div className="flex gap-3"><button type="button" onClick={()=>setStep(1)} className="flex-1 py-3 border border-black/10 text-sm">Back</button><button type="button" disabled={!canContinue} onClick={()=>setStep(3)} className="flex-1 py-3 bg-charcoal text-white text-sm disabled:opacity-40">Continue to payment <ArrowRight size={15} className="inline ml-2"/></button></div></div>}

            {step===3 && <div className="space-y-6"><div><h2 className="font-editorial text-2xl font-semibold">Delivery & payment</h2><p className="text-sm text-secondary mt-1">Choose how you’d like your order delivered.</p></div><div><label className="text-xs font-medium uppercase tracking-wider">Delivery method</label><div className="mt-2 space-y-2">{[{id:"standard",name:"Standard delivery",desc:"2–4 business days",price:total>=settings.freeShippingThreshold?0:settings.standardShipping},{id:"express",name:"Express delivery",desc:"1–2 business days",price:settings.expressShipping}].map(option=><label key={option.id} className={`flex items-center gap-3 p-4 border cursor-pointer transition ${formData.deliveryMethod===option.id?"border-charcoal bg-[#faf9f6]":"border-black/10"}`}><input type="radio" name="delivery" value={option.id} checked={formData.deliveryMethod===option.id} onChange={e=>update("deliveryMethod",e.target.value)}/><Truck size={18}/><div className="flex-1"><p className="text-sm font-medium">{option.name}</p><p className="text-xs text-secondary mt-1">{option.desc}</p></div><span className="text-sm font-medium">{option.price===0?"FREE":`PKR ${option.price.toLocaleString()}`}</span></label>)}</div></div><div><label className="text-xs font-medium uppercase tracking-wider">Payment method</label><div className="mt-2 p-4 border border-charcoal bg-[#faf9f6] flex items-center gap-3"><div className="h-5 w-5 rounded-full border-[5px] border-charcoal"/><div className="flex-1"><p className="text-sm font-medium">Cash on Delivery</p><p className="text-xs text-secondary mt-1">Pay when your order arrives. No online payment required.</p></div><span className="text-[10px] uppercase tracking-wider border border-black/10 px-2 py-1">COD</span></div></div><div className="flex gap-3"><button type="button" onClick={()=>setStep(2)} className="flex-1 py-3 border border-black/10 text-sm">Back</button><button type="submit" disabled={loading} className="flex-1 py-3.5 bg-charcoal text-white text-sm font-medium disabled:opacity-50">{loading?"Placing order…":`Place order · PKR ${grandTotal.toLocaleString()}`}</button></div>{error&&<div className="p-3 bg-red-50 text-red-700 text-xs">{error}</div>}</div>}
          </form>
        </section>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-black/5 p-5 md:p-6"><div className="flex items-center justify-between"><h2 className="font-editorial text-2xl font-semibold">Your order</h2><Link href="/cart" className="text-xs underline">Edit bag</Link></div><div className="mt-5 max-h-64 overflow-y-auto space-y-4">{items.map(item=><div key={item.id||item.productId} className="flex gap-3"><img src={item.image} alt={item.name} className="w-16 h-20 object-cover bg-cream"/><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{item.name}</p>{(item as any).variantLabel&&<p className="text-[11px] text-secondary mt-1">{(item as any).variantLabel}</p>}<p className="text-xs text-secondary mt-1">Qty {item.quantity}</p></div><p className="text-sm font-medium">PKR {(item.price*item.quantity).toLocaleString()}</p></div>)}</div><div className="mt-5 pt-5 border-t border-black/5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-secondary">Subtotal</span><span>PKR {total.toLocaleString()}</span></div>{discount>0&&<div className="flex justify-between"><span className="text-secondary">Discount {coupon&&`(${coupon.code})`}</span><span>- PKR {discount.toLocaleString()}</span></div>}<div className="flex justify-between"><span className="text-secondary">Shipping</span><span>{shipping===0?"FREE":`PKR ${shipping.toLocaleString()}`}</span></div><div className="pt-4 mt-2 border-t border-black/5 flex justify-between font-semibold"><span>Total</span><span>PKR {grandTotal.toLocaleString()}</span></div></div></div>
          <div className="bg-white border border-black/5 p-5"><label className="text-xs uppercase tracking-[0.18em] font-medium">Promo code</label><div className="mt-3 flex gap-2"><input value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 min-w-0 border border-black/10 px-3 py-2.5 text-xs tracking-wider focus:outline-none focus:border-charcoal"/><button type="button" onClick={applyCoupon} disabled={couponLoading} className="px-4 bg-cream text-xs font-medium disabled:opacity-50">{couponLoading?"…":"Apply"}</button></div>{couponMessage&&<p className={`mt-2 text-xs ${coupon?.discount?"text-green-700":"text-secondary"}`}>{couponMessage}</p>}</div>
          {freeShippingGap>0&&formData.deliveryMethod==="standard"&&<div className="bg-charcoal text-white p-5"><p className="text-xs uppercase tracking-wider">Almost there</p><p className="font-editorial text-xl mt-1">Add PKR {freeShippingGap.toLocaleString()} for free standard shipping.</p></div>}
          <div className="flex gap-3 text-xs text-secondary"><MapPin size={15}/><span>Pakistan-wide delivery · Cash on Delivery</span></div>
        </aside>
      </div>
    </div>
  </main>
}

function Field({ label, value, onChange, placeholder, type="text" }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string }) {
  return <label className="block"><span className="text-xs font-medium">{label} *</span><input required type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full border border-black/10 px-4 py-3 text-sm focus:outline-none focus:border-charcoal"/></label>
}

function SelectField({ label, value, onChange, options }: { label:string; value:string; onChange:(v:string)=>void; options:string[] }) {
  return <label className="block relative"><span className="text-xs font-medium">{label} *</span><select required value={value} onChange={e=>onChange(e.target.value)} className="mt-2 appearance-none w-full border border-black/10 px-4 py-3 text-sm bg-white focus:outline-none focus:border-charcoal"><option value="">Select {label.toLowerCase()}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select><ChevronDown size={15} className="absolute right-3 bottom-3.5 pointer-events-none text-secondary"/></label>
}
