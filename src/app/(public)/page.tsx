export const dynamic = "force-dynamic"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { cookies } from "next/headers"
import { unstable_cache } from "next/cache"
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
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&q=75&auto=format&fit=crop",
  },
  {
    title: "Men",
    eyebrow: "The modern wardrobe",
    copy: "Tailored essentials and understated Pakistani style.",
    href: "/men",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=75&auto=format&fit=crop",
  },
  {
    title: "Kids",
    eyebrow: "Little occasions",
    copy: "Playful occasionwear and easy everyday pieces.",
    href: "/kids",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&q=75&auto=format&fit=crop",
  },
]

const categories = [
  ["Unstitched", "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=75&auto=format&fit=crop"],
  ["Ready to Wear", "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&q=75&auto=format&fit=crop"],
  ["Luxury", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&q=75&auto=format&fit=crop"],
  ["Men", "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&q=75&auto=format&fit=crop"],
  ["Accessories", "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=900&q=75&auto=format&fit=crop"],
]

const stories = [
  {
    eyebrow: "The New Edit",
    title: "Quiet luxury, made for every day.",
    copy: "Refined silhouettes, considered details and effortless Pakistani elegance.",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1500&q=75&auto=format&fit=crop",
    href: "/products?category=Ready%20to%20Wear",
  },
  {
    eyebrow: "Festive 2026",
    title: "Moments worth dressing for.",
    copy: "Statement pieces for celebrations, evenings and everything between.",
    image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1500&q=75&auto=format&fit=crop",
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

const homeProductSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  salePrice: true,
  images: true,
  category: true,
  stock: true,
  gender: true,
} as const

const getNewProducts = unstable_cache(
  () => prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 24,
    orderBy: { createdAt: "desc" },
    select: homeProductSelect,
  }),
  ["noore-home-new-products"],
  { revalidate: 120 },
)

const getSaleProducts = unstable_cache(
  () => prisma.product.findMany({
    where: { status: "ACTIVE", salePrice: { not: null } },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: homeProductSelect,
  }),
  ["noore-home-sale-products"],
  { revalidate: 120 },
)

const getLimitedProducts = unstable_cache(
  () => prisma.product.findMany({
    where: { status: "ACTIVE", stock: { gt: 0, lte: 5 } },
    take: 12,
    orderBy: { stock: "asc" },
    select: homeProductSelect,
  }),
  ["noore-home-limited-products"],
  { revalidate: 120 },
)

const getPopularGroups = unstable_cache(
  () => prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  }),
  ["noore-home-popular-products"],
  { revalidate: 300 },
)

