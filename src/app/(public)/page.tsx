import { prisma } from "@/lib/prisma"
import { HomepageHero } from "@/components/home/homepage-hero"
import { BrandSection, CategorySection, CollectionBanner, ProductSection } from "@/components/home/home-section"

export const dynamic = "force-dynamic"

const fallbackSections = ["hero", "categories", "products", "banner", "luxury", "men", "accessories", "newsletter"]

export default async function HomePage() {
  const [sections, banners, products] = await Promise.all([
    prisma.homepageSection.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    prisma.heroBanner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 24 }),
  ])

  const order = sections.length ? sections.map(section => section.type) : fallbackSections
  const newArrivals = products.slice(0, 8)
  const men = products.filter(product => product.gender?.toLowerCase() === "men" || product.category.toLowerCase() === "men").slice(0, 8)
  const luxury = products.filter(product => product.collection?.toLowerCase().includes("luxury") || product.category.toLowerCase().includes("luxury")).slice(0, 8)

  return <div className="bg-[#faf9f6]">
    {order.map((type, index) => {
      if (type === "hero") return <HomepageHero key={`hero-${index}`} banners={banners} />
      if (type === "categories") return <CategorySection key={`categories-${index}`} />
      if (type === "products") return <ProductSection key={`products-${index}`} eyebrow="Fresh in" title="New Arrivals" products={newArrivals} />
      if (type === "banner") return <CollectionBanner key={`banner-${index}`} />
      if (type === "luxury") return <ProductSection key={`luxury-${index}`} eyebrow="Curated edit" title="Luxury" products={luxury.length ? luxury : newArrivals} />
      if (type === "men") return <ProductSection key={`men-${index}`} eyebrow="For him" title="Men's Edit" products={men.length ? men : newArrivals} />
      if (type === "accessories") return <ProductSection key={`accessories-${index}`} eyebrow="Complete the look" title="Accessories" products={products.filter(product => product.category.toLowerCase().includes("accessor")).slice(0, 8)} />
      if (type === "newsletter") return <section key={`newsletter-${index}`} className="py-16 md:py-20 text-center px-6"><p className="text-[10px] uppercase tracking-[.28em] text-secondary">Stay in the know</p><h2 className="font-editorial text-3xl md:text-4xl mt-3">Join the NOORÉ world</h2><p className="text-sm text-secondary mt-3">New drops, curated edits and private offers.</p><div className="max-w-md mx-auto mt-6 flex border-b border-black"><input type="email" placeholder="Email address" className="flex-1 bg-transparent px-1 py-3 text-sm outline-none"/><button className="px-2 text-xs uppercase tracking-wider">Subscribe</button></div></section>
      if (type === "instagram") return <BrandSection key={`instagram-${index}`} />
      return null
    })}
  </div>
}
