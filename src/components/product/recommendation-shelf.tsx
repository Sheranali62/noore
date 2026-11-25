"use client"
import { useEffect, useState } from "react"
import { ProductCard } from "./product-card"

type Product = { id: string; name: string; slug: string; price: number; salePrice: number | null; images: string[]; category: string; stock: number; lowStock?: number }
export function RecommendationShelf({ productId, title = "You May Also Like", eyebrow = "Curated for you", exclude = [] }: { productId?: string; title?: string; eyebrow?: string; exclude?: string[] }) {
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => { const qs = new URLSearchParams(); if (productId) qs.set("productId", productId); if (exclude.length) qs.set("exclude", exclude.join(",")); fetch(`/api/recommendations?${qs}`).then(r => r.ok ? r.json() : null).then(d => setProducts(d?.products || [])).catch(() => {}) }, [productId, exclude.join(",")])
  if (!products.length) return null
  return <section className="mt-20 border-t border-border pt-12"><p className="text-xs uppercase tracking-[0.2em] text-secondary">{eyebrow}</p><h2 className="mt-2 font-editorial text-3xl">{title}</h2><div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{products.slice(0, 4).map(p => <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price} salePrice={p.salePrice} image={p.images[0] || "/placeholder.jpg"} hoverImage={p.images[1]} category={p.category} stock={p.stock} />)}</div></section>
}
