"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"

const FREE_SHIPPING_THRESHOLD = 5000
const STANDARD_SHIPPING = 250

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)

  const itemCountLabel = useMemo(() => `${count} ${count === 1 ? "item" : "items"}`, [count])

  if (items.length === 0) {
    return (
      <main className="min-h-[65vh] bg-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-cream">
            <span className="text-3xl">✦</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-secondary">NOORÉ</p>
          <h1 className="font-editorial mt-3 text-4xl font-semibold">Your bag is waiting</h1>
          <p className="mx-auto mt-3 max-w-md text-secondary">
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
    <main className="bg-[#faf9f6] min-h-screen">
      <div className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-charcoal transition">
            <ArrowLeft size={16} /> Continue shopping
          </Link>
          <p className="text-xs uppercase tracking-[0.22em] font-medium">Your bag · {itemCountLabel}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <p className="text-xs uppercase tracking-[0.28em] text-secondary">Shopping bag</p>
          <h1 className="font-editorial mt-2 text-4xl md:text-5xl font-semibold">Your edit</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_390px] gap-8 lg:gap-12 items-start">
          <section className="bg-white border border-black/5">
            <div className="hidden sm:grid grid-cols-[1fr_110px_110px] gap-5 border-b border-black/5 px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-secondary">
              <span>Item</span><span>Quantity</span><span className="text-right">Total</span>
            </div>

            <div className="divide-y divide-black/5">
              {items.map((item) => {
                const variantLabel = (item as any).variantLabel as string | undefined
                const itemKey = item.id || item.productId
                return (
                  <article key={itemKey} className="p-4 sm:p-5 flex gap-4 md:gap-6">
                    <Link href={`/product/${item.slug}`} className="shrink-0">
                      <img src={item.image} alt={item.name} className="w-28 h-36 sm:w-32 sm:h-40 object-cover bg-cream" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div>
                          <Link href={`/product/${item.slug}`} className="font-medium hover:text-secondary transition">
                            {item.name}
                          </Link>
                          {variantLabel && <p className="mt-1 text-xs text-secondary">{variantLabel}</p>}
                          <p className="mt-2 text-sm">PKR {item.price.toLocaleString()}</p>
                        </div>
                        <p className="font-medium whitespace-nowrap">PKR {(item.price * item.quantity).toLocaleString()}</p>
                      </div>

                      <div className="mt-8 flex items-center justify-between gap-3">
                        <div className="flex items-center border border-black/10">
                          <button aria-label="Decrease quantity" onClick={() => updateQuantity(itemKey, item.quantity - 1)} className="h-9 w-9 flex items-center justify-center hover:bg-cream transition">
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button aria-label="Increase quantity" onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="h-9 w-9 flex items-center justify-center hover:bg-cream transition">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(itemKey)} className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-red-600 transition">
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="grid sm:grid-cols-3 gap-px bg-black/5 border-t border-black/5">
              <div className="bg-white p-5 flex gap-3"><Truck size={18} className="shrink-0" /><div><p className="text-sm font-medium">Fast delivery</p><p className="text-xs text-secondary mt-1">Pakistan-wide shipping</p></div></div>
              <div className="bg-white p-5 flex gap-3"><ShieldCheck size={18} className="shrink-0" /><div><p className="text-sm font-medium">Secure checkout</p><p className="text-xs text-secondary mt-1">Your details stay protected</p></div></div>
              <div className="bg-white p-5 flex gap-3"><Check size={18} className="shrink-0" /><div><p className="text-sm font-medium">Easy support</p><p className="text-xs text-secondary mt-1">We’re here when you need us</p></div></div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-black/5 p-5 md:p-6">
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span>{remainingForFreeShipping > 0 ? `Add PKR ${remainingForFreeShipping.toLocaleString()} for free shipping` : "You unlocked free shipping"}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-cream overflow-hidden"><div className="h-full bg-charcoal transition-all" style={{ width: `${progress}%` }} /></div>
              </div>

              <h2 className="font-editorial text-2xl font-semibold">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-secondary">Subtotal</span><span>PKR {total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Shipping</span><span>{shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`}</span></div>
                <div className="pt-4 border-t border-black/5 flex justify-between font-semibold"><span>Total</span><span>PKR {(total + shipping).toLocaleString()}</span></div>
              </div>

              <Link href="/checkout" className="mt-6 flex w-full items-center justify-center gap-2 bg-charcoal text-white py-3.5 text-sm font-medium hover:bg-charcoal/90 transition">
                Proceed to checkout <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-center text-[11px] text-secondary">Cash on Delivery available across Pakistan</p>
            </div>

            <div className="bg-white border border-black/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-medium">Have a promo code?</p>
              <p className="mt-2 text-xs text-secondary">Enter your code securely during checkout before placing your order.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
