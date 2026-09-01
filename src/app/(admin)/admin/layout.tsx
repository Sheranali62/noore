import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-charcoal text-white p-6 min-h-screen sticky top-0">
        <div className="font-editorial text-2xl mb-8">NOORÉ Admin</div>
        <nav className="space-y-2">
          <Link href="/admin" className="block py-2 px-3 hover:bg-white/10 rounded">Dashboard</Link>
          <Link href="/admin/products" className="block py-2 px-3 hover:bg-white/10 rounded">Products</Link>
          <Link href="/admin/orders" className="block py-2 px-3 hover:bg-white/10 rounded">Orders</Link>
          <Link href="/admin/customers" className="block py-2 px-3 hover:bg-white/10 rounded">Customers</Link>
          <Link href="/admin/coupons" className="block py-2 px-3 hover:bg-white/10 rounded">Coupons</Link>
          <Link href="/admin/inventory" className="block py-2 px-3 hover:bg-white/10 rounded">Inventory</Link>
          <Link href="/admin/homepage" className="block py-2 px-3 hover:bg-white/10 rounded">Homepage</Link>
          <Link href="/admin/settings" className="block py-2 px-3 hover:bg-white/10 rounded">Settings</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}