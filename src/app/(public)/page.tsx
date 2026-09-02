import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  category: string
  stock: number
}

export default async function HomePage() {
  // Get featured products
  const featuredProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 8,
    orderBy: { createdAt: "desc" },
  })

  const categories = [
    { name: "Unstitched", icon: "👗", color: "bg-amber-50" },
    { name: "Ready to Wear", icon: "👘", color: "bg-rose-50" },
    { name: "Luxury", icon: "💎", color: "bg-purple-50" },
    { name: "Men", icon: "👔", color: "bg-blue-50" },
    { name: "Accessories", icon: "👜", color: "bg-emerald-50" },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-charcoal text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" 
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1400&fit=crop')" }}>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <span className="text-xs uppercase tracking-[0.2em] font-light opacity-70">New Season</span>
          <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight mt-4">
            The Art of Everyday Elegance
          </h1>
          <p className="text-base md:text-lg font-light mt-4 opacity-80 max-w-xl mx-auto">
            Contemporary silhouettes rooted in timeless Pakistani craft.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link href="/products?category=Women" className="bg-white text-charcoal px-8 py-3 rounded-md font-medium hover:bg-cream transition-all hover:shadow-lg">
              Shop Women
            </Link>
            <Link href="/products?category=Men" className="border border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-charcoal transition-all">
              Shop Men
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <span className="w-2 h-2 rounded-full bg-white/60"></span>
          <span className="w-2 h-2 rounded-full bg-white/30"></span>
          <span className="w-2 h-2 rounded-full bg-white/30"></span>
        </div>
      </section>

      {/* Promo Strip */}
      <section className="border-b border-cream bg-white/50 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "🚚", title: "Free Shipping", desc: "On orders above PKR 5,000" },
            { icon: "🔒", title: "Secure Payments", desc: "100% secure" },
            { icon: "🔄", title: "Easy Exchanges", desc: "Within 7 days" },
            { icon: "🎧", title: "Customer Support", desc: "We're here to help" },
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{item.icon}</div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12 animate-fade-up">
          <h2 className="font-editorial text-3xl md:text-4xl font-semibold">Shop the Collection</h2>
          <p className="text-secondary mt-2">Explore our curated categories</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?category=${cat.name}`}
              className={`group ${cat.color} rounded-lg p-6 text-center border border-cream transition-all hover:shadow-lg hover:-translate-y-1`}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <h3 className="font-semibold text-sm">{cat.name}</h3>
              <span className="text-xs text-secondary mt-1 block">Shop Now →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {featuredProducts.length > 0 && (
        <section className="bg-white/50 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-editorial text-3xl md:text-4xl font-semibold">New Arrivals</h2>
              <p className="text-secondary mt-2">Discover the latest expressions of our collection</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 4).map((product: Product) => (
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
            <div className="text-center mt-10">
              <Link href="/products" className="border border-charcoal text-charcoal px-6 py-3 rounded-md font-medium transition-all hover:bg-charcoal hover:text-white">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Brand Story Banner */}
      <section className="relative py-20 md:py-28 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-[0.2em] font-light opacity-60">About NOORÉ</span>
          <h2 className="font-editorial text-3xl md:text-5xl font-semibold mt-4">
            Crafted for Your Moments
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mt-4 text-sm md:text-base">
            Every piece is designed with the modern Pakistani woman and man in mind — 
            blending traditional craftsmanship with contemporary aesthetics.
          </p>
          <Link href="/about" className="inline-block mt-8 border-b-2 border-white pb-1 text-sm font-medium hover:opacity-70 transition">
            Discover Our Story →
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="font-editorial text-3xl font-semibold">Join Our World</h2>
        <p className="text-secondary mt-2 text-sm">
          Sign up for exclusive access to new collections, private offers and fashion updates.
        </p>
        <form className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Email Address"
            className="flex-1 px-4 py-3 border border-cream rounded-md bg-white focus:border-charcoal outline-none text-sm"
            required
          />
          <button type="submit" className="bg-charcoal text-white px-6 py-3 rounded-md font-medium hover:bg-charcoal/80 transition">
            Subscribe
          </button>
        </form>
        <p className="text-xs text-secondary mt-3">By subscribing, you agree to our Privacy Policy.</p>
      </section>
    </div>
  )
}