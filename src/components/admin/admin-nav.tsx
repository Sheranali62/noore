"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/coupons", "Coupons"],
  ["/admin/inventory", "Inventory"],
  ["/admin/homepage", "Homepage"],
  ["/admin/settings", "Settings"],
] as const

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1" aria-label="Admin navigation">
      {items.map(([href, label]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`block rounded px-3 py-2.5 text-sm transition ${
              active ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
