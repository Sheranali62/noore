"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/products", "Products"],
  ["/admin/inventory", "Inventory"],
  ["/admin/customers", "Customers"],
  ["/admin/reviews", "Reviews"],
  ["/admin/analytics", "Analytics"],
  ["/admin/coupons", "Coupons"],
  ["/admin/abandoned-carts", "Abandoned carts"],
  ["/admin/homepage", "Homepage"],
  ["/admin/settings", "Settings"],
] as const

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={mobile ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"} aria-label="Admin navigation">
      {items.map(([href, label]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} className={mobile ? `shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition ${active ? "bg-charcoal text-white" : "bg-cream text-charcoal hover:bg-charcoal/10"}` : `block rounded-xl px-3.5 py-2.5 text-sm transition ${active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
