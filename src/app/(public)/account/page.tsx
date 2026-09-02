import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function AccountPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!user) {
    redirect("/login")
  }

  const totalOrders = user.orders.length
  const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="font-editorial text-4xl font-semibold">My Account</h1>
          <span className="text-sm text-secondary">Welcome back, {user.name || "Customer"}!</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-cream">
            <p className="text-secondary text-sm">Total Orders</p>
            <p className="text-2xl font-semibold">{totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-cream">
            <p className="text-secondary text-sm">Total Spent</p>
            <p className="text-2xl font-semibold">PKR {totalSpent.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-cream">
            <p className="text-secondary text-sm">Member Since</p>
            <p className="text-lg font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-cream">
            <p className="text-secondary text-sm">Email</p>
            <p className="text-lg font-semibold truncate">{user.email}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/account/orders" className="bg-white p-6 rounded-lg border border-cream text-center hover:shadow-lg transition">
            <div className="text-3xl mb-2">📦</div>
            <p className="font-medium">My Orders</p>
          </Link>
          <Link href="/account/profile" className="bg-white p-6 rounded-lg border border-cream text-center hover:shadow-lg transition">
            <div className="text-3xl mb-2">👤</div>
            <p className="font-medium">Profile</p>
          </Link>
          <Link href="/wishlist" className="bg-white p-6 rounded-lg border border-cream text-center hover:shadow-lg transition">
            <div className="text-3xl mb-2">❤️</div>
            <p className="font-medium">Wishlist</p>
          </Link>
          <Link href="/account/addresses" className="bg-white p-6 rounded-lg border border-cream text-center hover:shadow-lg transition">
            <div className="text-3xl mb-2">📍</div>
            <p className="font-medium">Addresses</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-cream p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Orders</h2>
            <Link href="/account/orders" className="text-sm text-secondary hover:text-charcoal transition">
              View All →
            </Link>
          </div>

          {user.orders.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <p>You haven't placed any orders yet.</p>
              <Link href="/products" className="inline-block mt-4 text-charcoal font-medium hover:underline">
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {user.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-cream pb-4">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-sm text-secondary">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">PKR {order.total.toLocaleString()}</span>
                    <span className={`ml-3 px-2 py-1 rounded text-xs ${
                      order.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                      order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <Link href={`/account/orders/${order.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}