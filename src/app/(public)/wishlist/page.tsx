"use client"

import { useEffect, useMemo, useState } from "react"
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
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist", { cache: "no-store" })
        if (!cancelled && response.ok) {
          const data = await response.json()
          setItems(data.items || [])
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (session) {
      fetchWishlist()
    } else {
      setItems([])
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [session])

  const removeFromWishlist = async (productId: string) => {
    setBusyId(productId)
    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        setItems((current) => current.filter((item) => item.productId !== productId))
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    } finally {
      setBusyId(null)
    }
  }

  const moveToCart = async (item: WishlistItem) => {
    if (item.product.stock <= 0) return

    setBusyId(item.productId)
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

  const inStockCount = useMemo(
    () => items.filter((item) => item.product.stock > 0).length,
    [items],
  )

  const saleCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.product.salePrice !== null &&
          item.product.salePrice < item.product.price,
      ).length,
    [items],
  )

  if (!session) {
    return (
      <div className="min-h-screen bg-cream py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white border border-cream rounded-3xl p-8 md:p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full border border-cream flex items-center justify-center text-3xl">
            ♡
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-secondary">
            NOORÉ Private Edit
          </p>
          <h1 className="font-editorial text-4xl md:text-5xl mt-3">
            Your wishlist is personal
          </h1>
          <p className="text-secondary mt-4 max-w-lg mx-auto leading-7">
            Sign in to save your favourite NOORÉ pieces and access your edit
            from any device.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <Link
              href="/login"
              className="bg-charcoal text-white rounded-xl px-7 py-3 font-medium hover:opacity-90 transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="border border-charcoal/15 rounded-xl px-7 py-3 font-medium hover:bg-cream transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto animate-spin rounded-full h-10 w-10 border-2 border-charcoal/20 border-b-charcoal" />
          <p className="mt-4 text-sm text-secondary">Loading your edit…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-secondary">
                Saved by you
              </p>
              <h1 className="font-editorial text-4xl md:text-5xl font-semibold mt-2">
                My Wishlist
              </h1>
              <p className="text-secondary mt-2">
                Your private edit of pieces worth keeping close.
              </p>
            </div>

            {items.length > 0 && (
              <div className="grid grid-cols-3 border border-cream bg-white rounded-2xl overflow-hidden min-w-[280px]">
                <div className="px-4 py-3 text-center border-r border-cream">
                  <div className="font-semibold">{items.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-secondary mt-1">
                    Saved
                  </div>
                </div>
                <div className="px-4 py-3 text-center border-r border-cream">
                  <div className="font-semibold">{inStockCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-secondary mt-1">
                    Available
                  </div>
                </div>
                <div className="px-4 py-3 text-center">
                  <div className="font-semibold">{saleCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-secondary mt-1">
                    On Sale
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {items.length === 0 ? (
          <section className="bg-white rounded-3xl border border-cream px-6 py-16 md:py-24 text-center shadow-sm">
            <div className="mx-auto w-20 h-20 rounded-full border border-cream flex items-center justify-center text-4xl">
              ♡
            </div>
            <p className="mt-7 text-xs uppercase tracking-[0.25em] text-secondary">
              Your edit awaits
            </p>
            <h2 className="font-editorial text-3xl md:text-4xl font-semibold mt-2">
              Nothing saved yet
            </h2>
            <p className="text-secondary mt-3 max-w-md mx-auto leading-7">
              Explore the collection and tap the heart on pieces you want to
              keep for later.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
              <Link
                href="/new-in"
                className="bg-charcoal text-white px-7 py-3 rounded-xl font-medium hover:opacity-90 transition"
              >
                Explore New In
              </Link>
              <Link
                href="/products"
                className="border border-charcoal/15 px-7 py-3 rounded-xl font-medium hover:bg-cream transition"
              >
                Shop All
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => {
                const product = item.product
                const isOnSale =
                  product.salePrice !== null &&
                  product.salePrice < product.price
                const inStock = product.stock > 0
                const isBusy = busyId === product.id
                const displayPrice = product.salePrice || product.price
                const discount = isOnSale
                  ? Math.round(
                      ((product.price - product.salePrice!) / product.price) * 100,
                    )
                  : 0

                return (
                  <article
                    key={item.id}
                    className="group bg-white rounded-2xl border border-cream overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative aspect-[3/4] bg-cream overflow-hidden">
                      <Link
                        href={`/product/${product.slug}`}
                        aria-label={`View ${product.name}`}
                      >
                        <img
                          src={product.images[0] || "/placeholder.jpg"}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </Link>

                      <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between pointer-events-none">
                        <div>
                          {isOnSale && (
                            <span className="inline-flex bg-charcoal text-white text-[10px] font-semibold tracking-wider px-2.5 py-1.5 rounded-full">
                              {discount}% OFF
                            </span>
                          )}
                          {!inStock && (
                            <span className="inline-flex bg-white/95 text-charcoal text-[10px] font-semibold tracking-wider px-2.5 py-1.5 rounded-full mt-2">
                              OUT OF STOCK
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={`Remove ${product.name} from wishlist`}
                          disabled={isBusy}
                          onClick={() => removeFromWishlist(product.id)}
                          className="pointer-events-auto w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-lg hover:bg-white transition disabled:opacity-50"
                        >
                          {isBusy ? "…" : "♥"}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 md:p-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-secondary">
                        {product.category}
                      </p>

                      <Link href={`/product/${product.slug}`}>
                        <h3 className="font-medium text-sm md:text-base mt-2 line-clamp-2 hover:text-secondary transition">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="font-semibold text-sm">
                          PKR {displayPrice.toLocaleString()}
                        </span>
                        {isOnSale && (
                          <span className="text-xs text-secondary line-through">
                            PKR {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!inStock || isBusy}
                        onClick={() => moveToCart(item)}
                        className={`w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition ${
                          inStock
                            ? "bg-charcoal text-white hover:opacity-90"
                            : "bg-black/5 text-secondary cursor-not-allowed"
                        } disabled:opacity-60`}
                      >
                        {isBusy
                          ? "Moving…"
                          : inStock
                            ? "Move to Bag"
                            : "Currently Unavailable"}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center border border-charcoal/15 bg-white px-7 py-3 rounded-xl text-sm font-medium hover:bg-cream transition"
              >
                Continue Shopping
              </Link>
            </div>

            <RecommendationShelf
              title="More to love"
              eyebrow="Because you saved a favourite"
              exclude={items.map((item) => item.productId)}
            />
          </>
        )}
      </div>
    </div>
  )
}
