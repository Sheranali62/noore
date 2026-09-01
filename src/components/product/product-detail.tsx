"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/cart/cart-context"
import { ProductCard } from "./product-card"

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  salePrice: number | null
  images: string[]
  category: string
  subcategory: string | null
  stock: number
  sku: string
}

type ProductDetailProps = {
  product: Product
  relatedProducts: any[]
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const { addItem } = useCart()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const isOnSale = product.salePrice && product.salePrice < product.price
  const discount = isOnSale ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0
  const inStock = product.stock > 0

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.images[0] || "/placeholder.jpg",
      slug: product.slug,
    })
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-[3/4] bg-cream rounded-lg overflow-hidden">
            <img
              src={product.images[selectedImage] || "/placeholder.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i ? "border-charcoal" : "border-cream"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <span>{product.category}</span>
            {product.subcategory && (
              <>
                <span>•</span>
                <span>{product.subcategory}</span>
              </>
            )}
          </div>

          <h1 className="font-editorial text-3xl md:text-4xl font-semibold mt-2">{product.name}</h1>
          <p className="text-sm text-secondary mt-1">SKU: {product.sku}</p>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-bold">PKR {(product.salePrice || product.price).toLocaleString()}</span>
            {isOnSale && (
              <>
                <span className="text-lg text-secondary line-through">PKR {product.price.toLocaleString()}</span>
                <span className="bg-red-100 text-red-600 text-sm font-semibold px-2 py-1 rounded">{discount}% OFF</span>
              </>
            )}
          </div>

          <div className="mt-4">
            <p className={`text-sm font-medium ${inStock ? "text-green-600" : "text-red-600"}`}>
              {inStock ? `✅ In Stock (${product.stock} available)` : "❌ Out of Stock"}
            </p>
          </div>

          {product.description && (
            <div className="mt-4 border-t border-cream pt-4">
              <p className="text-secondary text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex border border-cream rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 hover:bg-cream transition"
                >
                  -
                </button>
                <span className="px-4 py-1 min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1 hover:bg-cream transition"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 py-3 px-6 rounded font-medium transition ${
                  inStock
                    ? "bg-charcoal text-white hover:bg-charcoal/80"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {inStock ? "Add to Bag" : "Out of Stock"}
              </button>
              <button className="py-3 px-6 border border-cream rounded font-medium hover:border-charcoal transition">
                ♡ Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-editorial text-2xl font-semibold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                salePrice={product.salePrice}
                image={product.images[0] || "/placeholder.jpg"}
                category={product.category}
                stock={product.stock}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}