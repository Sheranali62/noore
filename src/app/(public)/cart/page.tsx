"use client"

import Link from "next/link"
import { useCart } from "@/components/cart/cart-context"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="font-editorial text-3xl font-semibold mb-2">Your Bag is Empty</h1>
        <p className="text-secondary mb-6">Start shopping to add items to your bag</p>
        <Link href="/products" className="btn-primary inline-block">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-editorial text-3xl font-semibold mb-8">Your Bag</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 border border-cream rounded-lg">
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <Link href={`/product/${item.slug}`}>
                  <h3 className="font-medium hover:text-secondary transition">{item.name}</h3>
                </Link>
                <p className="text-sm text-secondary">PKR {item.price.toLocaleString()}</p>
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex border border-cream rounded">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-cream transition"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 min-w-[40px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-cream transition"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-sm text-red-600 hover:text-red-800 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">PKR {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className="bg-cream p-6 rounded-lg">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Subtotal ({count} items)</span>
                <span>PKR {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Shipping</span>
                <span>{total > 5000 ? "Free" : "PKR 250"}</span>
              </div>
              <div className="border-t border-cream pt-2 mt-2">
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>PKR {(total + (total > 5000 ? 0 : 250)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full mt-4 py-3 text-center bg-charcoal text-white rounded font-medium hover:bg-charcoal/80 transition"
            >
              Proceed to Checkout
            </Link>
            
            <Link
              href="/products"
              className="block w-full mt-2 py-3 text-center border border-cream rounded font-medium hover:border-charcoal transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}