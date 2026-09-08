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
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae72]/70",
              mobile
                ? active
                  ? "bg-[#d6ae72] text-[#211218] shadow-[0_8px_24px_rgba(214,174,114,0.18)]"
                  : "text-white/75 hover:bg-white/[0.07] hover:text-[#f7eee4] active:bg-white/[0.1]"
                : active
                  ? "bg-[#4a2038] text-[#f7eee4] shadow-[inset_3px_0_0_#d6ae72]"
                  : "text-white/72 hover:bg-white/[0.06] hover:text-[#f7eee4]",
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
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a2038]"
                aria-hidden="true"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}