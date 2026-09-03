"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function ProductSort({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("sort", value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }
  return <select value={currentSort} onChange={(e) => handleChange(e.target.value)} className="border-0 border-b border-border bg-transparent px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] focus:outline-none">
    <option value="newest">Newest</option><option value="popular">Popular</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option>
  </select>
}
