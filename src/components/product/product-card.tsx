"use client"

import Link from "next/link"
import { useState } from "react"
import { Heart, ShoppingBag, ArrowUpRight } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"

type ProductCardProps = {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  image: string
  hoverImage?: string
  category: string
  stock: number
  colors?: string[]
}

export function ProductCard({ id, name, slug, price, salePrice, image, hoverImage, category, stock, colors = [] }: ProductCardProps) {
  const { addItem } = useCart()
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const isOnSale = typeof salePrice === "number" && salePrice < price
  const displayPrice = isOnSale ? salePrice : price
  const discount = isOnSale ? Math.round(((price - salePrice) / price) * 100) : 0

  const handleAddToCart = () => {
    if (stock === 0) return
    addItem({ id, productId: id, name, price: displayPrice, image, slug })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <article className="group">
      <div className="relative overflow-hidden bg-[#f1eee8] aspect-[3/4]">
        <Link href={`/product/${slug}`} className="block h-full" aria-label={`View ${name}`}>
          <img src={image || "/placeholder.jpg"} alt={name} className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.035]" />
          {hoverImage && (
            <img src={hoverImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isOnSale && <span className="bg-charcoal px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">Sale · {discount}%</span>}
          {stock === 0 && <span className="bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-charcoal">Sold out</span>}
          {stock > 0 && stock < 5 && <span className="bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-charcoal">Only {stock} left</span>}
        </div>

        <button
          type="button"
          disabled={wishlistBusy}
          onClick={async () => {
            setWishlistBusy(true)
            try {
              const response = await fetch("/api/wishlist", { method: liked ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: id }) })
              if (response.status === 401) setNotice("Sign in to save favourites")
              else if (response.ok) setLiked(value => !value)
            } catch {}
            setWishlistBusy(false)
            window.setTimeout(() => setNotice(""), 1800)
          }}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:bg-white disabled:opacity-60"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </button>
        {notice && <span className="absolute right-3 top-14 bg-charcoal px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-white">{notice}</span>}

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button type="button" onClick={handleAddToCart} disabled={stock === 0} className="flex w-full items-center justify-center gap-2 bg-charcoal px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-white/90 disabled:text-secondary">
            <ShoppingBag className="h-3.5 w-3.5" />
            {stock === 0 ? "Unavailable" : added ? "Added to bag" : "Quick add"}
          </button>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-secondary">{category}</p>
            <Link href={`/product/${slug}`} className="mt-1 block">
              <h3 className="truncate text-sm font-medium tracking-wide text-charcoal transition group-hover:underline group-hover:underline-offset-4">{name}</h3>
            </Link>
          </div>
          <Link href={`/product/${slug}`} aria-label={`Open ${name}`} className="mt-1 shrink-0 opacity-40 transition group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-semibold">PKR {displayPrice.toLocaleString()}</span>
          {isOnSale && <span className="text-xs text-secondary line-through">PKR {price.toLocaleString()}</span>}
        </div>

        {colors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5" aria-label={`${colors.length} available colors`}>
            {colors.slice(0, 5).map((color) => <span key={color} title={color} className="h-3 w-3 rounded-full border border-black/15 bg-neutral-300" />)}
            {colors.length > 5 && <span className="ml-1 text-[9px] text-secondary">+{colors.length - 5}</span>}
          </div>
        )}
      </div>
    </article>
  )
}
