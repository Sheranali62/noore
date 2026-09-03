"use client"

import { SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

type ProductFiltersProps = {
  categories: string[]
  genders: string[]
  collections: string[]
}

export function ProductFilters({ categories, genders, collections }: ProductFiltersProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const current = (key: string) => searchParams?.get(key) || ""
  const buildUrl = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    Object.entries(changes).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key))
    params.delete("page")
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const content = (
    <div className="space-y-7">
      <FilterGroup title="Category" values={categories} active={current("category")} href={(value) => buildUrl({ category: value })} />
      {genders.length > 0 && <FilterGroup title="For" values={genders} active={current("gender")} href={(value) => buildUrl({ gender: value })} />}
      {collections.length > 0 && <FilterGroup title="Collection" values={collections} active={current("collection")} href={(value) => buildUrl({ collection: value })} />}
      <div>
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">Availability</p>
        <Link href={buildUrl({ sale: current("sale") === "1" ? "" : "1" })} className={`text-xs transition ${current("sale") === "1" ? "font-semibold text-charcoal" : "text-secondary hover:text-charcoal"}`}>
          {current("sale") === "1" ? "✓ On Sale" : "On Sale"}
        </Link>
      </div>
      <Link href={pathname} className="inline-flex text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary underline underline-offset-4 hover:text-charcoal">Clear all</Link>
    </div>
  )

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 border border-border bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] md:hidden">
        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
      </button>
      <aside className="hidden md:block">{content}</aside>
      {open && <div className="fixed inset-0 z-50 md:hidden">
        <button aria-label="Close filters" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-cream p-6 shadow-2xl">
          <div className="mb-8 flex items-center justify-between"><p className="font-editorial text-2xl">Filters</p><button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
          {content}
        </div>
      </div>}
    </>
  )
}

function FilterGroup({ title, values, active, href }: { title: string; values: string[]; active: string; href: (value: string) => string }) {
  return <div><p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">{title}</p><div className="space-y-2">{values.map((value) => <Link key={value} href={href(value)} className={`block text-xs transition ${active === value ? "font-semibold text-charcoal" : "text-secondary hover:text-charcoal"}`}>{value}</Link>)}</div></div>
}
