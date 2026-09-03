import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"

const categories = [
  { name: "Unstitched", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&auto=format&fit=crop", position: "center" },
  { name: "Ready to Wear", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop", position: "center" },
  { name: "Luxury", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&auto=format&fit=crop", position: "center" },
  { name: "Men", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&auto=format&fit=crop", position: "center" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=900&auto=format&fit=crop", position: "center" },
]

const editorial = [
  { eyebrow: "The New Edit", title: "Quiet luxury, made for every day.", copy: "Refined silhouettes, considered details and effortless Pakistani elegance.", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1600&auto=format&fit=crop", href: "/products?category=Ready%20to%20Wear" },
  { eyebrow: "Festive 2026", title: "Moments worth dressing for.", copy: "Discover statement pieces for celebrations, evenings and everything between.", image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1600&auto=format&fit=crop", href: "/products?category=Luxury" },
]

export default async function HomePage() {
  const [featuredProducts, saleProducts, limitedProducts] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", salePrice: { not: null } }, take: 4, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", stock: { gt: 0, lte: 5 } }, take: 4, orderBy: { stock: "asc" } }),
  ])

  return (
    <div className="bg-cream text-charcoal">
      {/* Editorial hero */}
      <section className="relative min-h-[72vh] md:min-h-[82vh] overflow-hidden bg-charcoal text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=2200&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/10" />
        <div className="relative z-10 mx-auto flex min-h-[72vh] md:min-h-[82vh] max-w-7xl items-end px-5 pb-16 md:items-center md:pb-0">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/75 md:text-xs">NOORÉ — New Season</p>
            <h1 className="mt-5 font-editorial text-5xl font-medium leading-[0.98] md:text-7xl lg:text-8xl">The art of everyday elegance.</h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/75 md:text-base">Contemporary Pakistani fashion, thoughtfully curated for the moments that become memories.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal transition hover:bg-white/90">Shop New Arrivals</Link>
              <Link href="/products?category=Luxury" className="border border-white/60 px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-charcoal">Explore Luxury</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          <span className="h-1 w-8 bg-white" /><span className="h-1 w-2 bg-white/40" /><span className="h-1 w-2 bg-white/40" />
        </div>
      </section>

      {/* Service promise */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-black/5 md:grid-cols-4 md:divide-y-0">
          {[
            ["Free delivery", "On orders above PKR 5,000"],
            ["Easy exchanges", "Simple 7-day exchange policy"],
            ["Curated quality", "Made for modern wardrobes"],
            ["Need help?", "Our team is here for you"],
          ].map(([title, text]) => (
            <div key={title} className="px-4 py-5 text-center md:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{title}</p>
              <p className="mt-1 text-[11px] text-black/50">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Discover</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">Shop by category</h2></div>
          <Link href="/products" className="hidden text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4 md:block">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {categories.map((category, index) => (
            <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`} className={`group relative overflow-hidden bg-black ${index === 0 ? "col-span-2 md:col-span-1" : ""}`}>
              <div className="aspect-[4/5] bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${category.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 text-white md:p-5"><h3 className="font-editorial text-2xl">{category.name}</h3><span className="mt-1 block text-[9px] uppercase tracking-[0.2em] opacity-75">Shop now →</span></div>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Just in</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">New arrivals</h2></div>
              <Link href="/products" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">Shop all</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
              {featuredProducts.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} category={product.category} stock={product.stock} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Limited edit */}
      {limitedProducts.length > 0 && (
        <section className="border-y border-black/5 bg-[#f4f0e8] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Limited quantities</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">Almost gone</h2><p className="mt-2 text-sm text-black/50">The pieces customers are reaching for now.</p></div>
              <Link href="/products" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
              {limitedProducts.map((product: any) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} />)}
            </div>
          </div>
        </section>
      )}

      {/* Sale edit */}
      {saleProducts.length > 0 && (
        <section className="bg-charcoal py-16 text-white md:py-20">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-white/45">The price edit</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">Selected on sale</h2><p className="mt-2 text-sm text-white/55">A considered selection, available while it lasts.</p></div>
              <Link href="/products?sale=1" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">Shop sale</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
              {saleProducts.map((product: any) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} />)}
            </div>
          </div>
        </section>
      )}

      {/* Editorial banners */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="grid gap-5 md:grid-cols-2">
          {editorial.map((item) => (
            <Link key={item.title} href={item.href} className="group relative min-h-[520px] overflow-hidden bg-black text-white md:min-h-[650px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${item.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 p-7 md:p-10"><p className="text-[10px] uppercase tracking-[0.3em] text-white/70">{item.eyebrow}</p><h2 className="mt-3 max-w-md font-editorial text-4xl leading-tight md:text-5xl">{item.title}</h2><p className="mt-3 max-w-md text-sm text-white/70">{item.copy}</p><span className="mt-6 inline-block border-b border-white pb-1 text-[10px] font-semibold uppercase tracking-[0.2em]">Explore collection</span></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-y border-black/5 bg-[#f4f0e8] px-5 py-20 text-center md:py-28">
        <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">The NOORÉ philosophy</p>
        <h2 className="mx-auto mt-5 max-w-4xl font-editorial text-4xl leading-tight md:text-6xl">Designed in Pakistan. Made for everywhere.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-black/55">We bring together heritage, modern silhouettes and thoughtful details to create pieces that feel relevant today and beautiful for years to come.</p>
        <Link href="/products" className="mt-8 inline-block border-b border-charcoal pb-1 text-[10px] font-semibold uppercase tracking-[0.2em]">Discover NOORÉ</Link>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-2xl px-5 py-20 text-center md:py-24">
        <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">Stay in the know</p>
        <h2 className="mt-3 font-editorial text-4xl md:text-5xl">A little more NOORÉ.</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/50">Be first to discover new collections, exclusive edits and private offers.</p>
        <Link href="/products" className="mt-7 inline-flex bg-charcoal px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Explore the collection</Link>
      </section>
    </div>
  )
}
