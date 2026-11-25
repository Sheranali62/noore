"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"

const FREE_SHIPPING_THRESHOLD = 5000
const STANDARD_SHIPPING = 250

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count, hydrated } = useCart()
  const [shippingSettings, setShippingSettings] = useState({ freeShippingThreshold: FREE_SHIPPING_THRESHOLD, standardShipping: STANDARD_SHIPPING })
  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(data => {
      const s = data?.settings || data
      if (s) setShippingSettings({ freeShippingThreshold: Number(s.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD), standardShipping: Number(s.standardShipping ?? STANDARD_SHIPPING) })
    }).catch(() => {})
  }, [])
  const itemCountLabel = useMemo(() => `${count} ${count === 1 ? "item" : "items"}`, [count])

  if (!hydrated) return null

  const remainingForFreeShipping = Math.max(0, shippingSettings.freeShippingThreshold - total)
  const shipping = total >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShipping
  const progress = Math.min(100, (total / shippingSettings.freeShippingThreshold) * 100)

  if (items.length === 0) {
    return (
      <main className="min-h-[65vh] bg-[#F7F6F2] text-[#535F4C]">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#EAE8DF]">
            <span className="text-3xl">✦</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#6E7568]">NOORÉ</p>
          <h1 className="font-editorial mt-3 text-4xl font-semibold">Your bag is waiting</h1>
          <p className="mx-auto mt-3 max-w-md text-[#6E7568]">
            Discover considered pieces made to become part of your everyday wardrobe.
          </p>
          <Link href="/products" className="btn-primary mt-8 inline-flex items-center gap-2">
            Explore the collection <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#F7F6F2] min-h-screen">
      <div className="border-b border-[#B8AA91] bg-[#F7F6F2]">
        <div className="max-w-7xl mx-auto px-3 py-4 flex items-center justify-between gap-3 sm:px-4">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#6E7568] hover:text-[#535F4C] transition">
            <ArrowLeft size={16} /> Continue shopping
          </Link>
          <p className="text-right text-[10px] uppercase tracking-[0.16em] font-medium sm:text-xs sm:tracking-[0.22em]">Your bag · {itemCountLabel}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 pb-28 pt-6 sm:px-4 sm:py-8 md:py-12">
       <div className="mb-8 border border-[#B8AA91] bg-[#F7F6F2] px-5 py-4">
         <div className="flex items-center justify-between gap-4 text-xs">
           <div>
             <span className="font-medium">Free shipping</span>
             <span className="text-[#6E7568]"> · {remainingForFreeShipping > 0 ? `Add PKR ${remainingForFreeShipping.toLocaleString()}` : "Unlocked"}</span>
           </div>
           <span className="text-[#6E7568]">{Math.round(progress)}%</span>
         </div>
         <div className="mt-3 h-1 bg-[#EAE8DF] overflow-hidden">
           <div className="h-full bg-[#535F4C] transition-all duration-500" style={{ width: `${progress}%` }} />
         </div>
       </div>
        <div className="mb-6 sm:mb-8 md:mb-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E7568]">Shopping bag</p>
          <h1 className="font-editorial mt-2 text-3xl font-semibold sm:text-4xl md:text-5xl">Your edit</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_390px] gap-8 lg:gap-12 items-start">
          <section className="bg-[#F7F6F2] border border-[#B8AA91]">
            <div className="hidden sm:grid grid-cols-[1fr_110px_110px] gap-5 border-b border-[#B8AA91] px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-[#6E7568]">
              <span>Item</span><span>Quantity</span><span className="text-right">Total</span>
            </div>

            <div className="divide-y divide-[#B8AA91]">
              {items.map((item) => {
                const variantLabel = (item as any).variantLabel as string | undefined
                const itemKey = item.id || item.productId
                return (
                  <article key={itemKey} className="p-3 sm:p-5 flex gap-3 sm:gap-4 md:gap-6">
                    <Link href={`/product/${item.slug}`} className="shrink-0">
                      <img src={item.image} alt={item.name} className="h-28 w-20 sm:h-40 sm:w-32 object-cover bg-[#EAE8DF]" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div>
                          <Link href={`/product/${item.slug}`} className="font-medium hover:text-[#6E7568] transition">
                            {item.name}
                          </Link>
                          {variantLabel && <p className="mt-1 text-xs text-[#6E7568]">{variantLabel}</p>}
                          <p className="mt-2 text-sm">PKR {item.price.toLocaleString()}</p>
                        </div>
                        <p className="font-medium whitespace-nowrap">PKR {(item.price * item.quantity).toLocaleString()}</p>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-2 sm:mt-8 sm:gap-3">
                        <div className="flex items-center border border-[#B8AA91]">
                          <button aria-label="Decrease quantity" onClick={() => updateQuantity(itemKey, item.quantity - 1)} className="h-9 w-9 flex items-center justify-center hover:bg-[#EAE8DF] transition">
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button aria-label="Increase quantity" disabled={item.quantity >= 99} onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="h-9 w-9 flex items-center justify-center hover:bg-[#EAE8DF] transition disabled:opacity-30">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(itemKey)} className="inline-flex items-center gap-1.5 text-xs text-[#6E7568] hover:text-red-600 transition">
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="grid sm:grid-cols-3 gap-px bg-black/5 border-t border-[#B8AA91]">
              <div className="bg-[#F7F6F2] p-5 flex gap-3"><Truck size={18} className="shrink-0" /><div><p className="text-sm font-medium">Fast delivery</p><p className="text-xs text-[#6E7568] mt-1">Pakistan-wide shipping</p></div></div>
              <div className="bg-[#F7F6F2] p-5 flex gap-3"><ShieldCheck size={18} className="shrink-0" /><div><p className="text-sm font-medium">Secure checkout</p><p className="text-xs text-[#6E7568] mt-1">Your details stay protected</p></div></div>
              <div className="bg-[#F7F6F2] p-5 flex gap-3"><Check size={18} className="shrink-0" /><div><p className="text-sm font-medium">Easy support</p><p className="text-xs text-[#6E7568] mt-1">We’re here when you need us</p></div></div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-[#F7F6F2] border border-[#B8AA91] p-5 md:p-6">
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span>{remainingForFreeShipping > 0 ? `Add PKR ${remainingForFreeShipping.toLocaleString()} for free shipping` : "You unlocked free shipping"}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-[#EAE8DF] overflow-hidden"><div className="h-full bg-[#535F4C] transition-all" style={{ width: `${progress}%` }} /></div>
              </div>

              <h2 className="font-editorial text-2xl font-semibold">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#6E7568]">Subtotal</span><span>PKR {total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#6E7568]">Shipping</span><span>{shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`}</span></div>
                <div className="pt-4 border-t border-[#B8AA91] flex justify-between font-semibold"><span>Total</span><span>PKR {(total + shipping).toLocaleString()}</span></div>
              </div>

              <Link href="/checkout" className="mt-6 flex w-full items-center justify-center gap-2 bg-[#535F4C] text-[#F7F6F2] py-3.5 text-sm font-medium hover:bg-[#465340] transition">
                Proceed to checkout <ArrowRight size={16} />
              </Link>
              <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#B8AA91] pt-4 text-[11px] text-[#6E7568]"><ShieldCheck size={13}/> Cash on Delivery · Pakistan-wide</div>
            </div>

            <div className="bg-[#F7F6F2] border border-[#B8AA91] p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-medium">Have a promo code?</p>
              <p className="mt-2 text-xs text-[#6E7568]">Enter your code securely during checkout before placing your order.</p>
            </div>
          </aside>
        </div>
      </div>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#B8AA91] bg-[#F7F6F2]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#6E7568]">Total</p>
          <p className="text-sm font-semibold">PKR {(total + shipping).toLocaleString()}</p>
        </div>
        <Link href="/checkout" className="flex h-11 shrink-0 items-center gap-2 bg-[#535F4C] px-5 text-xs font-medium uppercase tracking-[0.14em] text-[#F7F6F2]">
          Checkout <ArrowRight size={15}/>
        </Link>
      </div>
    </div>
    </main>
  )
}
