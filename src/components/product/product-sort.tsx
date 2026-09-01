"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

type ProductSortProps = {
  currentSort: string
}

export function ProductSort({ currentSort }: ProductSortProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("sort", e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      defaultValue={currentSort}
      onChange={handleSortChange}
      className="border border-cream rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-charcoal"
    >
      <option value="newest">Newest</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
      <option value="best-selling">Best Selling</option>
    </select>
  )
}