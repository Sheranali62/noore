"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Search, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"

type Product = {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  category: string
  gender: string | null
  collection: string | null
  stock: number
  variants: { color: string; size: string; stock: number }[]
}

type Facets = { categories: string[]; genders: string[]; collections: string[]; colors: string[]; sizes: string[] }

const quickLinks = [
  ["New In", "/new-in"],
  ["Women", "/women"],
  ["Men", "/men"],
  ["Kids", "/kids"],
  ["Sale", "/sale"],
  ["Luxury", "/products?category=Luxury"],
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [input, setInput] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [facets, setFacets] = useState<Facets>({ categories: [], genders: [], collections: [], colors: [], sizes: [] })
  const [detected, setDetected] = useState<Record<string, string | boolean | number>>({})
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState("newest")
  const [gender, setGender] = useState("")
  const [category, setCategory] = useState("")
  const [collection, setCollection] = useState("")
  const [sale, setSale] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initial = params.get("q") || ""
    setQuery(initial)
    setInput(initial)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query, take: "24", page: String(page), sort })
        if (gender) params.set("gender", gender)
        if (category) params.set("category", category)
        if (collection) params.set("collection", collection)
        if (sale) params.set("sale", "true")
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        const data = await response.json()
        setProducts(Array.isArray(data.products) ? data.products : [])
        setFacets(data.facets || { categories: [], genders: [], collections: [], colors: [], sizes: [] })
        setDetected(data.detectedFilters || {})
        setTotal(Number(data.total || 0))
        setPages(Number(data.pages || 1))
      } catch (error) {
        if ((error as Error).name !== "AbortError") setProducts([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 120)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query, gender, category, collection, sale, sort, page])

  const detectedLabels = useMemo(() => Object.entries(detected).filter(([, value]) => value !== false && value !== undefined), [detected])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = input.trim()
    setQuery(value)
    setPage(1)
    const params = new URLSearchParams()
    if (value) params.set("q", value)
    window.history.replaceState(null, "", `/search${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const clearFilters = () => {
    setGender("")
    setCategory("")
    setCollection("")
    setSale(false)
    setPage(1)
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <section className="border-b border-border bg-[#eee9e1] px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">NOORÉ / Discovery</p>
          <h1 className="mt-3 font-editorial text-5xl md:text-7xl">Find your next piece.</h1>
          <form onSubmit={submit} className="mt-8 flex max-w-3xl items-center gap-3 border border-black/15 bg-white px-4 py-2">
            <Search className="h-5 w-5 shrink-0 text-secondary" />
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try “black cotton under 5000”" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" aria-label="Search NOORÉ" />
            {input && <button type="button" onClick={() => { setInput(""); setQuery("") }} className="p-2 text-secondary hover:text-charcoal" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            <button className="bg-charcoal px-5 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white">Search</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {quickLinks.map(([label, href]) => <Link key={label} href={href} className="border border-black/10 bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[.15em] hover:border-charcoal">{label}</Link>)}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-5 md:py-12">
        {query && detectedLabels.length > 0 && (
          <div className="mb-7 flex flex-wrap items-center gap-2 border-b border-border pb-6">
            <div className="mr-1 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-secondary"><Sparkles className="h-3.5 w-3.5" /> Smart match</div>
            {detectedLabels.map(([key, value]) => <span key={key} className="border border-black/10 bg-white px-3 py-2 text-[9px] uppercase tracking-[.12em]">{key}: {String(value)}</span>)}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="mr-1 h-4 w-4 text-secondary" />
            <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1) }} className="border border-border bg-transparent px-3 py-2 text-[10px] uppercase tracking-[.12em]"><option value="">All genders</option>{facets.genders.map((x) => <option key={x}>{x}</option>)}</select>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className="border border-border bg-transparent px-3 py-2 text-[10px] uppercase tracking-[.12em]"><option value="">All categories</option>{facets.categories.map((x) => <option key={x}>{x}</option>)}</select>
            <select value={collection} onChange={(e) => { setCollection(e.target.value); setPage(1) }} className="border border-border bg-transparent px-3 py-2 text-[10px] uppercase tracking-[.12em]"><option value="">All collections</option>{facets.collections.map((x) => <option key={x}>{x}</option>)}</select>
            <button type="button" onClick={() => { setSale(v => !v); setPage(1) }} className={`border px-3 py-2 text-[10px] uppercase tracking-[.12em] ${sale ? "border-charcoal bg-charcoal text-white" : "border-border"}`}>Sale</button>
            {(gender || category || collection || sale) && <button type="button" onClick={clearFilters} className="px-2 py-2 text-[10px] uppercase tracking-[.12em] underline underline-offset-4">Clear</button>}
          </div>
          <div className="flex items-center gap-4"><span className="text-[10px] uppercase tracking-[.14em] text-secondary">{total} {total === 1 ? "piece" : "pieces"}</span><select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} className="border border-border bg-transparent px-3 py-2 text-[10px] uppercase tracking-[.12em]"><option value="newest">Newest</option><option value="popular">Most loved</option><option value="rating">Top reviewed</option><option value="price-low">Price low</option><option value="price-high">Price high</option></select></div>
        </div>

        {loading ? <div className="py-24 text-center text-sm text-secondary">Curating your results…</div> : products.length === 0 ? <div className="py-24 text-center"><p className="eyebrow">No match</p><h2 className="mt-3 font-editorial text-4xl">Nothing found yet.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">Try a broader phrase, a different fabric or color, or explore one of the edits above.</p><Link href="/products" className="mt-7 inline-flex items-center gap-2 bg-charcoal px-7 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white">Shop all <ArrowUpRight className="h-3.5 w-3.5" /></Link></div> : <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-14">
            {products.map((product) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} category={product.category} stock={product.stock} gender={product.gender} colors={Array.from(new Set(product.variants.map((v) => v.color)))} />)}
          </div>
          {pages > 1 && <nav className="mt-14 flex justify-center gap-2" aria-label="Search pagination">{Array.from({ length: pages }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => setPage(p)} className={`grid h-9 w-9 place-items-center text-xs ${page === p ? "bg-charcoal text-white" : "border border-border hover:border-charcoal"}`}>{p}</button>)}</nav>}
        </>}
      </div>
    </main>
  )
}
