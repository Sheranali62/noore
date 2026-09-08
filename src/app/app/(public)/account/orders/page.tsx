import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const statusClass = (status: string) => {
  if (status === "DELIVERED") return "bg-green-100 text-green-800"
  if (status === "CANCELLED" || status === "REFUNDED") return "bg-red-100 text-red-800"
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "bg-blue-100 text-blue-800"
  return "bg-amber-100 text-amber-800"
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders")

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true, variant: true } } },
  })

  return (
    <div className="min-h-screen bg-cream py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/account" className="text-sm text-secondary hover:text-charcoal">← Back to account</Link>

        <div className="mt-6 flex flex-wrap justify-between items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-secondary">Your purchases</p>
            <h1 className="font-editorial text-4xl md:text-5xl mt-2">My orders</h1>
            <p className="text-secondary mt-2">Every NOORÉ purchase, from confirmation to delivery.</p>
          </div>
          <Link href="/order-tracking" className="border border-cream bg-white rounded-xl px-4 py-2.5 text-sm font-medium">Track an order</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-cream rounded-3xl p-10 md:p-16 text-center mt-8">
            <div className="text-5xl">□</div>
            <h2 className="font-editorial text-3xl mt-4">No orders yet</h2>
            <p className="text-secondary mt-2 max-w-md mx-auto">Your purchases will appear here after you place your first Cash on Delivery order.</p>
            <Link href="/products" className="inline-flex mt-6 bg-charcoal text-white rounded-xl px-6 py-3 font-semibold">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-5 mt-8">
            {orders.map((order) => (
              <article key={order.id} className="bg-white border border-cream rounded-3xl p-5 md:p-7">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="font-semibold">#{order.orderNumber}</p>
                    <p className="text-sm text-secondary mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-wide font-medium ${statusClass(order.status)}`}>
                      {order.status.replaceAll("_", " ")}
                    </span>
                    <p className="font-semibold">PKR {order.total.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  {order.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex gap-3 bg-cream/60 rounded-2xl p-3">
                      <div className="w-16 h-20 bg-cream rounded-xl overflow-hidden shrink-0">
                        <img src={item.product.images[0] || "/placeholder.jpg"} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        {item.variant && <p className="text-xs text-secondary mt-1">{item.variant.color} / {item.variant.size}</p>}
                        <p className="text-xs text-secondary mt-1">Qty {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.items.length > 4 && <p className="text-xs text-secondary mt-3">+ {order.items.length - 4} more item{order.items.length - 4 === 1 ? "" : "s"}</p>}

                <div className="mt-5 pt-4 border-t border-cream flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="text-xs text-secondary">Cash on Delivery</p>
                    <p className="text-xs text-secondary mt-0.5">Payment: {order.paymentStatus}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}`} className="border border-cream rounded-xl px-4 py-2 text-sm font-medium">Track</Link>
                    <Link href={`/account/orders/${order.id}`} className="bg-charcoal text-white rounded-xl px-4 py-2 text-sm font-medium">View order →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
