"use client"

import Link from "next/link"
import { useState } from "react"
import { useCart } from "@/components/cart/cart-context"

type ProductCardProps = {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  image: string
  category: string
  stock: number
}

export function ProductCard({ id, name, slug, price, salePrice, image, category, stock }: ProductCardProps) {
  const { addItem } = useCart()
  const [isHovered, setIsHovered] = useState(false)
  const isOnSale = salePrice && salePrice < price
  const discount = isOnSale ? Math.round(((price - salePrice!) / price) * 100) : 0

  const handleAddToCart = () => {
    addItem({
      id,
      productId: id,
      name,
      price: salePrice || price,
      image,
      slug,
    })
  }

  return (
    <div 
      className="group relative bg-white rounded-lg overflow-hidden border border-cream transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <Link href={`/product/${slug}`} className="block aspect-[3/4] overflow-hidden bg-cream relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOnSale && (
            <span className="bg-charcoal text-white text-xs font-semibold px-2 py-1 rounded">
              {discount}% OFF
            </span>
          )}
          {stock === 0 && (
            <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
              SOLD OUT
            </span>
          )}
        </div>
        
        {stock > 0 && stock < 5 && (
          <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Only {stock} left
          </span>
        )}

        {/* Quick Add Button - appears on hover */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              stock === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white text-charcoal hover:bg-cream shadow-lg"
            }`}
          >
            {stock === 0 ? "Out of Stock" : "Quick Add"}
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-secondary uppercase tracking-wider">{category}</p>
        <Link href={`/product/${slug}`}>
          <h3 className="font-medium text-sm mt-1 hover:text-secondary transition truncate">{name}</h3>
        </Link>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="font-semibold text-sm">PKR {(salePrice || price).toLocaleString()}</span>
          {isOnSale && (
            <span className="text-xs text-secondary line-through">PKR {price.toLocaleString()}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`w-full mt-3 py-2 text-sm font-medium rounded-md transition ${
            stock === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-charcoal text-white hover:bg-charcoal/80 hover:shadow-md"
          }`}
        >
          {stock === 0 ? "Out of Stock" : "Add to Bag"}
        </button>
      </div>
    </div>
  )
}