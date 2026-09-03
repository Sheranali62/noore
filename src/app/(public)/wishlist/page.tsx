"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useCart } from "@/components/cart/cart-context"
import { RecommendationShelf } from "@/components/product/recommendation-shelf"

type WishlistItem = {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    salePrice: number | null
    images: string[]
    category: string
    stock: number
  }
}

export default function WishlistPage() {
  const { data: session } = useSession()
  const { addItem } = useCart()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWishlist()
  }, [session])

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist")
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        setItems(items.filter(item => item.productId !== productId))
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    }
  }

  const moveToCart = async (item: WishlistItem) => {
    addItem({
      id: item.productId,
      productId: item.productId,
      name: item.product.name,
      price: item.product.salePrice || item.product.price,
      image: item.product.images[0] || "/placeholder.jpg",
      slug: item.product.slug,
    })
    await removeFromWishlist(item.productId)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-cream py-16 px-4">
        <div className="max-w-xl mx-auto bg-white border border-cream rounded-2xl p-10 text-center">
          <div className="text-5xl">♡</div>
          <h1 className="font-editorial text-3xl mt-4">Your wishlist is personal</h1>
          <p className="text-secondary mt-2">Sign in to save your favourite NOORÉ pieces and access them from any device.</p>
          <div className="flex justify-center gap-3 mt-6"><Link href="/login" className="bg-charcoal text-white rounded-lg px-6 py-3">Sign in</Link><Link href="/register" className="border border-cream rounded-lg px-6 py-3">Create account</Link></div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="font-editorial text-4xl font-semibold">My Wishlist</h1>
          <span className="text-secondary text-sm">{items.length} items</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-cream p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="font-editorial text-2xl font-semibold">Your Wishlist is Empty</h2>
            <p className="text-secondary mt-2">Save your favorite items here</p>
            <Link href="/products" className="inline-block mt-6 bg-charcoal text-white px-6 py-3 rounded font-medium hover:bg-charcoal/80 transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item) => {
              const product = item.product
              const isOnSale = product.salePrice && product.salePrice < product.price
              const inStock = product.stock > 0

              return (
                <div key={item.id} className="bg-white rounded-lg border border-cream overflow-hidden hover:shadow-lg transition">
                  <div className="relative aspect-[3/4] bg-cream">
                    <Link href={`/product/${product.slug}`}>
                      <img
                        src={product.images[0] || "/placeholder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    {isOnSale && (
                      <span className="absolute top-2 left-2 bg-charcoal text-white text-xs font-semibold px-2 py-1 rounded">
                        {Math.round(((product.price - product.salePrice!) / product.price) * 100)}% OFF
                      </span>
                    )}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-white transition"
                    >
                      ❤️
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-secondary uppercase tracking-wider">{product.category}</p>
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-medium text-sm mt-1 hover:text-secondary transition truncate">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-semibold text-sm">
                        PKR {(product.salePrice || product.price).toLocaleString()}
                      </span>
                      {isOnSale && (
                        <span className="text-xs text-secondary line-through">PKR {product.price.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => moveToCart(item)}
                        disabled={!inStock}
                        className={`flex-1 py-2 text-sm font-medium rounded transition ${
                          inStock
                            ? "bg-charcoal text-white hover:bg-charcoal/80"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {inStock ? "Move to Cart" : "Out of Stock"}
                      </button>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="px-3 py-2 border border-cream rounded hover:bg-cream transition text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {items.length > 0 && <RecommendationShelf title="More to love" eyebrow="Because you saved a favourite" exclude={items.map(item => item.productId)} />}
      </div>
    </div>
  )
}