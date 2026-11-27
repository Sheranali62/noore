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
  ScrollText,
  CreditCard,
  Mail,
  LifeBuoy,
  WandSparkles,
} from "lucide-react"

const ADMIN = ["SUPER_ADMIN", "ADMIN"] as const
const PRODUCT = [...ADMIN, "PRODUCT_MANAGER"] as const
const ORDER = [...ADMIN, "ORDER_MANAGER"] as const
const CONTENT = [...ADMIN, "CONTENT_MANAGER"] as const

const items = [
  { href: "/admin", label: "Dashboard", icon: Home, roles: ADMIN },
  { href: "/studio", label: "Web Studio", icon: WandSparkles, roles: CONTENT },
  { href: "/admin/products", label: "Products", icon: Package, roles: PRODUCT },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, roles: PRODUCT },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, roles: ORDER },
  { href: "/admin/returns", label: "Returns & Exchanges", icon: RotateCcw, roles: ORDER },
  { href: "/admin/audit-logs", label: "Audit Log", icon: ScrollText, roles: ADMIN },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, roles: ADMIN },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, roles: ADMIN },
  { href: "/admin/support", label: "Support Centre", icon: LifeBuoy, roles: ORDER },
  { href: "/admin/couriers", label: "Couriers", icon: Truck, roles: ORDER },
  { href: "/admin/customers", label: "Customers", icon: Users, roles: ADMIN },
  { href: "/admin/coupons", label: "Coupons", icon: Gift, roles: ADMIN },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, roles: PRODUCT },
  { href: "/admin/homepage", label: "Homepage", icon: Image, roles: CONTENT },
  { href: "/admin/website-design", label: "Website Design", icon: Palette, roles: CONTENT },
  { href: "/admin/page-content", label: "Page Content", icon: FileText, roles: CONTENT },
  { href: "/admin/storefront-media", label: "Storefront Images", icon: Image, roles: CONTENT },
  { href: "/admin/analytics", label: "Reports", icon: BarChart3, roles: ADMIN },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ADMIN },
] as const

export default function AdminNav({ mobile = false, role = "CUSTOMER" }: { mobile?: boolean; role?: string }) {
  const pathname = usePathname()
  return (
    <nav className={mobile ? "flex flex-col gap-1.5" : "space-y-1.5"} aria-label="Admin navigation">
      {items.filter(item => (item.roles as readonly string[]).includes(role)).map(({ href, label, icon: Icon }) => {
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
