import Link from "next/link"
import { ProductCard } from "@/components/product/product-card"

type Product = { id: string; name: string; slug: string; price: number; salePrice: number | null; images: string[]; category: string; stock: number }

const categoryCards = [
  ["Women", "Women", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop"],
  ["Men", "Men", "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=900&auto=format&fit=crop"],
  ["Unstitched", "Unstitched", "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop"],
  ["Accessories", "Accessories", "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900&auto=format&fit=crop"],
]

export function CategorySection() {
  return <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16"><div className="flex items-end justify-between mb-6"><div><p className="text-[10px] uppercase tracking-[.25em] text-secondary">Explore</p><h2 className="font-editorial text-3xl md:text-4xl mt-2">Shop by Category</h2></div><Link href="/products" className="text-xs underline underline-offset-4">View all</Link></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">{categoryCards.map(([title, category, image]) => <Link href={`/products?category=${category}`} key={title} className="group relative aspect-[4/5] overflow-hidden bg-cream"><img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/><div className="absolute left-4 bottom-4 text-white"><h3 className="font-editorial text-2xl">{title}</h3><span className="text-[10px] uppercase tracking-wider">Shop now →</span></div></Link>)}</div></section>
}

export function ProductSection({ title, eyebrow, products }: { title: string; eyebrow: string; products: Product[] }) {
  if (!products.length) return null
  return <section className="py-12 md:py-16 bg-white"><div className="max-w-7xl mx-auto px-4 md:px-8"><div className="flex items-end justify-between mb-6"><div><p className="text-[10px] uppercase tracking-[.25em] text-secondary">{eyebrow}</p><h2 className="font-editorial text-3xl md:text-4xl mt-2">{title}</h2></div><Link href="/products" className="text-xs underline underline-offset-4">View all</Link></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">{products.slice(0, 8).map(product => <ProductCard key={product.id} {...product} image={product.images[0] || "/placeholder.jpg"} />)}</div></div></section>
}

export function CollectionBanner() {
  return <section className="mx-4 md:mx-8 my-4 md:my-8 relative overflow-hidden min-h-[380px] md:min-h-[480px] bg-neutral-900 text-white"><img src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1800&auto=format&fit=crop" alt="NOORÉ collection" className="absolute inset-0 h-full w-full object-cover opacity-65"/><div className="absolute inset-0 bg-black/25"/><div className="relative z-10 min-h-[380px] md:min-h-[480px] flex items-center justify-center text-center px-6"><div><p className="text-[10px] uppercase tracking-[.3em] text-white/70">The NOORÉ Edit</p><h2 className="font-editorial text-4xl md:text-6xl mt-3">Made for the Moment</h2><p className="mt-4 max-w-md mx-auto text-sm text-white/80">Discover refined essentials and occasionwear designed for modern Pakistani living.</p><Link href="/products" className="inline-flex mt-7 bg-white text-black px-7 py-3 text-xs font-semibold uppercase tracking-wider">Explore Collection</Link></div></div></section>
}

export function BrandSection() {
  return <section className="py-16 md:py-24 border-y border-cream"><div className="max-w-3xl mx-auto text-center px-6"><p className="text-[10px] uppercase tracking-[.28em] text-secondary">NOORÉ</p><h2 className="font-editorial text-4xl md:text-5xl mt-3">A modern expression of Pakistani fashion.</h2><p className="mt-5 text-sm leading-7 text-secondary">From everyday dressing to celebrations, NOORÉ brings together timeless craft, contemporary cuts and a carefully edited wardrobe.</p><Link href="/about" className="inline-flex mt-7 text-xs uppercase tracking-wider border-b border-black pb-1">Discover our story</Link></div></section>
}
