import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { Search } from "lucide-react"

export const dynamic = "force-dynamic"
type Props = { searchParams?: Record<string, string | string[] | undefined> }
const value = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] || "" : v || ""

export default async function SearchPage({ searchParams }: Props) {
  const q = value(searchParams?.q).trim()
  const category = value(searchParams?.category)
  const gender = value(searchParams?.gender)
  const color = value(searchParams?.color)
  const size = value(searchParams?.size)
  const sale = value(searchParams?.sale) === "1"
  const inStock = value(searchParams?.inStock) === "1"
  const min = Number(value(searchParams?.min))
  const max = Number(value(searchParams?.max))
  const sort = value(searchParams?.sort) || "newest"
  const page = Math.max(1, Number(value(searchParams?.page) || 1))

  const tokens = q.toLowerCase().replace(/,/g, " ").split(/\s+/).filter(Boolean)
  const sizes = ["xs","s","m","l","xl","xxl","2xl","3xl","4xl","small","medium","large"]
  const colors = ["black","white","ivory","cream","beige","brown","blue","navy","green","olive","pink","red","maroon","purple","grey","gray","gold","silver","mustard","peach","teal"]
  const ignored = new Set(["sale","discount","under","below","less","than","over","above","more","between","and","rs","pkr","price","in","stock","available","men","mens","male","women","womens","female",...sizes,...colors])
  const detectedColor = color || tokens.find(t => colors.includes(t)) || ""
  const detectedSize = size || tokens.find(t => sizes.includes(t)) || ""
  const detectedGender = gender || (tokens.some(t => ["men","mens","male"].includes(t)) ? "Men" : tokens.some(t => ["women","womens","female"].includes(t)) ? "Women" : "")
  const detectedSale = sale || tokens.some(t => ["sale","discount"].includes(t))
  const detectedStock = inStock || tokens.some(t => ["stock","available"].includes(t))
  const under = q.toLowerCase().match(/(?:under|below|less than)\s*(?:pkr|rs)?\s*([\d,]+)/)
  const over = q.toLowerCase().match(/(?:over|above|more than)\s*(?:pkr|rs)?\s*([\d,]+)/)
  const between = q.toLowerCase().match(/between\s*(?:pkr|rs)?\s*([\d,]+)\s*(?:and|-)\s*(?:pkr|rs)?\s*([\d,]+)/)
  const parsedMin = Number.isFinite(min) ? min : between ? Number(between[1].replace(/,/g,"")) : over ? Number(over[1].replace(/,/g,"")) : NaN
  const parsedMax = Number.isFinite(max) ? max : between ? Number(between[2].replace(/,/g,"")) : under ? Number(under[1].replace(/,/g,"")) : NaN
  const textTokens = tokens.filter(token => !ignored.has(token) && !/^\d[\d,]*$/.test(token))

  const where: any = { status: "ACTIVE" }
  if (textTokens.length) where.AND = textTokens.map(token => ({ OR: [
    { name: { contains: token, mode: "insensitive" } }, { sku: { contains: token, mode: "insensitive" } },
    { category: { contains: token, mode: "insensitive" } }, { subcategory: { contains: token, mode: "insensitive" } },
    { collection: { contains: token, mode: "insensitive" } }, { fabric: { contains: token, mode: "insensitive" } }, { type: { contains: token, mode: "insensitive" } }, { tags: { has: token } },
  ] }))
  if (category) where.category = category
  if (detectedGender) where.gender = { equals: detectedGender, mode: "insensitive" }
  if (detectedColor || detectedSize) where.variants = { some: { ...(detectedColor ? { color: { equals: detectedColor, mode: "insensitive" } } : {}), ...(detectedSize ? { size: { equals: detectedSize, mode: "insensitive" } } : {}) } }
  if (detectedSale) where.salePrice = { not: null }
  if (detectedStock) where.stock = { gt: 0 }
  if (Number.isFinite(parsedMin) || Number.isFinite(parsedMax)) where.price = { ...(Number.isFinite(parsedMin) ? { gte: parsedMin } : {}), ...(Number.isFinite(parsedMax) ? { lte: parsedMax } : {}) }

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price-low") orderBy = { price: "asc" }
  if (sort === "price-high") orderBy = { price: "desc" }
  if (sort === "popular") orderBy = { orderItems: { _count: "desc" } }
  if (sort === "rating") orderBy = { reviews: { _count: "desc" } }

  const take = 24
  const [total, products, categories, genders, collections] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * take, take, include: { variants: { select: { color: true, size: true } } } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", gender: { not: null } }, select: { gender: true }, distinct: ["gender"], orderBy: { gender: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", collection: { not: null } }, select: { collection: true }, distinct: ["collection"], orderBy: { collection: "asc" } }),
  ])
  const facetColors = Array.from(new Set(products.flatMap(p => p.variants.map(v => v.color)))).sort().slice(0, 24)
  const facetSizes = Array.from(new Set(products.flatMap(p => p.variants.map(v => v.size)))).sort()
  const pages = Math.ceil(total / take)
  const href = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const current: Record<string, string> = { q, category, gender, color, size, sale: sale ? "1" : "", inStock: inStock ? "1" : "", min: Number.isFinite(min) ? String(min) : "", max: Number.isFinite(max) ? String(max) : "", sort }
    Object.assign(current, changes)
    Object.entries(current).forEach(([k, v]) => { if (v) params.set(k, v) })
    return `/search?${params.toString()}`
  }

  return <main className="min-h-screen bg-cream py-10 md:py-14"><div className="mx-auto max-w-7xl px-4">
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-secondary">NOORÉ / Smart Search</p><h1 className="mt-2 font-editorial text-4xl md:text-5xl">{q ? <>Results for “{q}”</> : "Discover the Collection"}</h1><p className="mt-2 text-sm text-secondary">{total} {total === 1 ? "piece" : "pieces"} found</p></div><Link href="/products" className="text-[10px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4">Shop all</Link></div>
    <form className="mb-8 flex gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm"><div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="h-4 w-4 shrink-0 text-secondary"/><input name="q" defaultValue={q} placeholder="Try ‘black cotton under 5000’ or ‘women blue’" className="w-full bg-transparent py-3 text-sm outline-none"/></div><button className="bg-charcoal px-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Search</button></form>
    {(detectedColor || detectedSize || detectedGender || detectedSale || Number.isFinite(parsedMin) || Number.isFinite(parsedMax)) && <div className="mb-7 flex flex-wrap items-center gap-2"><span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-secondary">Smart filters</span>{[detectedGender, detectedColor, detectedSize, detectedSale ? "Sale" : "", Number.isFinite(parsedMin) || Number.isFinite(parsedMax) ? `PKR ${Number.isFinite(parsedMin) ? parsedMin.toLocaleString() : "0"}–${Number.isFinite(parsedMax) ? parsedMax.toLocaleString() : "∞"}` : ""].filter(Boolean).map(v => <span key={v} className="rounded-full border border-border bg-white px-3 py-1.5 text-[10px]">{v}</span>)}</div>}
    <div className="grid gap-8 lg:grid-cols-[210px_1fr]">
      <aside className="space-y-7 border-b border-border pb-6 lg:border-b-0 lg:pb-0">
        <Filter title="Category" values={categories.map(x => x.category)} active={category} make={v => href({ category: v })}/>
        <Filter title="For" values={genders.flatMap(x => x.gender ? [x.gender] : [])} active={gender} make={v => href({ gender: v })}/>
        {facetColors.length > 0 && <Filter title="Color" values={facetColors} active={color} make={v => href({ color: v })}/>} 
        {facetSizes.length > 0 && <Filter title="Size" values={facetSizes} active={size} make={v => href({ size: v })}/>} 
        <div><p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">Availability</p><div className="space-y-2 text-xs"><Link href={href({ sale: sale ? undefined : "1" })} className="block">{sale ? "✓ Sale" : "Sale"}</Link><Link href={href({ inStock: inStock ? undefined : "1" })} className="block">{inStock ? "✓ In stock" : "In stock"}</Link></div></div>
        <form method="get"><input type="hidden" name="q" value={q}/>{category && <input type="hidden" name="category" value={category}/>} {gender && <input type="hidden" name="gender" value={gender}/>} {color && <input type="hidden" name="color" value={color}/>} {size && <input type="hidden" name="size" value={size}/>} {sale && <input type="hidden" name="sale" value="1"/>} {inStock && <input type="hidden" name="inStock" value="1"/>}<p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">Price</p><div className="flex gap-2"><input name="min" defaultValue={Number.isFinite(parsedMin) ? parsedMin : ""} placeholder="Min" className="w-full border border-border bg-white px-2 py-2 text-xs"/><input name="max" defaultValue={Number.isFinite(parsedMax) ? parsedMax : ""} placeholder="Max" className="w-full border border-border bg-white px-2 py-2 text-xs"/></div><button className="mt-2 w-full border border-border bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.15em]">Apply price</button></form>
        <Link href="/search" className="text-[9px] font-semibold uppercase tracking-[0.18em] text-secondary underline underline-offset-4">Clear all</Link>
      </aside>
      <section>
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4"><p className="text-[10px] uppercase tracking-[0.14em] text-secondary">Showing {products.length} of {total}</p><form><input type="hidden" name="q" value={q}/>{category && <input type="hidden" name="category" value={category}/>} {gender && <input type="hidden" name="gender" value={gender}/>} {color && <input type="hidden" name="color" value={color}/>} {size && <input type="hidden" name="size" value={size}/>} {sale && <input type="hidden" name="sale" value="1"/>} {inStock && <input type="hidden" name="inStock" value="1"/>} {Number.isFinite(parsedMin) && <input type="hidden" name="min" value={parsedMin}/>} {Number.isFinite(parsedMax) && <input type="hidden" name="max" value={parsedMax}/>}<select name="sort" defaultValue={sort} onChange={(e) => e.currentTarget.form?.submit()} className="border border-border bg-white px-3 py-2 text-[10px] uppercase tracking-[0.12em] outline-none"><option value="newest">Newest</option><option value="popular">Popular</option><option value="rating">Top rated</option><option value="price-low">Price low</option><option value="price-high">Price high</option></select></form></div>
        {products.length === 0 ? <div className="border border-border bg-white px-6 py-20 text-center"><h2 className="font-editorial text-3xl">Nothing matched</h2><p className="mt-2 text-sm text-secondary">Try fewer words, another color, or a wider price range.</p><Link href="/products" className="mt-7 inline-block bg-charcoal px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Shop all</Link></div> : <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-14">{products.map(p => <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price} salePrice={p.salePrice} image={p.images[0] || "/placeholder.jpg"} hoverImage={p.images[1]} category={p.category} stock={p.stock} colors={p.variants.map(v => v.color)}/>)}</div>}
        {pages > 1 && <nav className="mt-12 flex justify-center gap-2">{Array.from({length: pages}, (_, i) => i + 1).map(p => <Link key={p} href={href({ page: p > 1 ? String(p) : undefined })} className={`grid h-9 w-9 place-items-center text-xs ${p === page ? "bg-charcoal text-white" : "border border-border bg-white"}`}>{p}</Link>)}</nav>}
      </section>
    </div>
  </div></main>
}

function Filter({ title, values, active, make }: { title: string; values: string[]; active: string; make: (v: string) => string }) {
  return <div><p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">{title}</p><div className="space-y-2">{values.map(v => <Link key={v} href={make(v)} className={`block text-xs ${active.toLowerCase() === v.toLowerCase() ? "font-semibold" : "text-secondary hover:text-charcoal"}`}>{active.toLowerCase() === v.toLowerCase() ? "✓ " : ""}{v}</Link>)}</div></div>
}
