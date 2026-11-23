"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, ChevronDown, LockKeyhole, MapPin, Minus, Plus, ShieldCheck, Truck } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"
import { useSession } from "next-auth/react"

type Address = { id: string; name: string; phone: string; address: string; city: string; province: string; postal: string; default: boolean }

type Coupon = { code: string; type: string; value: number; discount: number }
type ConfirmedOrder = {
  name: string; email: string; phone: string; address: string; city: string; province: string; postal: string;
  deliveryMethod: string; subtotal: number; discount: number; shipping: number; total: number;
  items: Array<{ id: string; name: string; image: string; quantity: number; price: number; variantLabel: string }>
}

const FALLBACK = { freeShippingThreshold: 5000, standardShipping: 250, expressShipping: 500 }

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, count, clearCart } = useCart()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null)
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
      setConfirmedOrder({
        name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone.trim(),
        address: formData.address.trim(), city: formData.city, province: formData.province, postal: formData.postal.trim(),
        deliveryMethod: formData.deliveryMethod, subtotal: total, discount, shipping, total: grandTotal,
        items: items.map(item => ({
          id: item.id || item.productId, name: item.name, image: item.image, quantity: item.quantity, price: item.price,
          variantLabel: (item as any).variantLabel || "",
        })),
      })
      localStorage.setItem("last_order_number", data.orderNumber)
      clearCart()
      setStep(4)
    } catch (e: any) { setError(e?.message || "Something went wrong. Please try again.") }
    finally { setLoading(false) }
  }

  if (!items.length && step !== 4) return null

  if (step === 4) {
    return <main className="min-h-screen bg-[#11100f] px-4 py-10 text-[#f5f0e7] sm:py-16">
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden border border-[#4a4030] bg-[#171615]">
          <div className="h-1.5 bg-gradient-to-r from-[#8d6c3e] via-[#e0c48e] to-[#8d6c3e]" />
          <div className="px-5 py-9 text-center sm:px-10 sm:py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c6a15b]/50 bg-[#c6a15b]/10 text-[#e0c48e]"><Check size={30}/></div>
            <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-[#c6a879]">Thank you for choosing NOORÉ</p>
            <h1 className="mt-2 font-editorial text-4xl font-semibold sm:text-5xl">Order confirmed</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#b9b0a2]">Your order has been received. Keep your order number handy to check delivery progress.</p>
            <div className="mx-auto mt-7 max-w-sm border border-[#4a4030] bg-[#11100f] p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9b0a2]">Your order number</p>
              <p className="mt-2 break-all font-mono text-2xl font-semibold text-[#e0c48e]">#{orderNumber}</p>
              <p className="mt-2 text-xs text-[#b9b0a2]">Payment · Cash on Delivery</p>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={"/order-tracking?orderNumber="+encodeURIComponent(orderNumber)+"&email="+encodeURIComponent(confirmedOrder?.email || "")} className="inline-flex items-center justify-center gap-2 bg-[#c6a15b] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#171615] hover:bg-[#d8b978]"><Truck size={16}/> Track your order</Link>
              <Link href="/account/orders" className="inline-flex items-center justify-center border border-[#4a4030] px-6 py-3.5 text-xs font-medium hover:border-[#c6a15b]">My orders</Link>
            </div>
          </div>
        </section>
        {confirmedOrder && <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="border border-[#3a3328] bg-[#171615] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a879]">Purchase details</p><h2 className="mt-1 font-editorial text-2xl">Items ordered</h2></div><span className="text-xs text-[#b9b0a2]">{confirmedOrder.items.length} item{confirmedOrder.items.length===1?"":"s"}</span></div>
            <div className="mt-5 divide-y divide-[#3a3328]">
              {confirmedOrder.items.map(item=><div key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0"><img src={item.image || "/placeholder.jpg"} alt={item.name} className="h-20 w-16 shrink-0 bg-[#24211c] object-cover"/><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p>{item.variantLabel&&<p className="mt-1 text-xs text-[#b9b0a2]">{item.variantLabel}</p>}<p className="mt-2 text-xs text-[#b9b0a2]">Qty {item.quantity} × PKR {item.price.toLocaleString()}</p></div><p className="shrink-0 text-sm font-medium">PKR {(item.quantity*item.price).toLocaleString()}</p></div>)}
            </div>
          </section>
          <aside className="space-y-5">
            <section className="border border-[#3a3328] bg-[#171615] p-5">
              <h2 className="font-semibold">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#b9b0a2]">Subtotal</span><span>PKR {confirmedOrder.subtotal.toLocaleString()}</span></div>{confirmedOrder.discount>0&&<div className="flex justify-between"><span className="text-[#b9b0a2]">Discount</span><span>- PKR {confirmedOrder.discount.toLocaleString()}</span></div>}<div className="flex justify-between"><span className="text-[#b9b0a2]">Shipping</span><span>{confirmedOrder.shipping===0?"FREE":"PKR "+confirmedOrder.shipping.toLocaleString()}</span></div><div className="flex justify-between border-t border-[#3a3328] pt-3 font-semibold"><span>Total due</span><span>PKR {confirmedOrder.total.toLocaleString()}</span></div></div>
              <p className="mt-4 border border-[#4a4030] bg-[#11100f] p-3 text-xs text-[#b9b0a2]">Cash on Delivery · Pay when your order arrives.</p>
            </section>
            <section className="border border-[#3a3328] bg-[#171615] p-5">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-[#c6a15b]"/><h2 className="font-semibold">Delivery address</h2></div>
              <p className="mt-3 text-sm font-medium">{confirmedOrder.name}</p><p className="mt-1 text-sm leading-6 text-[#b9b0a2]">{confirmedOrder.address}<br/>{confirmedOrder.city}, {confirmedOrder.province} {confirmedOrder.postal}</p><p className="mt-2 text-xs text-[#b9b0a2]">{confirmedOrder.phone}<br/>{confirmedOrder.email}</p>
            </section>
          </aside>
        </div>}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border border-[#3a3328] bg-[#171615] p-5 sm:flex-row">
          <div className="flex items-center gap-3"><ShieldCheck size={20} className="text-[#c6a15b]"/><div><p className="text-sm font-medium">Need help with your order?</p><p className="mt-1 text-xs text-[#b9b0a2]">Our support team is here to help.</p></div></div>
          <a href={"https://wa.me/923150490498?text="+encodeURIComponent("Hello NOORÉ, I need help with order #"+orderNumber+".")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-[#c6a15b] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#e0c48e] hover:bg-[#c6a15b]/10">WhatsApp support</a>
        </div>
        <div className="mt-6 text-center"><Link href="/products" className="text-xs uppercase tracking-[0.18em] text-[#b9b0a2] underline underline-offset-4 hover:text-[#e0c48e]">Continue shopping</Link></div>
      </div>
    </main>
  }

  return <main className="min-h-screen bg-[#11100f]">
    <div className="bg-[#171615] border-b border-[#3a3328]"><div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between"><Link href="/cart" className="inline-flex items-center gap-2 text-sm text-[#b9b0a2] hover:text-[#f5f0e7]"><ArrowLeft size={16}/> Bag</Link><p className="text-xs uppercase tracking-[0.2em]">Secure checkout</p><div className="flex items-center gap-1 text-xs text-[#b9b0a2]"><LockKeyhole size={14}/> Secure</div></div></div>
    <div className="max-w-7xl mx-auto px-3 pb-28 pt-6 sm:px-4 sm:py-8 md:py-12">
       <div className="mb-7 grid gap-3 sm:grid-cols-3">
         <div className="flex items-center gap-3 border border-[#3a3328] bg-[#171615] p-4"><ShieldCheck size={17}/><div><p className="text-xs font-medium">Secure checkout</p><p className="text-[11px] text-[#b9b0a2] mt-0.5">Protected order details</p></div></div>
         <div className="flex items-center gap-3 border border-[#3a3328] bg-[#171615] p-4"><Truck size={17}/><div><p className="text-xs font-medium">Pakistan-wide</p><p className="text-[11px] text-[#b9b0a2] mt-0.5">Reliable delivery</p></div></div>
         <div className="flex items-center gap-3 border border-[#3a3328] bg-[#171615] p-4"><LockKeyhole size={17}/><div><p className="text-xs font-medium">COD only</p><p className="text-[11px] text-[#b9b0a2] mt-0.5">Pay when delivered</p></div></div>
       </div>
      <div className="mb-6 sm:mb-8"><p className="text-[10px] uppercase tracking-[0.28em] text-[#b9b0a2]">NOORÉ checkout</p><h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold mt-2">Complete your order</h1></div>
      <div className="grid lg:grid-cols-[1fr_390px] gap-8 lg:gap-12 items-start">
        <section>
          <div className="bg-[#171615] border border-[#3a3328] p-3 sm:p-4 mb-5"><div className="grid grid-cols-3 gap-2">{["Contact", "Delivery", "Payment"].map((label, i) => { const n=i+1; return <button key={label} type="button" onClick={() => n < step && setStep(n)} className={`text-left ${n < step ? "cursor-pointer" : "cursor-default"}`}><div className="flex items-center gap-2"><span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${step===n?"bg-[#c6a15b] text-[#171615]":step>n?"bg-black text-white":"bg-[#24211c] text-[#b9b0a2]"}`}>{step>n?<Check size={13}/>:n}</span><span className={`text-[10px] sm:text-xs ${step===n?"font-medium":"text-[#b9b0a2]"}`}>{label}</span></div><div className="h-0.5 mt-3 bg-[#24211c]"><div className={`h-full bg-charcoal transition-all ${step>n?"w-full":step===n?"w-1/2":"w-0"}`}/></div></button>})}</div></div>

          <form id="noore-checkout-form" onSubmit={placeOrder} className="bg-[#171615] border border-[#3a3328] p-4 sm:p-5 md:p-7">
            {step===1 && <div className="space-y-5"><div><h2 className="font-editorial text-2xl font-semibold">Contact information</h2><p className="text-sm text-[#b9b0a2] mt-1">We’ll use these details to confirm your order.</p></div><div className="grid sm:grid-cols-2 gap-4"><Field label="Full name" autoComplete="name" value={formData.name} onChange={v=>update("name",v)} placeholder="Your full name"/><Field label="Email address" autoComplete="email" type="email" value={formData.email} onChange={v=>update("email",v)} placeholder="you@example.com"/><Field label="Phone number" autoComplete="tel" inputMode="tel" type="tel" value={formData.phone} onChange={v=>update("phone",v)} placeholder="03XX XXXXXXX"/><div className="hidden sm:block"/></div><div className="p-4 bg-[#11100f] flex gap-3"><ShieldCheck size={18} className="shrink-0 mt-0.5"/><p className="text-xs text-[#b9b0a2]">Your information is used only to process and deliver your order.</p></div><button type="button" disabled={!canContinue} onClick={()=>setStep(2)} className="w-full py-3.5 bg-[#c6a15b] text-[#171615] text-sm font-medium disabled:opacity-40">Continue to delivery <ArrowRight size={15} className="inline ml-2"/></button></div>}

            {step===2 && <div className="space-y-5"><div><h2 className="font-editorial text-2xl font-semibold">Delivery address</h2><p className="text-sm text-[#b9b0a2] mt-1">Where should we deliver your NOORÉ pieces?</p></div>{addresses.length>0 && <div><label className="text-xs font-medium">Saved addresses</label><select onChange={e=>{const a=addresses.find(x=>x.id===e.target.value); if(a) selectAddress(a)}} className="mt-2 w-full border border-[#4a4030] px-4 py-3 text-sm bg-[#171615] focus:outline-none focus:border-charcoal"><option value="">Choose a saved address</option>{addresses.map(a=><option key={a.id} value={a.id}>{a.name} · {a.city}{a.default?" · Default":""}</option>)}</select></div>}<Field label="Street address" autoComplete="street-address" value={formData.address} onChange={v=>update("address",v)} placeholder="House / apartment / street"/><div className="grid sm:grid-cols-2 gap-4"><SelectField label="City" value={formData.city} onChange={v=>update("city",v)} options={cities}/><SelectField label="Province" value={formData.province} onChange={v=>update("province",v)} options={provinces}/><Field label="Postal code" autoComplete="postal-code" inputMode="numeric" value={formData.postal} onChange={v=>update("postal",v)} placeholder="54000"/></div><div className="flex gap-3"><button type="button" onClick={()=>setStep(1)} className="flex-1 py-3 border border-[#4a4030] text-sm">Back</button><button type="button" disabled={!canContinue} onClick={()=>setStep(3)} className="flex-1 py-3 bg-[#c6a15b] text-[#171615] text-sm disabled:opacity-40">Continue to payment <ArrowRight size={15} className="inline ml-2"/></button></div></div>}

            {step===3 && <div className="space-y-6"><div><h2 className="font-editorial text-2xl font-semibold">Delivery & payment</h2><p className="text-sm text-[#b9b0a2] mt-1">Review your delivery details and choose how you’d like your order delivered.</p></div><div className="border border-[#4a4030] bg-[#11100f] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.18em] text-[#b9b0a2]">Delivering to</p><p className="mt-2 text-sm font-medium">{formData.name}</p><p className="mt-1 text-xs leading-5 text-[#b9b0a2]">{formData.address}, {formData.city}, {formData.province} {formData.postal}</p><p className="mt-1 text-xs text-[#b9b0a2]">{formData.phone} · {formData.email}</p></div><button type="button" onClick={()=>setStep(2)} className="shrink-0 text-xs text-[#d6b77c] underline underline-offset-4">Edit</button></div></div><div><label className="text-xs font-medium uppercase tracking-wider">Delivery method</label><div className="mt-2 space-y-2">{[{id:"standard",name:"Standard delivery",desc:"2–4 business days",price:total>=settings.freeShippingThreshold?0:settings.standardShipping},{id:"express",name:"Express delivery",desc:"1–2 business days",price:settings.expressShipping}].map(option=><label key={option.id} className={`flex items-center gap-3 p-4 border cursor-pointer transition ${formData.deliveryMethod===option.id?"border-charcoal bg-[#11100f]":"border-[#4a4030]"}`}><input type="radio" name="delivery" value={option.id} checked={formData.deliveryMethod===option.id} onChange={e=>update("deliveryMethod",e.target.value)}/><Truck size={18}/><div className="flex-1"><p className="text-sm font-medium">{option.name}</p><p className="text-xs text-[#b9b0a2] mt-1">{option.desc}</p></div><span className="text-sm font-medium">{option.price===0?"FREE":`PKR ${option.price.toLocaleString()}`}</span></label>)}</div></div><div><label className="text-xs font-medium uppercase tracking-wider">Payment method</label><div className="mt-2 p-4 border border-charcoal bg-[#11100f] flex items-center gap-3"><div className="h-5 w-5 rounded-full border-[5px] border-charcoal"/><div className="flex-1"><p className="text-sm font-medium">Cash on Delivery</p><p className="text-xs text-[#b9b0a2] mt-1">Pay when your order arrives. No online payment required.</p></div><span className="text-[10px] uppercase tracking-wider border border-[#4a4030] px-2 py-1">COD ONLY</span></div></div><div className="flex gap-3"><button type="button" onClick={()=>setStep(2)} className="flex-1 py-3 border border-[#4a4030] text-sm">Back</button><button type="submit" disabled={loading} className="flex-1 py-3.5 bg-[#c6a15b] text-[#171615] text-sm font-medium disabled:opacity-50">{loading?"Placing order…":`Place order · PKR ${grandTotal.toLocaleString()}`}</button></div>{error&&<div className="p-3 bg-red-50 text-red-700 text-xs">{error}</div>}</div>}
          </form>
        </section>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-[#171615] border border-[#3a3328] p-5 md:p-6"><div className="flex items-center justify-between"><h2 className="font-editorial text-2xl font-semibold">Your order</h2><Link href="/cart" className="text-xs underline">Edit bag</Link></div><div className="mt-5 max-h-64 overflow-y-auto space-y-4">{items.map(item=><div key={item.id||item.productId} className="flex gap-3"><img src={item.image} alt={item.name} className="w-16 h-20 object-cover bg-[#24211c]"/><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{item.name}</p>{(item as any).variantLabel&&<p className="text-[11px] text-[#b9b0a2] mt-1">{(item as any).variantLabel}</p>}<p className="text-xs text-[#b9b0a2] mt-1">Qty {item.quantity}</p></div><p className="text-sm font-medium">PKR {(item.price*item.quantity).toLocaleString()}</p></div>)}</div><div className="mt-5 pt-5 border-t border-[#3a3328] space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#b9b0a2]">Subtotal</span><span>PKR {total.toLocaleString()}</span></div>{discount>0&&<div className="flex justify-between"><span className="text-[#b9b0a2]">Discount {coupon&&`(${coupon.code})`}</span><span>- PKR {discount.toLocaleString()}</span></div>}<div className="flex justify-between"><span className="text-[#b9b0a2]">Shipping</span><span>{shipping===0?"FREE":`PKR ${shipping.toLocaleString()}`}</span></div><div className="pt-4 mt-2 border-t border-[#3a3328] flex justify-between font-semibold"><span>Total</span><span>PKR {grandTotal.toLocaleString()}</span></div></div></div>
          <div className="bg-[#171615] border border-[#3a3328] p-5"><label className="text-xs uppercase tracking-[0.18em] font-medium">Promo code</label><div className="mt-3 flex gap-2"><input value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 min-w-0 border border-[#4a4030] px-3 py-2.5 text-xs tracking-wider focus:outline-none focus:border-charcoal"/><button type="button" onClick={applyCoupon} disabled={couponLoading} className="px-4 bg-[#24211c] text-xs font-medium disabled:opacity-50">{couponLoading?"…":"Apply"}</button></div>{couponMessage&&<div className="mt-2 flex items-start justify-between gap-3"><p role="status" className={`text-xs ${coupon ? "text-emerald-400" : "text-red-300"}`}>{couponMessage}</p>{coupon&&<button type="button" onClick={()=>{setCoupon(null);setCouponInput("");setCouponMessage("Coupon removed.")}} className="shrink-0 text-[10px] uppercase tracking-wider text-[#d6b77c] underline underline-offset-4">Remove</button>}</div>}</div>
          {formData.deliveryMethod==="standard"&&<div className="border border-[#4a4030] bg-[#171615] p-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] uppercase tracking-[0.18em] text-[#b9b0a2]">Free standard delivery</p><p className="text-xs font-medium text-[#d6b77c]">{freeShippingGap===0?"Unlocked":"PKR "+freeShippingGap.toLocaleString()+" to go"}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#3a3328]"><div className="h-full bg-[#c6a15b] transition-all" style={{width:`${Math.min(100, settings.freeShippingThreshold > 0 ? total / settings.freeShippingThreshold * 100 : 100)}%`}}/></div><p className="mt-3 text-xs text-[#b9b0a2]">{freeShippingGap===0?"Your order qualifies for free standard shipping.":"Add a little more to qualify for free standard shipping."}</p></div>}
          <div className="flex gap-3 text-xs text-[#b9b0a2]"><MapPin size={15}/><span>Pakistan-wide delivery · Cash on Delivery</span></div>
        </aside>
      </div>
    </div>
    {step === 3 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#4a4030] bg-[#171615]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur md:hidden">
      <button type="submit" form="noore-checkout-form" disabled={loading} className="mx-auto flex h-12 w-full max-w-7xl items-center justify-center bg-charcoal text-xs font-medium uppercase tracking-[0.14em] text-white disabled:opacity-50">
        {loading ? "Placing order…" : `Place COD order · PKR ${grandTotal.toLocaleString()}`}
      </button>
    </div>}
  </main>
}

function Field({ label, value, onChange, placeholder, type="text", autoComplete, inputMode }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; autoComplete?:string; inputMode?:"text"|"numeric"|"tel"|"email" }) {
  return <label className="block"><span className="text-xs font-medium">{label} *</span><input required type={type} autoComplete={autoComplete} inputMode={inputMode} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full border border-[#4a4030] bg-[#171615] px-4 py-3 text-sm text-[#f5f0e7] placeholder:text-[#81796e] focus:outline-none focus:border-[#c6a15b]"/></label>
}

function SelectField({ label, value, onChange, options }: { label:string; value:string; onChange:(v:string)=>void; options:string[] }) {
  return <label className="block relative"><span className="text-xs font-medium">{label} *</span><select required value={value} onChange={e=>onChange(e.target.value)} className="mt-2 appearance-none w-full border border-[#4a4030] px-4 py-3 text-sm bg-[#171615] focus:outline-none focus:border-charcoal"><option value="">Select {label.toLowerCase()}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select><ChevronDown size={15} className="absolute right-3 bottom-3.5 pointer-events-none text-[#b9b0a2]"/></label>
}
