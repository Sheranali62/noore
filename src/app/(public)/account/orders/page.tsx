import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function OrdersPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="text-secondary hover:text-charcoal transition">
            ← Back to Account
          </Link>
          <h1 className="font-editorial text-4xl font-semibold">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-cream p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="font-editorial text-2xl font-semibold">No Orders Yet</h2>
            <p className="text-secondary mt-2">Start shopping to see your orders here.</p>
            <Link href="/products" className="inline-block mt-6 bg-charcoal text-white px-6 py-3 rounded-md hover:bg-charcoal/80 transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-cream p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-lg">Order #{order.orderNumber}</p>
                    <p className="text-sm text-secondary">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-secondary mt-1">
                      {order.items.length} item{order.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">PKR {order.total.toLocaleString()}</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm ${
                      order.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                      order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                      order.status === "SHIPPED" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 pt-4 border-t border-cream"></div>