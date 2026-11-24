export const dynamic = "force-dynamic"
export const revalidate = 0

import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { cookies } from "next/headers"
import {
  getDominantInterest,
  PERSONALIZATION_COOKIE,
  scoreProductInterest,
  type InterestSegment,
} from "@/lib/personalization"

const worlds = [
  {
    title: "Women",
    eyebrow: "The feminine edit",
    copy: "Modern silhouettes, festive layers and everyday refinement.",
    href: "/women",
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1500&auto=format&fit=crop",
  },
  {
    title: "Men",
    eyebrow: "The modern wardrobe",
    copy: "Tailored essentials and understated Pakistani style.",
    href: "/men",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1500&auto=format&fit=crop",
  },
  {
    title: "Kids",
    eyebrow: "Little occasions",
    copy: "Playful occasionwear and easy everyday pieces.",
    href: "/kids",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1500&auto=format&fit=crop",
  },
]

const categories = [
  { name: "Women", href: "/women", fallback: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop", gender: "women", description: "The complete women’s wardrobe, from everyday to occasion." },
  { name: "Men", href: "/men", fallback: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&auto=format&fit=crop", gender: "men", description: "Modern Pakistani menswear and refined essentials." },
  { name: "Kids", href: "/kids", fallback: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&auto=format&fit=crop", gender: "kids", description: "Little wardrobes for everyday and special moments." },
  { name: "Unstitched", href: "/products?category=Unstitched", fallback: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=85&auto=format&fit=crop", category: "Unstitched", description: "Choose your fabric and create your own look." },
  { name: "Luxury", href: "/products?category=Luxury", fallback: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=85&auto=format&fit=crop", category: "Luxury", description: "Elevated pieces for celebrations and statement dressing." },
]

const stories = [
  {
    eyebrow: "The New Edit",
    title: "Quiet luxury, made for every day.",
    copy: "Refined silhouettes, considered details and effortless Pakistani elegance.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=85&auto=format&fit=crop",
    href: "/products?category=Ready%20to%20Wear",
  },
  {
    eyebrow: "The occasion edit",
    title: "Made for moments that matter.",
    copy: "Considered looks for celebrations, evenings and the moments in between.",
    image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1800&q=85&auto=format&fit=crop",
    href: "/products?category=Luxury",
  },
]

function readInterest(): { segment: InterestSegment | null; scores: Record<InterestSegment, number> } {
  try {
    const raw = cookies().get(PERSONALIZATION_COOKIE)?.value
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

function personalize<
  T extends {
    gender?: string | null
    category?: string | null
    subcategory?: string | null
    type?: string | null
    tags?: string[]
    name?: string | null
  },
>(products: T[], segment: InterestSegment | null) {
  if (!segment) return products
  return [...products].sort((a, b) => scoreProductInterest(b)[segment] - scoreProductInterest(a)[segment])
}

export default async function HomePage() {
  const { segment: interest } = readInterest()

  const [newRaw, saleRaw, limitedRaw, popularGroups, categoryImageRows, journalPosts] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 24,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", salePrice: { not: null } },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stock: { gt: 0, lte: 5 } },
      take: 12,
      orderBy: { stock: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { gender: { in: ["Women", "WOMEN", "women", "Men", "MEN", "men", "Kids", "KIDS", "kids", "Children"] } },
          { category: { in: ["Unstitched", "Luxury"] } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 250,
      select: { category: true, gender: true, images: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: { id: true, title: true, slug: true, category: true, excerpt: true, image: true, author: true, publishedAt: true },
    }),
  ])

  const newProducts = personalize(newRaw, interest).slice(0, 8)
  const saleProducts = personalize(saleRaw, interest).slice(0, 4)
  const limitedProducts = personalize(limitedRaw, interest).slice(0, 4)

  const popularIds = popularGroups.map((x: any) => x.productId)
  const popularProducts = popularIds.length
    ? await prisma.product.findMany({ where: { id: { in: popularIds }, status: "ACTIVE" } })
    : []
  const popularMap = new Map(popularProducts.map((p) => [p.id, p]))
  const trendingProducts = personalize(
    popularIds.map((id: string) => popularMap.get(id)).filter(Boolean) as typeof popularProducts,
    interest,
  )

  const categoryImage = (item: (typeof categories)[number]) => {
    const matchingProduct = categoryImageRows.find((product) =>
      item.gender
        ? product.gender?.toLowerCase() === item.gender
        : product.category.toLowerCase() === item.category?.toLowerCase(),
    )
    return matchingProduct?.images?.[0] || item.fallback
  }

  const interestLabel =
    interest === "women"
      ? "Your edit · Women"
      : interest === "men"
        ? "Your edit · Men"
        : interest === "kids"
          ? "Your edit · Kids"
          : null

  return (
    <main className="overflow-hidden bg-[#535F4C] text-[#f5f0e7]">
      {interestLabel && (
        <div className="border-b border-[#D4A07D]/20 bg-[#535F4C]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3 md:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em]">{interestLabel}</p>
            <Link href={`/products?gender=${interest}`} className="text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
              Shop your edit
            </Link>
          </div>
        </div>
      )}

      {/* Editorial campaign hero */}
      <section className="mx-auto max-w-[1600px] px-3 pt-3 sm:px-5 md:px-8 md:pt-6">
        <div className="grid overflow-hidden border border-[#D4A07D]/20 bg-[#535F4C] md:min-h-[680px] md:grid-cols-[0.82fr_1.18fr]">
          <div className="relative flex min-h-[430px] flex-col justify-between px-6 py-8 sm:px-10 sm:py-11 md:min-h-[680px] md:px-12 md:py-14 lg:px-16">
            <div className="absolute left-0 top-10 h-20 w-px bg-[#D4A07D] md:top-14 md:h-28" />
            <div>
              <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#D4A07D]">
                <span>NOORÉ</span><span className="h-px w-8 bg-[#D4A07D]/70" /><span>{interestLabel || "The new season"}</span>
              </div>
              <p className="mt-14 font-serif text-base italic text-[#EAE7DD]/75 md:mt-20 md:text-lg">A wardrobe with a point of view.</p>
              <h1 className="mt-5 max-w-xl font-editorial text-[3.45rem] font-medium leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-[5.6rem]">
                Elegance,<br />in every<br /><span className="text-[#D4A07D]">detail.</span>
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-7 text-[#EAE7DD]/65">
                Discover considered pieces for everyday moments and occasions worth remembering.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products?sort=newest" className="inline-flex min-h-12 items-center justify-center border border-[#D4A07D] bg-[#D4A07D] px-6 text-[9px] font-bold uppercase tracking-[0.2em] text-[#535F4C] transition-colors hover:border-[#F7F6F2] hover:bg-[#F7F6F2]">
                  Discover the new edit <span className="ml-3 text-sm">↗</span>
                </Link>
                <Link href="/products?category=Luxury" className="inline-flex min-h-12 items-center justify-center border border-white/25 px-6 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/85 transition-colors hover:border-[#D4A07D] hover:text-[#D4A07D]">
                  Explore luxury
                </Link>
              </div>
            </div>
            <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-[8px] uppercase tracking-[0.22em] text-white/40 md:mt-16">
              <span>Designed in Pakistan</span><span>01 — The NOORÉ edit</span>
            </div>
          </div>
          <div className="group relative min-h-[430px] overflow-hidden bg-[#3b3029] sm:min-h-[560px] md:min-h-[680px]">
            <div className="absolute inset-0 bg-cover bg-[center_35%] transition-transform duration-[1400ms] ease-out group-hover:scale-[1.035]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2200&q=85&auto=format&fit=crop')" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
            <div className="absolute left-5 top-5 border border-white/30 bg-black/15 px-4 py-3 backdrop-blur-sm sm:left-7 sm:top-7">
              <p className="text-[8px] uppercase tracking-[0.25em] text-white/65">The season’s point of view</p>
              <p className="mt-1 font-editorial text-2xl text-white sm:text-3xl">Effortless. Elevated.</p>
            </div>
            <div className="absolute bottom-5 right-5 flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/75 sm:bottom-7 sm:right-7">
              <span className="h-px w-8 bg-[#D4A07D]" /><span>Discover your style</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 border-x border-b border-[#D4A07D]/20 bg-[#535F4C]">
          <Link href="/women" className="group flex items-center justify-between gap-3 border-r border-[#D4A07D]/20 px-5 py-4 transition-colors hover:bg-[#465340] sm:px-8 sm:py-5">
            <span><span className="block text-[8px] uppercase tracking-[0.22em] text-[#B8AA91]/55">01 / Discover</span><span className="mt-1 block font-editorial text-xl sm:text-2xl">The feminine edit</span></span>
            <span className="text-lg text-[#D4A07D] transition-transform group-hover:translate-x-1">↗</span>
          </Link>
          <Link href="/collections" className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#465340] sm:px-8 sm:py-5">
            <span><span className="block text-[8px] uppercase tracking-[0.22em] text-[#B8AA91]/55">02 / Explore</span><span className="mt-1 block font-editorial text-xl sm:text-2xl">Curated collections</span></span>
            <span className="text-lg text-[#D4A07D] transition-transform group-hover:translate-x-1">↗</span>
          </Link>
        </div>
      </section>

      {/* Brand ticker */}
      <section className="border-y border-[#D4A07D]/20 bg-[#535F4C] py-4 sm:py-5">
        <div className="noore-announcement-track flex min-w-max items-center gap-8 px-5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#B8AA91]/65">
          {Array.from({ length: 2 }).flatMap((_, repeat) =>
            ["Designed in Pakistan", "Quiet luxury", "Free delivery above PKR 5,000", "Easy 7-day exchanges", "Made for the modern wardrobe"].map((item) => (
              <span key={`${repeat}-${item}`} className="flex items-center gap-8">
                <span>{item}</span><span className="text-[#D4A07D]">✦</span>
              </span>
            )),
          )}
        </div>
      </section>

      {/* Shop by world — magazine layout */}
      <section className="mx-auto max-w-[1440px] px-3 py-12 sm:px-5 sm:py-16 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-[0.55fr_1.45fr] md:items-end">
          <div>
            <p className="text-[9px] uppercase tracking-[0.32em] text-[#B8AA91]/65">Choose your world</p>
            <h2 className="mt-3 font-editorial text-4xl leading-[0.92] sm:text-5xl md:text-6xl">Find your point of view.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#EAE7DD]/70 md:justify-self-end">A curated wardrobe spanning women, men and little ones — designed with a distinctly NOORÉ sense of proportion, texture and ease.</p>
        </div>

        <div className="mt-7 grid gap-3 sm:mt-10 md:grid-cols-3">
          {worlds.map((item, index) => (
            <Link key={item.title} href={item.href} className={`group relative overflow-hidden bg-black text-white ${index === 1 ? "md:mt-12" : ""}`}>
              <div className="aspect-[0.78] bg-cover bg-center transition duration-[1000ms] group-hover:scale-[1.04]" style={{ backgroundImage: `url('${item.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 md:inset-x-7 md:bottom-7">
                <p className="text-[8px] uppercase tracking-[0.25em] text-white/60">{item.eyebrow}</p>
                <h3 className="mt-2 font-editorial text-4xl md:text-5xl">{item.title}</h3>
                <p className="mt-2 max-w-xs text-xs leading-5 text-white/65">{item.copy}</p>
                <span className="mt-4 inline-block border-b border-white/70 pb-1 text-[9px] font-semibold uppercase tracking-[0.2em]">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {newProducts.length > 0 && (
        <section className="bg-[#F7F6F2] py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-3 sm:px-5 md:px-8">
            <div className="flex items-end justify-between gap-6 border-b border-[#D4A07D]/30 pb-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.32em] text-black/40">Just landed</p>
                <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">The new edit.</h2>
              </div>
              <Link href="/products" className="text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">View all</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-2.5 gap-y-7 sm:mt-8 sm:gap-x-3 sm:gap-y-9 md:grid-cols-4 md:gap-x-5 md:gap-y-12">
              {newProducts.map((product: any) => (
                <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full-width story */}
      <section className="relative min-h-[620px] overflow-hidden bg-[#535F4C] text-white md:min-h-[760px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=2200&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
        <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] items-end px-5 pb-12 md:min-h-[760px] md:items-center md:px-8 md:pb-0">
          <div className="max-w-2xl">
            <p className="text-[9px] uppercase tracking-[0.35em] text-white/55">The luxury edit</p>
            <h2 className="mt-4 font-editorial text-6xl leading-[0.88] md:text-8xl">For evenings that deserve more.</h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/65">Elevated pieces, occasion silhouettes and considered details designed to make an entrance without asking for attention.</p>
            <Link href="/products?category=Luxury" className="mt-7 inline-block border-b border-white/70 pb-1 text-[9px] font-semibold uppercase tracking-[0.22em]">Explore the luxury edit</Link>
          </div>
        </div>
      </section>

      {/* Trending */}
      {trendingProducts.length > 0 && (
        <section className="bg-[#535F4C] py-16 text-[#f5f0e7] md:py-24">
          <div className="mx-auto max-w-[1440px] px-5 md:px-8">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.32em] text-[#B8AA91]/60">Loved by our customers</p>
                <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">Trending now.</h2>
              </div>
              <Link href="/products?sort=popular" className="text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Shop trending</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-4 md:gap-x-5">
              {trendingProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price} salePrice={p.salePrice} image={p.images[0] || "/placeholder.jpg"} hoverImage={p.images[1]} category={p.category} stock={p.stock} gender={p.gender} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category strip */}
      <section className="bg-[#535F4C] py-12 text-white sm:py-16 md:py-24">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.32em] text-white/40">Browse the details</p>
              <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">Shop by category.</h2>
            </div>
            <Link href="/products" className="text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">View all</Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-2 sm:mt-9 md:grid-cols-5 md:gap-3">
            {categories.map((item) => (
              <Link key={item.name} href={item.href} className="group relative isolate overflow-hidden border border-[#D4A07D]/15 bg-[#465340]">
                <div className="aspect-[0.78] bg-cover bg-center transition duration-[900ms] group-hover:scale-[1.05]" style={{ backgroundImage: `url('${categoryImage(item)}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white md:inset-x-5 md:bottom-5">
                  <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#D4A07D]">NOORÉ EDIT</p>
                  <h3 className="font-editorial text-2xl md:text-3xl">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/70">{item.description}</p>
                  <span className="mt-2 block text-[8px] font-semibold uppercase tracking-[0.18em] text-[#f0d8a8]">Shop →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Story pair */}
      <section className="mx-auto max-w-[1440px] px-3 py-12 sm:px-5 sm:py-16 md:px-8 md:py-24">
        <div className="grid gap-3 md:grid-cols-2">
          {stories.map((story, index) => (
            <Link key={story.title} href={story.href} className={`group relative min-h-[560px] overflow-hidden bg-black text-white ${index === 1 ? "md:mt-16" : ""}`}>
              <div className="absolute inset-0 bg-cover bg-center transition duration-[1000ms] group-hover:scale-[1.04]" style={{ backgroundImage: `url('${story.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-6 bottom-7 md:inset-x-8 md:bottom-9">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/60">{story.eyebrow}</p>
                <h2 className="mt-3 max-w-xl font-editorial text-5xl leading-[0.92] md:text-6xl">{story.title}</h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/65">{story.copy}</p>
                <span className="mt-6 inline-block border-b border-white/70 pb-1 text-[9px] font-semibold uppercase tracking-[0.2em]">Explore story</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Limited + sale */}
      {(limitedProducts.length > 0 || saleProducts.length > 0) && (
        <section className="border-y border-black/5 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-5 md:px-8">
            <div className="grid gap-14 lg:grid-cols-2">
              {limitedProducts.length > 0 && (
                <div>
                  <div className="mb-7 flex items-end justify-between gap-4 border-b border-black/[0.08] pb-5">
                    <div><p className="text-[9px] uppercase tracking-[0.3em] text-black/40">Limited quantities</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">Almost gone.</h2></div>
                    <Link href="/products" className="text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">View all</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-5">
                    {limitedProducts.map((product: any) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} />)}
                  </div>
                </div>
              )}

              {saleProducts.length > 0 && (
                <div>
                  <div className="mb-7 flex items-end justify-between gap-4 border-b border-black/[0.08] pb-5">
                    <div><p className="text-[9px] uppercase tracking-[0.3em] text-black/40">The price edit</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">Selected on sale.</h2></div>
                    <Link href="/products?sale=1" className="text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">Shop sale</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-5">
                    {saleProducts.map((product: any) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Journal — latest published stories */}
      {journalPosts.length > 0 && (
        <section className="bg-[#F7F6F2] py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-5 md:px-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.32em] text-black/40">From the journal</p>
                <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">Notes on style.</h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-black/55">Ideas, inspiration and thoughtful notes from the world of NOORÉ.</p>
              </div>
              <Link href="/blog" className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Read all</Link>
            </div>
            <div className="mt-9 grid gap-8 md:grid-cols-3">
              {journalPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block min-w-0">
                  <div className="aspect-[1.15] overflow-hidden bg-[#ded5ca]">
                    {post.image ? (
                      <img src={post.image} alt={post.title} loading="lazy" className="h-full w-full object-cover transition duration-[900ms] group-hover:scale-[1.04]" />
                    ) : (
                      <div className="grid h-full w-full place-items-center font-editorial text-3xl text-[#7D806A]">NOORÉ</div>
                    )}
                  </div>
                  <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.22em] text-black/45">{post.category || "NOORÉ Journal"}{post.publishedAt ? ` · ${new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(post.publishedAt)}` : ""}</p>
                  <h3 className="mt-2 font-editorial text-3xl leading-tight transition group-hover:text-[#535F4C] md:text-4xl">{post.title}</h3>
                  {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55">{post.excerpt}</p>}
                  <span className="mt-4 inline-block text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">Read story →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      <section className="bg-[#535F4C] px-5 py-24 text-center text-white md:py-32">
        <p className="text-[9px] uppercase tracking-[0.35em] text-white/45">The NOORÉ philosophy</p>
        <h2 className="mx-auto mt-6 max-w-5xl font-editorial text-5xl leading-[0.92] md:text-7xl">Designed in Pakistan. Made for everywhere.</h2>
        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/55">Heritage, modern silhouettes and thoughtful details — brought together for pieces that feel relevant today and beautiful for years to come.</p>
        <Link href="/products" className="mt-8 inline-block border-b border-white/60 pb-1 text-[9px] font-semibold uppercase tracking-[0.22em]">Discover NOORÉ</Link>
      </section>
    </main>
  )
}
