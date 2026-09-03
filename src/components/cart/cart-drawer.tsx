"use client"

import Link from "next/link"
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"
import { useEffect, useState } from "react"

const FREE_SHIPPING_THRESHOLD = 5000
const STANDARD_SHIPPING = 250

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, count, isOpen, closeCart } = useCart()
  const [shippingSettings, setShippingSettings] = useState({ freeShippingThreshold: FREE_SHIPPING_THRESHOLD, standardShipping: STANDARD_SHIPPING })
  useEffect(() => {
    if (!isOpen) return
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(data => {
      const s = data?.settings || data
      if (s) setShippingSettings({ freeShippingThreshold: Number(s.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD), standardShipping: Number(s.standardShipping ?? STANDARD_SHIPPING) })
    }).catch(() => {})
  }, [isOpen])
  if (!isOpen) return null

  const remaining = Math.max(0, shippingSettings.freeShippingThreshold - total)
  const progress = Math.min(100, (total / shippingSettings.freeShippingThreshold) * 100)
  const shipping = total >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShipping

  return (
    <>
      <button aria-label="Close cart" className="fixed inset-0 bg-black/40 z-50 cursor-default" onClick={closeCart} />
      <aside role="dialog" aria-modal="true" aria-label="Shopping bag" className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white z-[51] shadow-2xl flex flex-col">
        <div className="px-5 py-5 border-b border-black/5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-secondary">NOORÉ</p>
            <h2 className="font-editorial text-2xl font-semibold mt-0.5">Your bag <span className="text-sm font-sans text-secondary">({count})</span></h2>
          </div>
          <button onClick={closeCart} aria-label="Close cart" className="h-9 w-9 flex items-center justify-center hover:bg-cream transition"><X size={19} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag size={30} strokeWidth={1.3} />
            <h3 className="font-editorial text-2xl font-semibold mt-4">Your bag is empty</h3>
            <p className="text-sm text-secondary mt-2 max-w-xs">Find your next favourite piece from the NOORÉ collection.</p>
            <Link href="/products" onClick={closeCart} className="btn-primary mt-6">Shop collection</Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-5">
              <div className="flex justify-between text-[11px] mb-2"><span>{remaining ? `PKR ${remaining.toLocaleString()} away from free shipping` : "Free shipping unlocked"}</span><span>{Math.round(progress)}%</span></div>
              <div className="h-1 bg-cream"><div className="h-full bg-charcoal transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {items.map((item) => {
                const key = item.id || item.productId
                const variantLabel = (item as any).variantLabel as string | undefined
                return (
                  <div key={key} className="flex gap-3">
                    <Link href={`/product/${item.slug}`} onClick={closeCart} className="shrink-0"><img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-cream" /></Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2"><Link href={`/product/${item.slug}`} onClick={closeCart} className="text-sm font-medium hover:text-secondary transition">{item.name}</Link><button aria-label={`Remove ${item.name}`} onClick={() => removeItem(key)} className="text-secondary hover:text-red-600"><Trash2 size={14} /></button></div>
                      {variantLabel && <p className="text-[11px] text-secondary mt-1">{variantLabel}</p>}
                      <p className="text-xs mt-1">PKR {item.price.toLocaleString()}</p>
                      <div className="mt-3 flex items-center justify-between"><div className="flex items-center border border-black/10"><button onClick={() => updateQuantity(key, item.quantity - 1)} className="h-7 w-7 flex items-center justify-center hover:bg-cream"><Minus size={12} /></button><span className="w-7 text-center text-xs">{item.quantity}</span><button onClick={() => updateQuantity(key, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center hover:bg-cream"><Plus size={12} /></button></div><span className="text-sm font-medium">PKR {(item.price * item.quantity).toLocaleString()}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-black/5 bg-[#faf9f6] p-5">
              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-[9px] uppercase tracking-[.12em] text-secondary"><span>COD</span><span>Easy exchange</span><span>Secure checkout</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Subtotal</span><span>PKR {total.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm mt-2"><span className="text-secondary">Shipping</span><span>{shipping ? `PKR ${shipping.toLocaleString()}` : "FREE"}</span></div>
              <div className="flex justify-between font-semibold mt-4 pt-4 border-t border-black/5"><span>Total</span><span>PKR {(total + shipping).toLocaleString()}</span></div>
              <Link href="/cart" onClick={closeCart} className="mt-4 flex items-center justify-center gap-2 w-full py-3 border border-charcoal text-sm font-medium hover:bg-charcoal hover:text-white transition">View bag</Link>
              <Link href="/checkout" onClick={closeCart} className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition">Checkout <ArrowRight size={15} /></Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
