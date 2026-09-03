import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"

export const dynamic = "force-dynamic"

type Props = { searchParams?: Record<string, string | string[] | undefined> }
const value = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] || "" : v || ""

export default async function SearchPage({ searchParams }: Props) {
  const q = value(searchParams?.q).trim()
  const category = value(searchParams?.category)
  const sort = value(searchParams?.sort) || "newest"
  const page = Math.max(1, Number(value(searchParams?.page) || 1))
  const where: any = { status: "ACTIVE" }
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { sku: { contains: q, mode: "insensitive" } },
    { category: { contains: q, mode: "insensitive" } },
    { collection: { contains: q, mode: "insensitive" } },
    { tags: { has: q } },
  ]
  if (category) where.category = category
  const orderBy: any = sort === "price-low" ? { price: "asc" } : sort === "price-high" ? { price: "desc" } : sort === "popular" ? { orderItems: { _count: "desc" } } : { createdAt: "desc" }
  const take = 24
  const [total, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * take, take }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { category: true }, distinct: ["category"] }),
  ])
  const pages = Math.ceil(total / take)
  const makeHref = (p: number, c = category, s = sort) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (c) params.set("category", c)
    if (s) params.set("sort", s)
    if (p > 1) params.set("page", String(p))
    return `/search?${params.toString()}`
  }
  return <div className="min-h-screen bg-cream py-10">
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">NOORÉ SEARCH</p>
        <h1 className="font-editorial text-4xl font-semibold mt-2">{q ? `Results for “${q}”` : "Discover the Collection"}</h1>
        <p className="text-secondary mt-2">{total} pieces found</p>
      </div>
      <form className="bg-white border border-cream rounded-xl p-4 mb-8 grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-3">
        <input name="q" defaultValue={q} placeholder="Search dresses, shirts, SKU..." className="border border-cream rounded-md px-4 py-3 outline-none focus:border-charcoal" />
        <select name="category" defaultValue={category} className="border border-cream rounded-md px-3 py-3"><option value="">All categories</option>{categories.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}</select>
        <select name="sort" defaultValue={sort} className="border border-cream rounded-md px-3 py-3"><option value="newest">Newest</option><option value="popular">Popular</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option></select>
        <button className="bg-charcoal text-white rounded-md px-6 py-3 font-medium">Search</button>
      </form>
      {products.length === 0 ? <div className="bg-white border border-cream rounded-xl p-14 text-center"><h2 className="font-editorial text-2xl">No pieces found</h2><p className="text-secondary mt-2">Try a different search or explore all products.</p><Link href="/products" className="inline-block mt-6 bg-charcoal text-white px-6 py-3 rounded-md">Shop All</Link></div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{products.map((p: any) => <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price} salePrice={p.salePrice} image={p.images[0] || "/placeholder.jpg"} category={p.category} stock={p.stock} />)}</div>}
      {pages > 1 && <div className="flex justify-center gap-2 mt-10">{Array.from({length: pages}, (_, i) => i + 1).map(p => <Link key={p} href={makeHref(p)} className={`px-4 py-2 rounded border ${p === page ? "bg-charcoal text-white border-charcoal" : "border-cream bg-white"}`}>{p}</Link>)}</div>}
    </div>
  </div>
}