export default async function HomePage() {
  const { segment: interest } = readInterest()

  const [newRaw, saleRaw, limitedRaw, popularGroups] = await Promise.all([
    getNewProducts(),
    getSaleProducts(),
    getLimitedProducts(),
    getPopularGroups(),
  ])

  const newProducts = personalize(newRaw, interest).slice(0, 8)
  const saleProducts = personalize(saleRaw, interest).slice(0, 4)
  const limitedProducts = personalize(limitedRaw, interest).slice(0, 4)

  const popularIds = popularGroups.map((x: any) => x.productId)
  const popularProducts = popularIds.length
    ? await prisma.product.findMany({
        where: { id: { in: popularIds }, status: "ACTIVE" },
        select: homeProductSelect,
      })
    : []
  const popularMap = new Map(popularProducts.map((p) => [p.id, p]))
  const trendingProducts = personalize(
    popularIds.map((id: string) => popularMap.get(id)).filter(Boolean) as typeof popularProducts,
    interest,
  )

  const interestLabel =
    interest === "women"
      ? "Your edit · Women"
      : interest === "men"
        ? "Your edit · Men"
        : interest === "kids"
          ? "Your edit · Kids"
          : null

  return (
    <main className="overflow-hidden bg-[#f6f1e9] text-[#24191d]">
      {interestLabel && (
        <div className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3 md:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em]">{interestLabel}</p>
            <Link href={`/products?gender=${interest}`} className="text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
              Shop your edit
            </Link>
          </div>
        </div>
      )}

      {/* HERO — editorial mosaic */}
      <section className="mx-auto max-w-[1440px] px-3 pt-3 sm:px-5 md:px-8 md:pt-5">
        <div className="grid gap-3 md:grid-cols-[1.55fr_0.9fr]">
          <Link href="/products" className="group relative min-h-[650px] overflow-hidden bg-[#24191d] text-white md:min-h-[790px]">
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-[1200ms] ease-out group-hover:scale-[1.035]"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=75&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/5" />
            <div className="absolute left-5 top-5 flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-white/70 md:left-8 md:top-8">
              <span>NOORÉ</span><span className="h-px w-8 bg-[#d6ae72]" /><span>{interestLabel || "New season"}</span>
            </div>
            <div className="absolute inset-x-5 bottom-7 md:inset-x-8 md:bottom-10">
              <p className="font-serif text-sm italic text-white/70">The art of dressing beautifully.</p>
              <h1 className="mt-3 max-w-3xl font-editorial text-5xl font-medium leading-[0.9] tracking-[-0.03em] sm:text-6xl md:text-8xl">
                A quieter kind of luxury.
              </h1>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="bg-white px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#24191d]">Shop new arrivals</span>
                <span className="border border-white/60 px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">Explore luxury</span>
              </div>
            </div>
            <span className="absolute bottom-5 right-5 hidden text-[8px] uppercase tracking-[0.2em] text-white/55 md:block">01 / 03</span>
          </Link>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <Link href="/women" className="group relative min-h-[320px] overflow-hidden bg-[#321526] text-white md:min-h-0 md:flex-1">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-[1000ms] group-hover:scale-[1.045]"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1100&q=75&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute inset-x-5 bottom-5 md:inset-x-7 md:bottom-7">
                <p className="text-[8px] uppercase tracking-[0.28em] text-white/65">01 · Women</p>
                <h2 className="mt-2 font-editorial text-4xl leading-none md:text-5xl">The feminine edit.</h2>
                <span className="mt-4 inline-block text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Discover →</span>
              </div>
            </Link>

            <Link href="/collections" className="group relative min-h-[320px] overflow-hidden bg-[#e4d7ca] text-[#24191d] md:min-h-0 md:flex-1">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-[1000ms] group-hover:scale-[1.045]"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1100&q=75&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white md:inset-x-7 md:bottom-7">
                <p className="text-[8px] uppercase tracking-[0.28em] text-white/65">02 · Collections</p>
                <h2 className="mt-2 font-editorial text-4xl leading-none md:text-5xl">Stories in every collection.</h2>
                <span className="mt-4 inline-block text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Explore →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand ticker */}
      <section className="border-b border-black/5 bg-white py-5">
        <div className="noore-announcement-track flex min-w-max items-center gap-8 px-5 text-[9px] font-semibold uppercase tracking-[0.28em] text-black/45">
          {Array.from({ length: 2 }).flatMap((_, repeat) =>
            ["Designed in Pakistan", "Quiet luxury", "Free delivery above PKR 5,000", "Easy 7-day exchanges", "Made for the modern wardrobe"].map((item) => (
              <span key={`${repeat}-${item}`} className="flex items-center gap-8">
                <span>{item}</span><span className="text-[#b78c4d]">✦</span>
              </span>
            )),
          )}
        </div>
      </section>

      {/* Shop by world — magazine layout */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-[0.55fr_1.45fr] md:items-end">
          <div>
            <p className="text-[9px] uppercase tracking-[0.32em] text-black/40">Choose your world</p>
            <h2 className="mt-3 font-editorial text-5xl leading-[0.92] md:text-6xl">Find your point of view.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-black/50 md:justify-self-end">A curated wardrobe spanning women, men and little ones — designed with a distinctly NOORÉ sense of proportion, texture and ease.</p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
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
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-5 md:px-8">
            <div className="flex items-end justify-between gap-6 border-b border-black/[0.08] pb-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.32em] text-black/40">Just landed</p>
                <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">The new edit.</h2>
              </div>
              <Link href="/products" className="text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">View all</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-4 md:gap-x-5 md:gap-y-12">
              {newProducts.map((product: any) => (
                <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full-width story */}
      <section className="relative min-h-[620px] overflow-hidden bg-[#24191d] text-white md:min-h-[760px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=75&auto=format&fit=crop')" }} />
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
        <section className="bg-[#f0e9df] py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-5 md:px-8">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.32em] text-black/40">Loved by our customers</p>
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
      <section className="bg-[#24191d] py-16 text-white md:py-24">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.32em] text-white/40">Browse the details</p>
              <h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">Shop by category.</h2>
            </div>
            <Link href="/products" className="text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">View all</Link>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
            {categories.map(([name, image]) => (
              <Link key={name} href={`/products?category=${encodeURIComponent(name)}`} className="group relative overflow-hidden">
                <div className="aspect-[0.78] bg-cover bg-center transition duration-[900ms] group-hover:scale-[1.05]" style={{ backgroundImage: `url('${image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white md:inset-x-5 md:bottom-5">
                  <h3 className="font-editorial text-2xl md:text-3xl">{name}</h3>
                  <span className="mt-1 block text-[8px] uppercase tracking-[0.18em] text-white/60">Shop →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Story pair */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24">
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

      {/* Journal */}
      <section className="bg-[#f0e9df] py-16 md:py-24">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <div className="flex items-end justify-between gap-5">
            <div><p className="text-[9px] uppercase tracking-[0.32em] text-black/40">From the journal</p><h2 className="mt-2 font-editorial text-5xl leading-none md:text-6xl">Notes on style.</h2></div>
            <Link href="/journal" className="text-[9px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Read all</Link>
          </div>
          <div className="mt-9 grid gap-8 md:grid-cols-3">
            {[
              ["How to build a timeless Pakistani wardrobe", "Style notes", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop"],
              ["The details behind modern festive dressing", "Inside NOORÉ", "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1200&auto=format&fit=crop"],
              ["Three ways to style one statement piece", "Styling", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1200&auto=format&fit=crop"],
            ].map(([title, eyebrow, image]) => (
              <Link key={title} href="/journal" className="group block">
                <div className="aspect-[1.15] overflow-hidden bg-black"><div className="h-full w-full bg-cover bg-center transition duration-[900ms] group-hover:scale-[1.04]" style={{ backgroundImage: `url('${image}')` }} /></div>
                <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.22em] text-black/45">{eyebrow}</p>
                <h3 className="mt-2 font-editorial text-3xl leading-tight md:text-4xl">{title}</h3>
                <span className="mt-4 inline-block text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">Read story →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-[#321526] px-5 py-24 text-center text-white md:py-32">
        <p className="text-[9px] uppercase tracking-[0.35em] text-white/45">The NOORÉ philosophy</p>
        <h2 className="mx-auto mt-6 max-w-5xl font-editorial text-5xl leading-[0.92] md:text-7xl">Designed in Pakistan. Made for everywhere.</h2>
        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/55">Heritage, modern silhouettes and thoughtful details — brought together for pieces that feel relevant today and beautiful for years to come.</p>
        <Link href="/products" className="mt-8 inline-block border-b border-white/60 pb-1 text-[9px] font-semibold uppercase tracking-[0.22em]">Discover NOORÉ</Link>
      </section>
    </main>
  )
}
