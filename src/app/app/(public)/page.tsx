export const dynamic = "force-dynamic"
export const revalidate = 0

import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { cookies } from "next/headers"
import { getDominantInterest, PERSONALIZATION_COOKIE, scoreProductInterest, type InterestSegment } from "@/lib/personalization"
import { DEFAULT_HOMEPAGE_DESIGN, normalizeHomepageDesign } from "@/lib/homepage-design"

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

async function readInterest(): Promise<{ segment: InterestSegment | null; scores: Record<InterestSegment, number> }> {
  try {
    const raw = (await cookies()).get(PERSONALIZATION_COOKIE)?.value
    if (!raw) return { segment: null, scores: { women: 0, men: 0, kids: 0 } }
    const parsed = JSON.parse(decodeURIComponent(raw))
    const scores = {
      women: Number(parsed?.women) || 0,
      men: Number(parsed?.men) || 0,
      kids: Number(parsed?.kids) || 0,
    }
    return { segment: getDominantInterest(scores), scores }
  } catch {
    return { segment: null, scores: { women: 0, men: 0, kids: 0 } }
  }
}

function personalize<T extends { gender?: string | null; category?: string | null; subcategory?: string | null; type?: string | null; tags?: string[]; name?: string | null }>(products: T[], segment: InterestSegment | null) {
  if (!segment) return products
  return [...products].sort((a, b) => scoreProductInterest(b)[segment] - scoreProductInterest(a)[segment])
}

