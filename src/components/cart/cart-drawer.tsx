"use client"

import Link from "next/link"
import { useCart } from "@/components/cart/cart-context"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, count, isOpen, closeCart } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl overflow-y-auto transition-transform">
        <div className="p-4 border-b border-cream flex justify-between items-center">
          <h2 className="font-semibold text-lg">Your Bag ({count})</h2>
          <button 
            onClick={closeCart}
            className="text-2xl hover:text-secondary transition"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-secondary">Your bag is empty</p>
            <Link 
              href="/products" 
              onClick={closeCart}
              className="inline-block mt-4 btn-primary"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 border-b border-cream pb-3">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <Link 
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="font-medium text-sm hover:text-secondary transition"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-secondary">PKR {item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 border border-cream rounded flex items-center justify-center text-sm hover:bg-cream transition"
                      >
                        -
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 border border-cream rounded flex items-center justify-center text-sm hover:bg-cream transition"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-red-600 hover:text-red-800 transition ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-cream p-4 bg-cream/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-secondary">Subtotal ({count} items)</span>
                <span className="font-semibold">PKR {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-secondary">Shipping</span>
                <span className="font-semibold">{total > 5000 ? "FREE" : "PKR 250"}</span>
              </div>
              <Link 
                href="/cart" 
                onClick={closeCart}
                className="block w-full py-3 text-center bg-charcoal text-white rounded font-medium hover:bg-charcoal/80 transition"
              >
                View Cart
              </Link>
              <Link 
                href="/checkout" 
                onClick={closeCart}
                className="block w-full mt-2 py-3 text-center border border-charcoal rounded font-medium hover:bg-charcoal hover:text-white transition"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}