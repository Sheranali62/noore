import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function AdminPage() {
  // Temporarily disabled auth for testing
  // const session = await auth()
  // if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
  //   redirect("/login")
  // }

  const [
    totalOrders,
    totalProducts,
    totalCustomers,
    pendingOrders,
    totalRevenue
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { status: "DELIVERED" },
      _sum: { total: true }
    })
  ])

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-cream">
          <p className="text-secondary text-sm">Total Orders</p>
          <p className="text-2xl font-semibold">{totalOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-cream">
          <p className="text-secondary text-sm">Active Products</p>
          <p className="text-2xl font-semibold">{totalProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-cream">
          <p className="text-secondary text-sm">Customers</p>
          <p className="text-2xl font-semibold">{totalCustomers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-cream">
          <p className="text-secondary text-sm">Pending Orders</p>
          <p className="text-2xl font-semibold">{pendingOrders}</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-cream">
        <p className="text-secondary text-sm">Total Revenue</p>
        <p className="text-3xl font-semibold">PKR {(totalRevenue._sum.total || 0).toLocaleString()}</p>
      </div>
    </div>
  )
}