export default async function HomePage() {
  const { segment: interest } = await readInterest()
  const [featuredRaw, saleRaw, limitedRaw, popularGroups, designRow] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, take: 24, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", salePrice: { not: null } }, take: 12, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", stock: { gt: 0, lte: 5 } }, take: 12, orderBy: { stock: "asc" } }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
    prisma.setting.findUnique({ where: { key: "homepage_design" } }),
  ])
  let savedDesign: unknown = {}
  try { savedDesign = designRow?.value ? JSON.parse(designRow.value) : {} } catch {}
  const design = normalizeHomepageDesign(savedDesign)
  const headingFamily = design.headingFont === "sans" ? "Arial, sans-serif" : design.headingFont === "serif" ? "Times New Roman, serif" : "Georgia, serif"
  const featuredProducts = personalize(featuredRaw, interest).slice(0, 8)
  const saleProducts = personalize(saleRaw, interest).slice(0, 4)
  const limitedProducts = personalize(limitedRaw, interest).slice(0, 4)
  const popularIds = popularGroups.map((x: any) => x.productId)
  const popularProducts = popularIds.length ? await prisma.product.findMany({ where: { id: { in: popularIds }, status: "ACTIVE" } }) : []
  const popularMap = new Map(popularProducts.map((p) => [p.id, p]))
  const trendingProducts = personalize(popularIds.map((id: string) => popularMap.get(id)).filter(Boolean) as typeof popularProducts, interest)

  const interestLabel = interest === "women" ? "Your edit · Women" : interest === "men" ? "Your edit · Men" : interest === "kids" ? "Your edit · Kids" : null

  return (
    <div className="noore-sage-theme bg-cream text-charcoal" style={{ backgroundColor: design.backgroundColor, color: design.textColor, ["--noore-text" as any]: design.textColor, ["--noore-accent" as any]: design.accentColor, ["--noore-button" as any]: design.buttonColor, ["--noore-button-text" as any]: design.buttonTextColor, ["--noore-heading-font" as any]: headingFamily }}>
      <style>{`.noore-sage-theme .font-editorial{font-family:var(--noore-heading-font)!important}.noore-sage-theme .text-charcoal{color:var(--noore-text,${design.textColor})}.noore-sage-theme [class~="text-black/45"]{color:var(--noore-accent)!important}.noore-sage-theme [class~="text-black/50"],.noore-sage-theme [class~="text-black/55"]{color:var(--noore-text)!important;opacity:.72}.noore-sage-theme .bg-white{background-color:${design.backgroundColor}!important}.noore-sage-theme .bg-cream{background-color:${design.backgroundColor}!important}.noore-sage-theme .hero-secondary{border-color:${design.accentColor}!important;color:${design.accentColor}!important}.noore-sage-theme .hero-secondary:hover{background:${design.accentColor}!important;color:#fff!important}`}</style>
      {/* Adaptive personalization */}
      {interestLabel && (
        <section className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal">{interestLabel}</p>
            <Link href={`/products?gender=${interest}`} className="text-[9px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4">Shop your edit</Link>
          </div>
        </section>
      )}

      {/* Editorial hero */}
      <section className="relative min-h-[78vh] md:min-h-[88vh] overflow-hidden bg-charcoal text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=2400&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/10" />
        <div className="relative z-10 mx-auto flex min-h-[72vh] md:min-h-[82vh] max-w-7xl items-end px-5 pb-16 md:items-center md:pb-0">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/75 md:text-xs">{interestLabel || design.heroEyebrow}</p>
            <p className="mt-5 text-2xl italic text-white/85 md:text-3xl">{design.heroKicker}</p><h1 className="mt-3 font-editorial text-6xl font-medium leading-[0.92] tracking-tight md:text-8xl lg:text-[7.5rem]">{design.heroHeading}</h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/75 md:text-base">{design.heroDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={design.primaryButtonUrl} className="hero-primary px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition hover:opacity-90" style={{ backgroundColor: design.buttonColor, color: design.buttonTextColor }}>{design.primaryButtonText}</Link>
              <Link href={design.secondaryButtonUrl} className="hero-secondary border border-white/60 px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-charcoal">{design.secondaryButtonText}</Link>
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

      {/* Find your expression */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.collectionsEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.collectionsHeading}</h2></div>
          <Link href="/collections" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">View collections</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {[
            { title: "Women", copy: "Modern silhouettes, festive layers and everyday refinement.", href: "/women", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&auto=format&fit=crop" },
            { title: "Men", copy: "Tailored essentials and understated Pakistani style.", href: "/men", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop" },
            { title: "Kids", copy: "Playful occasionwear and easy everyday pieces.", href: "/kids", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&auto=format&fit=crop" },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="group relative min-h-[500px] overflow-hidden bg-black text-white md:min-h-[620px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${item.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/65">NOORÉ</p>
                <h3 className="mt-2 font-editorial text-4xl md:text-5xl">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{item.copy}</p>
                <span className="mt-6 inline-block border-b border-white pb-1 text-[10px] font-semibold uppercase tracking-[0.2em]">Explore {item.title} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending / best sellers */}
      {trendingProducts.length > 0 && (
        <section className="py-16 md:py-24" style={{ backgroundColor: design.backgroundColor }}>
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.favouritesEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.favouritesHeading}</h2></div><Link href="/products?sort=popular" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">Shop trending</Link></div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
              {trendingProducts.map((p) => <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price} salePrice={p.salePrice} image={p.images[0] || "/placeholder.jpg"} hoverImage={p.images[1]} category={p.category} stock={p.stock} />)}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.categoriesEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.categoriesHeading}</h2></div>
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

      {/* New season arrivals */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.arrivalsEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.arrivalsHeading}</h2></div>
              <Link href="/products" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">Shop all</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
              {featuredProducts.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} category={product.category} stock={product.stock} gender={product.gender} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Luxury spotlight */}
      <section className="bg-charcoal text-white">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          <div className="relative min-h-[560px] overflow-hidden md:min-h-[700px]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop')" }} />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="flex items-center px-7 py-16 md:px-14 md:py-24">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">{design.luxuryEyebrow}</p>
              <h2 className="mt-4 font-editorial text-5xl leading-[0.98] md:text-7xl">{design.luxuryHeading}</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">{design.luxuryDescription}</p>
              <Link href={design.luxuryButtonUrl} className="mt-8 inline-block border-b border-white/70 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em]">{design.luxuryButtonText}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Limited edit */}
      {limitedProducts.length > 0 && (
        <section className="border-y border-black/5 py-16 md:py-20" style={{ backgroundColor: design.backgroundColor }}>
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.limitedEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.limitedHeading}</h2><p className="mt-2 text-sm text-black/50">{design.limitedDescription}</p></div>
              <Link href="/products" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
              {limitedProducts.map((product: any) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} />)}
            </div>
          </div>
        </section>
      )}

      {/* Sale edit */}
      {saleProducts.length > 0 && (
        <section className="bg-charcoal py-16 text-white md:py-20">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{design.saleEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.saleHeading}</h2><p className="mt-2 text-sm text-white/55">{design.saleDescription}</p></div>
              <Link href="/products?sale=1" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">Shop sale</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
              {saleProducts.map((product: any) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} />)}
            </div>
          </div>
        </section>
      )}

      {/* Collection stories */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-9 flex items-end justify-between gap-4">
            <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.storiesEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.storiesHeading}</h2></div>
            <Link href="/collections" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">See all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["The New Edit", "Everyday pieces with an elevated point of view.", "/collections", "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1200&auto=format&fit=crop"],
              ["Festive 2026", "Statement dressing for celebrations and evenings.", "/collections", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop"],
              ["Quiet Luxury", "Refined textures, softer lines and lasting essentials.", "/collections", "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&auto=format&fit=crop"],
            ].map(([title, copy, href, image]) => (
              <Link key={title} href={href} className="group relative min-h-[430px] overflow-hidden bg-black text-white md:min-h-[520px]">
                <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-6 md:p-8"><p className="font-editorial text-3xl md:text-4xl">{title}</p><p className="mt-2 max-w-xs text-sm text-white/65">{copy}</p><span className="mt-5 inline-block text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Discover →</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

      {/* Journal */}
      <section className="border-y border-black/5 py-16 md:py-24" style={{backgroundColor:design.backgroundColor}}>
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-9 flex items-end justify-between gap-4">
            <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">{design.journalEyebrow}</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">{design.journalHeading}</h2></div>
            <Link href="/journal" className="text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4">Read all</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["How to build a timeless Pakistani wardrobe", "Style notes", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1000&auto=format&fit=crop"],
              ["The details behind modern festive dressing", "Inside NOORÉ", "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1000&auto=format&fit=crop"],
              ["Three ways to style one statement piece", "Styling", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1000&auto=format&fit=crop"],
            ].map(([title, eyebrow, image]) => (
              <Link key={title} href="/journal" className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-black"><div className="h-full w-full bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} /></div>
                <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-black/45">{eyebrow}</p>
                <h3 className="mt-2 font-editorial text-2xl leading-tight md:text-3xl">{title}</h3>
                <span className="mt-4 inline-block text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">Read story →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-y border-black/5 px-5 py-20 text-center md:py-28" style={{backgroundColor:design.backgroundColor}}>
        <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">{design.brandEyebrow}</p>
        <h2 className="mx-auto mt-5 max-w-4xl font-editorial text-4xl leading-tight md:text-6xl">{design.brandHeading}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-black/55">{design.brandDescription}</p>
        <Link href={design.brandButtonUrl} className="mt-8 inline-block border-b border-charcoal pb-1 text-[10px] font-semibold uppercase tracking-[0.2em]">{design.brandButtonText}</Link>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-2xl px-5 py-20 text-center md:py-24">
        <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">{design.newsletterEyebrow}</p>
        <h2 className="mt-3 font-editorial text-4xl md:text-5xl">{design.newsletterHeading}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/50">{design.newsletterDescription}</p>
        <Link href={design.newsletterButtonUrl} className="mt-7 inline-flex px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{backgroundColor:design.buttonColor,color:design.buttonTextColor}}>{design.newsletterButtonText}</Link>
      </section>
    </div>
  )
}
