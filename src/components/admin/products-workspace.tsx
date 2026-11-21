"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
  Eye,
  Grid2X2,
  List,
  Package,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

export type AdminProduct = {
  id: string
  name: string
  slug: string
  sku: string
  category: string
  subcategory: string | null
  price: number
  salePrice: number | null
  stock: number
  lowStock: number
  status: string
  images: string[]
  variants: { id: string; color: string; size: string; stock: number }[]
  createdAt: string
}

type StockFilter = "all" | "in" | "low" | "out"

const money = (value: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value)

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    DRAFT: "border-white/10 bg-white/[0.06] text-white/55",
    ARCHIVED: "border-white/10 bg-white/[0.04] text-white/35",
    OUT_OF_STOCK: "border-red-400/20 bg-red-400/10 text-red-300",
  }
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${styles[status] || "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
      {status.replaceAll("_", " ")}
    </span>
  )
}

export default function ProductsWorkspace({ products }: { products: AdminProduct[] }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<AdminProduct | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    [products],
  )

  const counts = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.status === "ACTIVE").length,
    inStock: products.filter((product) => product.stock > 0).length,
    low: products.filter((product) => product.stock > 0 && product.stock <= product.lowStock).length,
    out: products.filter((product) => product.stock === 0).length,
    categories: categories.length,
  }), [products, categories])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesSearch = !term || [product.name, product.sku, product.category, product.subcategory || ""]
        .some((value) => value.toLowerCase().includes(term))
      const matchesCategory = category === "all" || product.category === category
      const matchesStatus = status === "all" || product.status === status
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && product.stock > product.lowStock) ||
        (stockFilter === "low" && product.stock > 0 && product.stock <= product.lowStock) ||
        (stockFilter === "out" && product.stock === 0)
      return matchesSearch && matchesCategory && matchesStatus && matchesStock
    })
  }, [products, search, category, status, stockFilter])

  function exportProducts() {
    const headers = ["Name", "SKU", "Category", "Subcategory", "Price", "Sale Price", "Stock", "Status"]
    const rows = filtered.map((product) => [
      product.name, product.sku, product.category, product.subcategory || "",
      product.price, product.salePrice ?? "", product.stock, product.status,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n")
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "noore-products.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setSearch("")
    setCategory("all")
    setStatus("all")
    setStockFilter("all")
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d6ae72]/20 bg-gradient-to-br from-[#d6ae72]/[0.12] via-white/[0.035] to-transparent p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#d6ae72]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#d6ae72]/70">
              <Package className="h-4 w-4" /> Catalog studio
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Products <span className="text-[#d6ae72]">Management</span></h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Manage your NOORÉ collection, product information, pricing and inventory from one workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportProducts} className="inline-flex items-center gap-2 rounded-full border border-[#d6ae72]/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e8c98e] transition hover:bg-[#d6ae72]/10">
              <ArrowDownToLine className="h-4 w-4" /> Export CSV
            </button>
            <Link href="/admin/products/add" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#17110a] shadow-lg shadow-[#d6ae72]/10 transition hover:brightness-110">
              <Plus className="h-4 w-4" /> Add Product
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total products" value={counts.total} detail="Products in catalog" icon={<Package className="h-5 w-5" />} />
        <StatCard label="Active products" value={counts.active} detail="Published in your store" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Low stock" value={counts.low} detail={`${counts.out} currently out of stock`} icon={<AlertTriangle className="h-5 w-5" />} warning />
        <StatCard label="Categories" value={counts.categories} detail={`${counts.inStock} products with stock`} icon={<Tag className="h-5 w-5" />} />
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU or category..." className="h-11 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d6ae72]/50" />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#171715] px-3 text-sm text-white/80 outline-none focus:border-[#d6ae72]/50">
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#171715] px-3 text-sm text-white/80 outline-none focus:border-[#d6ae72]/50">
            <option value="all">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)} className="h-11 rounded-xl border border-white/10 bg-[#171715] px-3 text-sm text-white/80 outline-none focus:border-[#d6ae72]/50">
            <option value="all">All stock levels</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-1">
            <span className="pl-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/35">View</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`grid h-9 w-9 place-items-center rounded-lg transition ${view === "grid" ? "bg-[#d6ae72] text-black" : "text-white/45 hover:bg-white/10"}`}><Grid2X2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`grid h-9 w-9 place-items-center rounded-lg transition ${view === "list" ? "bg-[#d6ae72] text-black" : "text-white/45 hover:bg-white/10"}`}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "in", "low", "out"] as StockFilter[]).map((filter) => (
              <button key={filter} type="button" onClick={() => setStockFilter(filter)} className={`rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] transition ${stockFilter === filter ? "bg-[#d6ae72] text-black" : "border border-white/10 text-white/45 hover:border-white/25 hover:text-white"}`}>
                {filter === "all" ? `All (${counts.total})` : filter === "in" ? `In stock (${counts.inStock})` : filter === "low" ? `Low (${counts.low})` : `Out (${counts.out})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/35">Showing <strong className="text-white/75">{filtered.length}</strong> of {products.length}</span>
            {(search || category !== "all" || status !== "all" || stockFilter !== "all") && <button type="button" onClick={resetFilters} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e8c98e] hover:text-white">Clear filters</button>}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] px-6 py-16 text-center">
          <Boxes className="mx-auto h-9 w-9 text-white/25" />
          <h2 className="mt-4 text-lg font-medium">No products found</h2>
          <p className="mt-2 text-sm text-white/40">Try changing your search or filters.</p>
          <button type="button" onClick={resetFilters} className="mt-5 rounded-full border border-[#d6ae72]/35 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e8c98e]">Clear filters</button>
        </section>
      ) : view === "grid" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((product) => <ProductCard key={product.id} product={product} onView={() => setSelected(product)} />)}
        </section>
      ) : (
        <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-white/[0.045] text-[9px] uppercase tracking-[0.17em] text-white/35">
                <tr>{["Product", "Category", "Price", "Variants", "Stock", "Status", "Actions"].map((label) => <th key={label} className="px-5 py-4 font-semibold">{label}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-t border-white/[0.07] transition hover:bg-white/[0.025]">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><ProductThumb product={product} /><div><p className="text-sm font-medium text-white">{product.name}</p><p className="mt-1 text-[10px] text-white/35">{product.sku}</p></div></div></td>
                    <td className="px-5 py-3 text-xs text-white/65">{product.category}<p className="mt-1 text-[10px] text-white/30">{product.subcategory || "—"}</p></td>
                    <td className="px-5 py-3 text-xs text-white/75">{money(product.salePrice ?? product.price)}{product.salePrice !== null && <p className="mt-1 text-[10px] text-white/30 line-through">{money(product.price)}</p>}</td>
                    <td className="px-5 py-3 text-xs text-white/65">{product.variants.length}</td>
                    <td className="px-5 py-3"><StockLabel product={product} /></td>
                    <td className="px-5 py-3"><StatusPill status={product.status} /></td>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><button type="button" onClick={() => setSelected(product)} className="text-xs text-[#e8c98e] hover:text-white">View</button><Link href={`/admin/products/edit/${product.id}`} className="text-xs text-white/65 hover:text-white">Edit</Link><DeleteProductButton id={product.id} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && <QuickView product={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function StatCard({ label, value, detail, icon, warning = false }: { label: string; value: number; detail: string; icon: React.ReactNode; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-5">
      <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</span><span className={`grid h-10 w-10 place-items-center rounded-xl border ${warning ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-[#d6ae72]/20 bg-[#d6ae72]/10 text-[#e8c98e]"}`}>{icon}</span></div>
      <p className="mt-4 text-3xl font-medium tracking-tight">{value.toLocaleString()}</p>
      <p className="mt-1 text-[10px] text-white/35">{detail}</p>
    </div>
  )
}

function ProductThumb({ product }: { product: AdminProduct }) {
  return (
    <div className="grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
      {product.images[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-white/20" />}
    </div>
  )
}

function StockLabel({ product }: { product: AdminProduct }) {
  const out = product.stock === 0
  const low = !out && product.stock <= product.lowStock
  return <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${out ? "text-red-300" : low ? "text-amber-300" : "text-emerald-300"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{product.stock} {out ? "out" : low ? "low" : "in stock"}</span>
}

function ProductCard({ product, onView }: { product: AdminProduct; onView: () => void }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.02] transition hover:-translate-y-0.5 hover:border-[#d6ae72]/30 hover:shadow-xl hover:shadow-black/20">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#171715]">
        {product.images[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center"><Package className="h-10 w-10 text-white/15" /></div>}
        <div className="absolute left-3 top-3"><StatusPill status={product.status} /></div>
        <div className="absolute bottom-3 right-3 rounded-full border border-black/10 bg-black/70 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">{product.stock} in stock</div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{product.name}</p><p className="mt-1 text-[10px] text-white/35">SKU: {product.sku}</p></div>
          <div className="shrink-0 text-right"><p className="text-sm font-semibold text-[#e8c98e]">{money(product.salePrice ?? product.price)}</p>{product.salePrice !== null && <p className="text-[10px] text-white/30 line-through">{money(product.price)}</p>}</div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[10px] text-white/40"><span>{product.category}{product.subcategory ? ` · ${product.subcategory}` : ""}</span><span>{product.variants.length} variants</span></div>
        <div className="mt-4 flex items-center gap-2">
          <Link href={`/admin/products/edit/${product.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d6ae72]/35 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#e8c98e] transition hover:bg-[#d6ae72] hover:text-black">Edit</Link>
          <button type="button" onClick={onView} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/65 transition hover:bg-white hover:text-black"><Eye className="h-3.5 w-3.5" /> View</button>
          <div className="rounded-full border border-red-400/15 px-3 py-2 text-[9px] text-red-300"><DeleteProductButton id={product.id} /></div>
        </div>
      </div>
    </article>
  )
}

function QuickView({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-quick-view-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] border border-[#d6ae72]/25 bg-[#111110] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d6ae72]/65">Product details</p><h2 id="product-quick-view-title" className="mt-1 text-lg font-medium">{product.name}</h2></div><button type="button" onClick={onClose} aria-label="Close product details" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-5 p-5 sm:grid-cols-[150px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-white/[0.04]">{product.images[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Package className="h-8 w-8 text-white/20" /></div>}</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-white/40">Status</span><StatusPill status={product.status} /></div>
            <Detail label="SKU" value={product.sku} />
            <Detail label="Category" value={product.category} />
            <Detail label="Subcategory" value={product.subcategory || "—"} />
            <Detail label="Regular price" value={money(product.price)} />
            <Detail label="Sale price" value={product.salePrice === null ? "—" : money(product.salePrice)} />
            <Detail label="Available stock" value={String(product.stock)} />
            <Detail label="Variants" value={String(product.variants.length)} />
          </div>
        </div>
        {product.variants.length > 0 && <div className="border-t border-white/10 px-5 py-4"><h3 className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Sizes & colours</h3><div className="mt-3 flex flex-wrap gap-2">{product.variants.map((variant) => <span key={variant.id} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/65">{variant.color} · {variant.size} · {variant.stock} pcs</span>)}</div></div>}
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4"><button type="button" onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">Close</button><Link href={`/admin/products/edit/${product.id}`} className="rounded-full bg-[#d6ae72] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-black">Edit product</Link></div>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-2"><span className="text-xs text-white/40">{label}</span><span className="text-right text-xs font-medium text-white/80">{value}</span></div>
}
