"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown, ChevronLeft, ChevronRight, Heart, Minus, Plus, Ruler,
  Share2, ShoppingBag, Truck, RotateCcw, ShieldCheck, X, ZoomIn,
  Check, Sparkles,
} from "lucide-react"
import { useCart } from "@/components/cart/cart-context"
import { ProductCard } from "./product-card"
import { RecommendationShelf } from "./recommendation-shelf"
import { ReviewsSection } from "./reviews-section"

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
  const originalPrice = selectedVariant?.price && selectedVariant.price < product.price ? product.price : product.price
  const isOnSale = (selectedVariant?.price != null && selectedVariant.price < product.price) || (!selectedVariant?.price && !!product.salePrice && product.salePrice < product.price)
  const saleBase = selectedVariant?.price != null ? product.price : product.salePrice
  const discount = isOnSale && saleBase ? Math.round(((product.price - (selectedVariant?.price ?? product.salePrice!)) / product.price) * 100) : 0
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0
  const availableStock = selectedVariant?.stock ?? product.stock
  const images = selectedVariant?.images?.length ? selectedVariant.images : product.images
  const reviewCount = product.reviews.length
  const averageRating = reviewCount ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0
  const displayImages = images.length ? images : ["/placeholder.jpg"]

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
    let cancelled = false
    fetch("/api/wishlist", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled) setWishlist(Boolean(data?.items?.some((item: any) => item.productId === product.id)))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [product.id])

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2200)
  }

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
      image: displayImages[0],
      slug: product.slug,
      quantity,
      variantLabel: selectedVariant ? `${selectedVariant.color} / ${selectedVariant.size}` : undefined,
    })
    flash("Added to your bag")
  }

  const toggleWishlist = async () => {
    setWishlistBusy(true)
    try {
      const response = await fetch("/api/wishlist", {
        method: wishlist ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      if (response.status === 401) flash("Please sign in to save items to your wishlist")
      else if (response.ok) {
        setWishlist(value => !value)
        flash(wishlist ? "Removed from wishlist" : "Saved to wishlist")
      } else {
        const data = await response.json().catch(() => null)
        if (data?.error === "Product already in wishlist") setWishlist(true)
      }
    } catch {}
    setWishlistBusy(false)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else { await navigator.clipboard.writeText(url); flash("Product link copied") }
    } catch {}
  }

  const changeImage = (direction: number) => {
    if (!displayImages.length) return
    setSelectedImage(i => (i + direction + displayImages.length) % displayImages.length)
  }

  return (
    <div className="pb-24 md:pb-16">
      {notice && (
        <div className="noore-product-toast fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#21171d] px-5 py-3 text-xs font-medium tracking-wide text-white shadow-2xl md:bottom-6">
          <Check className="mr-2 inline-block h-4 w-4 text-[#d6ae72]" />{notice}
        </div>
      )}

      <div className="mb-6 flex items-center gap-2 overflow-hidden text-[10px] uppercase tracking-[0.2em] text-secondary sm:mb-8">
        <span className="shrink-0">Home</span><span>/</span><span className="shrink-0">{product.category}</span><span>/</span><span className="truncate text-charcoal">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(350px,0.8fr)] lg:gap-16">
        <section aria-label="Product images">
          <div className="grid gap-3 sm:grid-cols-[84px_minmax(0,1fr)] lg:grid-cols-[92px_minmax(0,1fr)]">
            <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible sm:pb-0">
              {displayImages.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden bg-[#f2eee7] transition sm:h-24 sm:w-full ${selectedImage === i ? "ring-1 ring-[#21171d] ring-offset-2" : "opacity-70 hover:opacity-100"}`}
                  aria-label={`View image ${i + 1}`}
                  aria-current={selectedImage === i}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden bg-[#f2eee7]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
                <img
                  key={displayImages[selectedImage]}
                  src={displayImages[selectedImage]}
                  alt={product.name}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
                {isOnSale && <span className="absolute left-4 top-4 bg-[#21171d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">Sale · {discount}%</span>}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <span className="bg-white/85 px-3 py-2 text-[9px] uppercase tracking-[0.18em] backdrop-blur">{selectedImage + 1} / {displayImages.length}</span>
                  <button type="button" onClick={() => setZoomOpen(true)} className="flex items-center gap-2 bg-white/90 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] shadow-sm backdrop-blur hover:bg-white" aria-label="Zoom image"><ZoomIn className="h-3.5 w-3.5" /> Zoom</button>
                </div>
                {displayImages.length > 1 && <>
                  <button type="button" onClick={() => changeImage(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm sm:opacity-0 sm:transition sm:group-hover:opacity-100" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
                  <button type="button" onClick={() => changeImage(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
                </>}
              </div>
            </div>
          </div>
        </section>

        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-secondary">{product.collection || product.category}</p>
              <h1 className="font-editorial text-3xl leading-[1.05] sm:text-4xl lg:text-[2.8rem]">{product.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-secondary">
                <span>SKU {selectedVariant?.sku || product.sku}</span>
                {reviewCount > 0 && <span className="text-charcoal">★ {averageRating.toFixed(1)} <span className="text-secondary">({reviewCount})</span></span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={share} className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:border-charcoal hover:bg-white" aria-label="Share product"><Share2 className="h-4 w-4" /></button>
              <button type="button" disabled={wishlistBusy} onClick={toggleWishlist} className={`grid h-10 w-10 place-items-center rounded-full border transition ${wishlist ? "border-charcoal bg-charcoal text-white" : "border-border hover:border-charcoal hover:bg-white"}`} aria-label={wishlist ? "Remove from wishlist" : "Add to wishlist"}><Heart className={`h-4 w-4 ${wishlist ? "fill-current" : ""}`} /></button>
            </div>
          </div>

          <div className="mt-6 border-y border-border py-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-medium tracking-tight">{money(currentPrice)}</span>
              {isOnSale && <span className="text-sm text-secondary line-through">{money(originalPrice)}</span>}
              {isOnSale && <span className="bg-[#321526] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f7eee4]">Save {discount}%</span>}
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-secondary">Prices include applicable taxes</p>
          </div>

          {product.description && <p className="mt-6 max-w-xl text-sm leading-7 text-secondary">{product.description}</p>}

          {product.variants.length > 0 && <div className="mt-7 space-y-7">
            <div>
              <div className="mb-3 flex items-center justify-between"><label className="text-xs font-semibold uppercase tracking-[0.16em]">Color <span className="font-normal normal-case tracking-normal text-secondary">— {selectedColor}</span></label></div>
              <div className="flex flex-wrap gap-2">{colors.map(color => <button key={color} type="button" onClick={() => chooseColor(color)} className={`min-w-20 border px-4 py-2.5 text-xs transition ${selectedColor === color ? "border-charcoal bg-charcoal text-white" : "border-border hover:border-charcoal hover:bg-white"}`}>{color}</button>)}</div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><label className="text-xs font-semibold uppercase tracking-[0.16em]">Size <span className="font-normal normal-case tracking-normal text-secondary">— {selectedSize}</span></label><button type="button" onClick={() => flash("Size guide: XS 32–34, S 34–36, M 36–38, L 38–40, XL 40–42 inches chest")} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] underline underline-offset-4"><Ruler className="h-3.5 w-3.5" /> Size Guide</button></div>
              <div className="flex flex-wrap gap-2">{sizes.map(size => { const variant = product.variants.find(v => v.color === selectedColor && v.size === size); const disabled = Boolean(variant && variant.stock <= 0); return <button key={size} type="button" disabled={disabled} onClick={() => chooseSize(size)} className={`min-w-14 border px-4 py-2.5 text-xs transition ${selectedSize === size ? "border-charcoal bg-charcoal text-white" : "border-border hover:border-charcoal hover:bg-white"} ${disabled ? "cursor-not-allowed opacity-30 line-through" : ""}`}>{size}</button> })}</div>
            </div>
          </div>}

          <div className="mt-7 flex items-center justify-between border-y border-border py-4 text-xs">
            <span className={`flex items-center gap-2 ${inStock ? "text-green-700" : "text-red-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-green-600" : "bg-red-500"}`} />{inStock ? (availableStock <= product.lowStock ? `Only ${availableStock} left — order soon` : "In stock and ready to ship") : "Currently out of stock"}</span>
            {inStock && <span className="text-secondary">{availableStock} available</span>}
          </div>

          <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
            <div className="flex h-12 items-center border border-border bg-white"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid h-full w-11 place-items-center hover:bg-[#f7f2eb]" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button><span className="min-w-10 text-center text-sm">{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(Math.max(1, availableStock), quantity + 1))} className="grid h-full w-11 place-items-center hover:bg-[#f7f2eb]" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button></div>
            <button type="button" disabled={!inStock} onClick={handleAddToCart} className="flex h-12 items-center justify-center gap-2 bg-charcoal px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#321526] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"><ShoppingBag className="h-4 w-4" /> {inStock ? "Add to Bag" : "Out of Stock"}</button>
          </div>

          <div className="mt-4 flex items-center gap-2 border border-[#d6ae72]/35 bg-[#fbf6ef] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-charcoal"><Sparkles className="h-4 w-4 shrink-0 text-[#b28750]" /> Free delivery above PKR 5,000</div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-border border-y border-border py-5 text-center text-[10px] uppercase tracking-[0.1em] text-secondary"><div className="px-2"><Truck className="mx-auto mb-2 h-5 w-5 text-charcoal" />Fast Delivery</div><div className="px-2"><RotateCcw className="mx-auto mb-2 h-5 w-5 text-charcoal" />Easy Returns</div><div className="px-2"><ShieldCheck className="mx-auto mb-2 h-5 w-5 text-charcoal" />Secure Checkout</div></div>

          <div className="mt-7 divide-y divide-border border-y border-border">
            {[
              ["details", "Product Details", <div key="details" className="space-y-3 pb-5 text-sm leading-6 text-secondary">{product.fabric && <p><span className="text-charcoal">Fabric:</span> {product.fabric}</p>}{product.type && <p><span className="text-charcoal">Type:</span> {product.type}</p>}{product.pieces && <p><span className="text-charcoal">Pieces:</span> {product.pieces}</p>}{product.gender && <p><span className="text-charcoal">For:</span> {product.gender}</p>}{product.tags.length > 0 && <p><span className="text-charcoal">Tags:</span> {product.tags.join(", ")}</p>}</div>],
              ["shipping", "Shipping & Returns", <div key="shipping" className="pb-5 text-sm leading-6 text-secondary">Free standard shipping on orders above PKR 5,000. COD available. Items can be returned according to NOORÉ&apos;s return policy.</div>],
              ["care", "Care Guide", <div key="care" className="pb-5 text-sm leading-6 text-secondary">Follow the care instructions on the garment label. For best results, wash similar colours together and avoid harsh bleach.</div>],
            ].map(([id, title, content]) => <div key={String(id)}><button type="button" onClick={() => setOpenInfo(openInfo === id ? null : String(id))} className="flex w-full items-center justify-between py-5 text-left text-xs font-semibold uppercase tracking-[0.14em]">{title}<ChevronDown className={`h-4 w-4 transition ${openInfo === id ? "rotate-180" : ""}`} /></button>{openInfo === id && content}</div>)}
          </div>
        </section>
      </div>

      <ReviewsSection productId={product.id} reviews={product.reviews} />
      <RecommendationShelf productId={product.id} title="You May Also Like" eyebrow="Complete your wardrobe" exclude={[product.id, ...relatedProducts.map(p => p.id)]} />
      <RecommendationShelf productId={product.id} title="Complete the Look" eyebrow="Style it together" exclude={[product.id]} />

      {recentlyViewed.length > 0 && <section className="mt-20 border-t border-border pt-12"><p className="text-[10px] uppercase tracking-[0.2em] text-secondary">For your next visit</p><h2 className="mt-2 font-editorial text-3xl">Recently viewed</h2><div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{recentlyViewed.map(p => <ProductCard key={p.id} {...p} />)}</div></section>}

      {inStock && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{product.name}</p><p className="text-[11px] text-secondary">{money(currentPrice)} · {selectedVariant ? `${selectedVariant.color} / ${selectedVariant.size}` : "Ready to ship"}</p></div><button type="button" onClick={handleAddToCart} className="flex h-11 shrink-0 items-center gap-2 bg-charcoal px-5 text-[10px] font-semibold uppercase tracking-[.16em] text-white"><ShoppingBag className="h-4 w-4" /> Add to Bag</button></div></div>}

      {zoomOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171316]/95 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Product image viewer" onClick={() => setZoomOpen(false)}><button type="button" onClick={() => setZoomOpen(false)} className="absolute right-5 top-5 rounded-full bg-white p-2" aria-label="Close image viewer"><X className="h-5 w-5" /></button><img src={displayImages[selectedImage]} alt={product.name} className="max-h-[92vh] max-w-[92vw] object-contain" onClick={e => e.stopPropagation()} /></div>}
    </div>
  )
}
