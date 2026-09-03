"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Minus, Plus, Ruler, Share2, ShoppingBag, Truck, RotateCcw, ShieldCheck, X, ZoomIn } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"
import { ProductCard } from "./product-card"
import { RecommendationShelf } from "./recommendation-shelf"

type Variant = { id: string; color: string; size: string; sku: string; price: number | null; stock: number; images: string[] }
type Review = { id: string; rating: number; comment: string | null; verified: boolean; createdAt: string }
type Product = {
  id: string; name: string; slug: string; description: string | null; price: number; salePrice: number | null
  images: string[]; category: string; subcategory: string | null; collection: string | null; gender: string | null
  type: string | null; fabric: string | null; pieces: number | null; stock: number; lowStock: number; sku: string; tags: string[]
  variants: Variant[]; reviews: Review[]
}
type Props = { product: Product; relatedProducts: any[] }

const money = (value: number) => `PKR ${value.toLocaleString()}`

export function ProductDetail({ product, relatedProducts }: Props) {
  const { addItem } = useCart()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.color || "")
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size || "")
  const [zoomOpen, setZoomOpen] = useState(false)
  const [wishlist, setWishlist] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [openInfo, setOpenInfo] = useState<string | null>("details")
  const [notice, setNotice] = useState("")
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])

  const colors = useMemo(() => Array.from(new Set(product.variants.map(v => v.color))), [product.variants])
  const sizes = useMemo(() => Array.from(new Set(product.variants.map(v => v.size))), [product.variants])
  const selectedVariant = product.variants.length
    ? (product.variants.find(v => v.color === selectedColor && v.size === selectedSize) || product.variants.find(v => v.color === selectedColor) || product.variants[0])
    : null
  const currentPrice = selectedVariant?.price ?? product.salePrice ?? product.price
  const isOnSale = !selectedVariant?.price && !!product.salePrice && product.salePrice < product.price
  const discount = isOnSale ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0
  const availableStock = selectedVariant?.stock ?? product.stock
  const images = selectedVariant?.images?.length ? selectedVariant.images : product.images
  const reviewCount = product.reviews.length
  const averageRating = reviewCount ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0

  useEffect(() => {
    setSelectedImage(0)
    setQuantity(1)
  }, [selectedVariant?.id])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("noore_recently_viewed") || "[]")
      const previous = Array.isArray(stored) ? stored.filter((item: any) => item?.id && item.id !== product.id) : []
      setRecentlyViewed(previous.slice(0, 4))
      const current = { id: product.id, name: product.name, slug: product.slug, price: product.price, salePrice: product.salePrice, image: product.images[0] || "/placeholder.jpg", hoverImage: product.images[1], category: product.category, stock: product.stock }
      localStorage.setItem("noore_recently_viewed", JSON.stringify([current, ...previous].slice(0, 8)))
    } catch {}
  }, [product.id, product.name, product.slug, product.price, product.salePrice, product.images, product.category, product.stock])

  useEffect(() => {
    fetch("/api/wishlist")
      .then(r => r.ok ? r.json() : null)
      .then(data => setWishlist(Boolean(data?.items?.some((item: any) => item.productId === product.id))))
      .catch(() => {})
  }, [product.id])

  const chooseColor = (color: string) => {
    setSelectedColor(color)
    const match = product.variants.find(v => v.color === color && v.size === selectedSize)
    if (!match) {
      const first = product.variants.find(v => v.color === color)
      if (first) setSelectedSize(first.size)
    }
  }

  const chooseSize = (size: string) => {
    setSelectedSize(size)
    const match = product.variants.find(v => v.color === selectedColor && v.size === size)
    if (!match) {
      const first = product.variants.find(v => v.size === size)
      if (first) setSelectedColor(first.color)
    }
  }

  const handleAddToCart = () => {
    if (!inStock) return
    addItem({
      id: selectedVariant?.id || product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: currentPrice,
      image: images[0] || "/placeholder.jpg",
      slug: product.slug,
      quantity,
      variantLabel: selectedVariant ? `${selectedVariant.color} / ${selectedVariant.size}` : undefined,
    })
    setNotice("Added to your bag")
    window.setTimeout(() => setNotice(""), 2200)
  }

  const toggleWishlist = async () => {
    setWishlistBusy(true)
    try {
      const response = await fetch("/api/wishlist", { method: wishlist ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) })
      if (response.status === 401) {
        setNotice("Please sign in to save items to your wishlist")
      } else if (response.ok) {
        setWishlist(!wishlist)
        setNotice(wishlist ? "Removed from wishlist" : "Saved to wishlist")
      } else {
        const data = await response.json().catch(() => null)
        if (data?.error === "Product already in wishlist") setWishlist(true)
      }
    } catch {}
    setWishlistBusy(false)
    window.setTimeout(() => setNotice(""), 2200)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else { await navigator.clipboard.writeText(url); setNotice("Product link copied") }
    } catch {}
    window.setTimeout(() => setNotice(""), 2200)
  }

  const changeImage = (direction: number) => {
    if (!images.length) return
    setSelectedImage(i => (i + direction + images.length) % images.length)
  }

  return (
    <div className="pb-16">
      {notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-charcoal px-5 py-3 text-sm text-white shadow-xl">{notice}</div>}

      <div className="mb-7 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-secondary">
        <span>Home</span><span>/</span><span>{product.category}</span><span>/</span><span className="text-charcoal">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-14">
        <section>
          <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
            <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
              {images.map((img, i) => (
                <button key={`${img}-${i}`} type="button" onClick={() => setSelectedImage(i)} className={`h-20 w-16 shrink-0 overflow-hidden border bg-cream transition sm:h-24 sm:w-full ${selectedImage === i ? "border-charcoal" : "border-transparent"}`} aria-label={`View image ${i + 1}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="group relative order-1 overflow-hidden bg-cream sm:order-2">
              <div className="aspect-[4/5] sm:aspect-[3/4]">
                <img src={images[selectedImage] || "/placeholder.jpg"} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]" />
              </div>
              <button type="button" onClick={() => setZoomOpen(true)} className="absolute right-4 top-4 flex items-center gap-2 bg-white/90 px-3 py-2 text-xs uppercase tracking-wider shadow-sm backdrop-blur" aria-label="Zoom image"><ZoomIn className="h-4 w-4" /> Zoom</button>
              {images.length > 1 && <><button type="button" onClick={() => changeImage(-1)} className="absolute left-3 top-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow transition group-hover:opacity-100"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => changeImage(1)} className="absolute right-3 top-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow transition group-hover:opacity-100"><ChevronRight className="h-5 w-5" /></button></>}
            </div>
          </div>
        </section>

        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{product.collection || product.category}</p>
              <h1 className="font-editorial text-3xl leading-tight sm:text-4xl">{product.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-secondary">
                <span>SKU: {selectedVariant?.sku || product.sku}</span>
                {reviewCount > 0 && <span className="flex items-center gap-1 text-charcoal">★ {averageRating.toFixed(1)} <span className="text-secondary">({reviewCount} reviews)</span></span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={share} className="rounded-full border border-border p-3" aria-label="Share product"><Share2 className="h-5 w-5" /></button>
              <button type="button" disabled={wishlistBusy} onClick={toggleWishlist} className={`rounded-full border p-3 ${wishlist ? "border-charcoal bg-charcoal text-white" : "border-border"}`} aria-label="Wishlist"><Heart className={`h-5 w-5 ${wishlist ? "fill-current" : ""}`} /></button>
            </div>
          </div>

          <div className="mt-7 flex items-end gap-3 border-b border-border pb-6">
            <span className="text-2xl font-medium">{money(currentPrice)}</span>
            {isOnSale && <><span className="text-base text-secondary line-through">{money(product.price)}</span><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">{discount}% OFF</span></>}
          </div>

          {product.description && <p className="mt-6 text-sm leading-7 text-secondary">{product.description}</p>}

          {product.variants.length > 0 && <div className="mt-7 space-y-6">
            <div><div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium">Color <span className="font-normal text-secondary">— {selectedColor}</span></label></div><div className="flex flex-wrap gap-2">{colors.map(color => <button key={color} type="button" onClick={() => chooseColor(color)} className={`min-w-20 border px-4 py-2.5 text-sm transition ${selectedColor === color ? "border-charcoal bg-charcoal text-white" : "border-border hover:border-charcoal"}`}>{color}</button>)}</div></div>
            <div><div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium">Size <span className="font-normal text-secondary">— {selectedSize}</span></label><button type="button" onClick={() => setNotice("Size guide: XS 32–34, S 34–36, M 36–38, L 38–40, XL 40–42 inches chest") } className="flex items-center gap-1 text-xs underline underline-offset-4"><Ruler className="h-3.5 w-3.5" /> Size Guide</button></div><div className="flex flex-wrap gap-2">{sizes.map(size => { const variant = product.variants.find(v => v.color === selectedColor && v.size === size); const disabled = Boolean(variant && variant.stock <= 0); return <button key={size} type="button" disabled={disabled} onClick={() => chooseSize(size)} className={`min-w-14 border px-4 py-2.5 text-sm ${selectedSize === size ? "border-charcoal bg-charcoal text-white" : "border-border hover:border-charcoal"} ${disabled ? "cursor-not-allowed opacity-35 line-through" : ""}`}>{size}</button> })}</div></div>
          </div>}

          <div className="mt-7 flex items-center justify-between border-y border-border py-4 text-sm">
            <span className={inStock ? "text-green-700" : "text-red-600"}>{inStock ? (availableStock <= product.lowStock ? `Only ${availableStock} left — order soon` : "In stock and ready to ship") : "Currently out of stock"}</span>
            {inStock && <span className="text-secondary">{availableStock} available</span>}
          </div>

          <div className="mt-6 flex gap-3">
            <div className="flex h-12 shrink-0 items-center border border-border"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button><span className="min-w-10 text-center text-sm">{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(Math.max(1, availableStock), quantity + 1))} className="px-3" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button></div>
            <button type="button" disabled={!inStock} onClick={handleAddToCart} className="flex h-12 flex-1 items-center justify-center gap-2 bg-charcoal px-6 text-sm font-medium uppercase tracking-[0.14em] text-white transition hover:bg-charcoal-light disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"><ShoppingBag className="h-4 w-4" /> {inStock ? "Add to Bag" : "Out of Stock"}</button>
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-border border-y border-border py-5 text-center text-xs text-secondary"><div className="px-2"><Truck className="mx-auto mb-2 h-5 w-5 text-charcoal" />Fast Delivery</div><div className="px-2"><RotateCcw className="mx-auto mb-2 h-5 w-5 text-charcoal" />Easy Returns</div><div className="px-2"><ShieldCheck className="mx-auto mb-2 h-5 w-5 text-charcoal" />Secure Checkout</div></div>

          <div className="mt-7 divide-y divide-border border-y border-border">
            {[['details', 'Product Details', <div key="details" className="space-y-3 pb-5 text-sm leading-6 text-secondary">{product.fabric && <p><span className="text-charcoal">Fabric:</span> {product.fabric}</p>}{product.type && <p><span className="text-charcoal">Type:</span> {product.type}</p>}{product.pieces && <p><span className="text-charcoal">Pieces:</span> {product.pieces}</p>}{product.gender && <p><span className="text-charcoal">For:</span> {product.gender}</p>}{product.tags.length > 0 && <p><span className="text-charcoal">Tags:</span> {product.tags.join(", ")}</p>}</div>], ['shipping', 'Shipping & Returns', <div key="shipping" className="pb-5 text-sm leading-6 text-secondary">Free standard shipping on orders above PKR 5,000. COD available. Items can be returned according to NOORÉ&apos;s return policy.</div>], ['care', 'Care Guide', <div key="care" className="pb-5 text-sm leading-6 text-secondary">Follow the care instructions on the garment label. For best results, wash similar colours together and avoid harsh bleach.</div>]].map(([id, title, content]) => <div key={String(id)}><button type="button" onClick={() => setOpenInfo(openInfo === id ? null : String(id))} className="flex w-full items-center justify-between py-5 text-left text-sm font-medium">{title}<ChevronDown className={`h-4 w-4 transition ${openInfo === id ? "rotate-180" : ""}`} /></button>{openInfo === id && content}</div>)}
          </div>
        </section>
      </div>

      {reviewCount > 0 && <section className="mt-20 border-t border-border pt-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.2em] text-secondary">Customer feedback</p><h2 className="mt-2 font-editorial text-3xl">Reviews</h2></div><div className="text-sm">★ <strong>{averageRating.toFixed(1)}</strong> / 5 · {reviewCount} reviews</div></div><div className="mt-8 grid gap-5 md:grid-cols-3">{product.reviews.slice(0, 3).map(review => <article key={review.id} className="border border-border p-6"><div className="text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div><p className="mt-4 text-sm leading-6 text-secondary">{review.comment || "Beautiful product."}</p>{review.verified && <p className="mt-4 text-xs uppercase tracking-wider">✓ Verified purchase</p>}</article>)}</div></section>}

      <RecommendationShelf productId={product.id} title="You May Also Like" eyebrow="Complete your wardrobe" exclude={[product.id, ...relatedProducts.map(p => p.id)]} />
      <RecommendationShelf productId={product.id} title="Complete the Look" eyebrow="Style it together" exclude={[product.id]} />

      {recentlyViewed.length > 0 && <section className="mt-20 border-t border-border pt-12"><p className="text-xs uppercase tracking-[0.2em] text-secondary">For your next visit</p><h2 className="mt-2 font-editorial text-3xl">Recently viewed</h2><div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{recentlyViewed.map(p => <ProductCard key={p.id} {...p} />)}</div></section>}

      {inStock && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{product.name}</p><p className="text-[11px] text-secondary">{money(currentPrice)} · {selectedVariant ? `${selectedVariant.color} / ${selectedVariant.size}` : "Ready to ship"}</p></div><button type="button" onClick={handleAddToCart} className="flex h-11 shrink-0 items-center gap-2 bg-charcoal px-5 text-[10px] font-semibold uppercase tracking-[.16em] text-white"><ShoppingBag className="h-4 w-4" /> Add to Bag</button></div></div>}

      {zoomOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={() => setZoomOpen(false)}><button type="button" onClick={() => setZoomOpen(false)} className="absolute right-5 top-5 rounded-full bg-white p-2" aria-label="Close"><X className="h-5 w-5" /></button><img src={images[selectedImage] || "/placeholder.jpg"} alt={product.name} className="max-h-[92vh] max-w-[92vw] object-contain" onClick={e => e.stopPropagation()} /></div>}
    </div>
  )
}
