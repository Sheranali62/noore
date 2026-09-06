"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/orders", "Orders"],
  ["/admin/couriers", "Couriers"],
  ["/admin/customers", "Customers"],
  ["/admin/coupons", "Coupons"],
  ["/admin/inventory", "Inventory"],
  ["/admin/homepage", "Homepage"],
  ["/admin/settings", "Settings"],
] as const

type AdminNavProps = {
  mobile?: boolean
}

export default function AdminNav({ mobile = false }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={
        mobile
          ? "flex flex-col gap-1.5"
          : "space-y-1"
      }
      aria-label="Admin navigation"
    >
      {items.map(([href, label]) => {
        const active =
          href === "/admin"
            ? pathname === href
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={[
              "group flex min-h-[44px] items-center rounded-xl px-3.5 py-3",
              "text-sm font-medium transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              mobile
                ? active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-white hover:bg-white/10 hover:text-white active:bg-white/15"
                : active
                  ? "bg-white/15 text-white"
                  : "text-white/85 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={
                mobile
                  ? active
                    ? "truncate"
                    : "truncate"
                  : "truncate"
              }
            >
              {label}
            </span>

            {mobile && active && (
              <span
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950"
                aria-hidden="true"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}