"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

type ProductFiltersProps = {
  categories: string[]
  currentCategory: string
}

export function ProductFilters({ categories, currentCategory }: ProductFiltersProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sort = searchParams?.get("sort") || "newest"

  const buildUrl = (category: string) => {
    const params = new URLSearchParams()
    if (category && category !== "all") {
      params.set("category", category)
    }
    if (sort) {
      params.set("sort", sort)
    }
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-secondary mb-3">Category</h3>
        <ul className="space-y-2">
          <li>
            <Link
              href={buildUrl("all")}
              className={`text-sm hover:text-charcoal transition ${
                !currentCategory || currentCategory === "all" ? "font-semibold text-charcoal" : "text-secondary"
              }`}
            >
              All
            </Link>
          </li>
          {categories.map((cat: string) => (
            <li key={cat}>
              <Link
                href={buildUrl(cat)}
                className={`text-sm hover:text-charcoal transition ${
                  currentCategory === cat ? "font-semibold text-charcoal" : "text-secondary"
                }`}
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}