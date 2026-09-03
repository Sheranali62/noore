import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { HeroSlider } from "@/components/home/hero-slider"

type Product = { id: string; name: string; slug: string; price: number; salePrice: number | null; images: string[]; category: string; stock: number }
type Section = { id: string; type: string; enabled: boolean; sortOrder: number; heading: string | null; subtitle: string | null; image: string | null; buttonText: string | null; buttonUrl: string | null }

const categories = [
  { name: "Unstitched", icon: "👗", color: "bg-amber-50" }, { name: "Ready to Wear", icon: "👘", color: "bg-rose-50" },
  { name: "Luxury", icon: "💎", color: "bg-purple-50" }, { name: "Men", icon: "👔", color: "bg-blue-50" }, { name: "Accessories", icon: "👜", color: "bg-emerald-50" },
]

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [sections, banners, products] = await Promise.all([
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.heroBanner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, take: 8, orderBy: { createdAt: "desc" } }),
  ])
  const activeSections = sections.length ? sections.filter(section => section.enabled) : [
    { id: "hero", type: "hero", enabled: true, sortOrder: 1, heading: null, subtitle: null, image: null, buttonText: null, buttonUrl: null },
    { id: "categories", type: "categories", enabled: true, sortOrder: 2, heading: null, subtitle: null, image: null, buttonText: null, buttonUrl: null },
    { id: "products", type: "products", enabled: true, sortOrder: 3, heading: null, subtitle: null, image: null, buttonText: null, buttonUrl: null },
    { id: "banner", type: "banner", enabled: true, sortOrder: 4, heading: null, subtitle: null, image: null, buttonText: null, buttonUrl: null },
    { id: "newsletter", type: "newsletter", enabled: true, sortOrder: 5, heading: null, subtitle: null, image: null, buttonText: null, buttonUrl: null },
  ]

  return <div>
    {activeSections.map(section => {
      if (section.type === "hero") return <HeroSlider key={section.id} banners={banners.length ? banners : [{ id: "fallback", heading: "The Art of Everyday Elegance", subtitle: "Contemporary silhouettes rooted in timeless Pakistani craft.", image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1600&fit=crop", mobileImage: null, video: null, buttonText: "Shop Women", buttonUrl: "/products?category=Women" }]} />
      if (section.type === "categories") return <section key={section.id} className="max-w-7xl mx-auto px-4 py-16 md:py-20"><div className="text-center mb-12"><h2 className="font-editorial text-3xl md:text-4xl font-semibold">Shop the Collection</h2><p className="text-secondary mt-2">Explore our curated categories</p></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">{categories.map(cat => <Link key={cat.name} href={`/products?category=${cat.name}`} className={`group ${cat.color} rounded-lg p-6 text-center border border-cream transition-all hover:shadow-lg hover:-translate-y-1`}><div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div><h3 className="font-semibold text-sm">{cat.name}</h3><span className="text-xs text-secondary mt-1 block">Shop Now →</span></Link>)}</div></section>
      if (section.type === "products") return products.length ? <section key={section.id} className="bg-white/50 py-16 md:py-20"><div className="max-w-7xl mx-auto px-4"><div className="text-center mb-12"><h2 className="font-editorial text-3xl md:text-4xl font-semibold">{section.heading || "New Arrivals"}</h2><p className="text-secondary mt-2">{section.subtitle || "Discover the latest expressions of our collection"}</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{products.slice(0, 4).map((product: Product) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} category={product.category} stock={product.stock} />)}</div><div className="text-center mt-10"><Link href={section.buttonUrl || "/products"} className="border border-charcoal text-charcoal px-6 py-3 rounded-md font-medium transition-all hover:bg-charcoal hover:text-white">{section.buttonText || "View All Products"}</Link></div></div></section> : null
      if (section.type === "banner" || section.type === "luxury" || section.type === "men" || section.type === "accessories") return <section key={section.id} className="relative py-20 md:py-28 bg-charcoal text-white"><div className="max-w-7xl mx-auto px-4 text-center">{section.image && <img src={section.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}<div className="relative"><span className="text-xs uppercase tracking-[0.2em] font-light opacity-60">{section.type === "banner" ? "NOORÉ" : namesFor(section.type)}</span><h2 className="font-editorial text-3xl md:text-5xl font-semibold mt-4">{section.heading || (section.type === "banner" ? "Crafted for Your Moments" : `Discover ${namesFor(section.type)}`)}</h2><p className="text-white/60 max-w-2xl mx-auto mt-4 text-sm md:text-base">{section.subtitle || "Every piece is designed with modern Pakistani style in mind — blending traditional craftsmanship with contemporary aesthetics."}</p>{section.buttonText && section.buttonUrl && <Link href={section.buttonUrl} className="inline-block mt-8 border-b-2 border-white pb-1 text-sm font-medium">{section.buttonText} →</Link>}</div></div></section>
      if (section.type === "newsletter") return <section key={section.id} className="max-w-2xl mx-auto px-4 py-16 text-center"><h2 className="font-editorial text-3xl font-semibold">Join Our World</h2><p className="text-secondary mt-2 text-sm">Sign up for exclusive access to new collections, private offers and fashion updates.</p><form className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"><input type="email" placeholder="Email Address" className="flex-1 px-4 py-3 border border-cream rounded-md bg-white focus:border-charcoal outline-none text-sm" required /><button type="submit" className="bg-charcoal text-white px-6 py-3 rounded-md font-medium hover:bg-charcoal/80 transition">Subscribe</button></form><p className="text-xs text-secondary mt-3">By subscribing, you agree to our Privacy Policy.</p></section>
      return null
    })}
  </div>
}

function namesFor(type: string) { return ({ luxury: "Luxury Collection", men: "Men", accessories: "Accessories" } as Record<string, string>)[type] || type }
