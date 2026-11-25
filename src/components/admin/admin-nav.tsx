"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FolderTree,
  FileText,
  Gift,
  Home,
  Image,
  Palette,
  Package,
  Settings,
  Truck,
  Users,
  RotateCcw,
} from "lucide-react"

const items = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/returns", label: "Returns & Exchanges", icon: RotateCcw },
  { href: "/admin/couriers", label: "Couriers", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Gift },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/homepage", label: "Homepage", icon: Image },
  { href: "/admin/website-design", label: "Website Design", icon: Palette },
  { href: "/admin/page-content", label: "Page Content", icon: FileText },
  { href: "/admin/storefront-media", label: "Storefront Images", icon: Image },
  { href: "/admin/analytics", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  return (
    <nav className={mobile ? "flex flex-col gap-1.5" : "space-y-1.5"} aria-label="Admin navigation">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={[
              "group flex min-h-[45px] items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c28e]/70",
              active
                ? "bg-gradient-to-r from-[#e6c47f] to-[#c2944e] text-[#17110a] shadow-[0_5px_20px_rgba(214,174,114,.16)]"
                : "text-white/75 hover:bg-white/[0.07] hover:text-white",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#17110a]" : "text-[#d6ae72]/80 group-hover:text-[#e4c28e]"}`} />
            <span className="truncate">{label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#17110a]" />}
          </Link>
        )
      })}
    </nav>
  )
}
