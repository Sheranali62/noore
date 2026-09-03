import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { ProductFilters } from "@/components/product/product-filters"
import { ProductSort } from "@/components/product/product-sort"

export const dynamic = "force-dynamic"

export default async function ProductsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const get = (key: string) => { const value = searchParams?.[key]; return Array.isArray(value) ? value[0] || "" : value || "" }
  const category = get("category")
  const gender = get("gender")
  const collection = get("collection")
  const sale = get("sale") === "1"
  const sort = get("sort") || "newest"
  const page = Math.max(1, parseInt(get("page") || "1", 10) || 1)
  const perPage = 12

  const where: any = { status: "ACTIVE" }
  if (category && category !== "all") where.category = category
  if (gender) where.gender = gender
  if (collection) where.collection = collection
  if (sale) where.salePrice = { not: null }

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price-low") orderBy = { price: "asc" }
  if (sort === "price-high") orderBy = { price: "desc" }
  if (sort === "popular") orderBy = { stock: "asc" }

  const [totalCount, products, categoryRows, genderRows, collectionRows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage, include: { variants: { select: { color: true }, distinct: ["color"] } } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", gender: { not: null } }, select: { gender: true }, distinct: ["gender"], orderBy: { gender: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", collection: { not: null } }, select: { collection: true }, distinct: ["collection"], orderBy: { collection: "asc" } }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)
  const title = category || collection || gender || (sale ? "Sale" : "Shop All")
  const subtitle = sale ? "Selected pieces, considered prices." : "Discover the latest NOORÉ collection."
  const makePageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (gender) params.set("gender", gender)
    if (collection) params.set("collection", collection)
    if (sale) params.set("sale", "1")
    if (sort) params.set("sort", sort)
    params.set("page", String(p))
    return `/products?${params.toString()}`
  }

  return <main className="min-h-screen bg-cream">
    <section className="border-b border-border bg-[#eee9e1] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-secondary">NOORÉ / Collection</p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><h1 className="font-editorial text-4xl md:text-6xl">{title}</h1><p className="mt-3 max-w-lg text-sm text-secondary">{subtitle}</p></div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-secondary">{totalCount} {totalCount === 1 ? "piece" : "pieces"}</p>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
      <div className="mb-7 flex items-center justify-between gap-4 border-b border-border pb-5">
        <ProductFilters categories={categoryRows.map((x) => x.category)} genders={genderRows.flatMap((x) => x.gender ? [x.gender] : [])} collections={collectionRows.flatMap((x) => x.collection ? [x.collection] : [])} />
        <p className="hidden text-[10px] uppercase tracking-[0.14em] text-secondary md:block">Showing {products.length} of {totalCount}</p>
        <ProductSort currentSort={sort} />
      </div>

      {products.length === 0 ? <div className="py-24 text-center"><h2 className="font-editorial text-3xl">Nothing here yet.</h2><p className="mt-2 text-sm text-secondary">Try another category or clear your filters.</p><Link href="/products" className="mt-7 inline-block bg-charcoal px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Shop all</Link></div> : <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-14">
        {products.map((product) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} colors={product.variants.map((variant) => variant.color)} />)}
      </div>}

      {totalPages > 1 && <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <Link key={p} href={makePageUrl(p)} className={`grid h-9 w-9 place-items-center text-xs ${p === page ? "bg-charcoal text-white" : "border border-border hover:border-charcoal"}`}>{p}</Link>)}</nav>}
    </div>
  </main>
}
