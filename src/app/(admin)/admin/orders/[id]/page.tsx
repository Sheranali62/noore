import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OrderAdminForm } from "@/components/admin/order-admin-form"

export const dynamic = "force-dynamic"

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: { include: { product: true, variant: true } },
    },
  })
  if (!order) notFound()

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-secondary mb-1">Order</p>
          <h1 className="text-3xl font-semibold">#{order.orderNumber}</h1>
          <p className="text-secondary mt-1">{order.createdAt.toLocaleString()}</p>
        </div>
        <a href="/admin/orders" className="border border-cream px-4 py-2 rounded hover:bg-cream transition">← Back to Orders</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-lg font-semibold mb-4">Items</h2>
            <div className="divide-y divide-cream">
              {order.items.map(item => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-secondary">{item.variant ? `${item.variant.color} / ${item.variant.size} · ` : ""}Qty {item.quantity}</p>
                  </div>
                  <p className="font-medium">PKR {item.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-cream mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>PKR {order.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>PKR {order.discount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>PKR {order.shipping.toLocaleString()}</span></div>
              <div className="flex justify-between text-base font-semibold pt-2"><span>Total</span><span>PKR {order.total.toLocaleString()}</span></div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-lg font-semibold mb-4">Customer & Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div><p className="text-secondary">Customer</p><p className="font-medium">{order.user.name || "Customer"}</p><p>{order.user.email}</p></div>
              <div><p className="text-secondary">Phone</p><p>{order.address.phone}</p></div>
              <div className="md:col-span-2"><p className="text-secondary">Address</p><p>{order.address.address}, {order.address.city}, {order.address.province} {order.address.postal}</p></div>
            </div>
          </section>
        </div>

        <OrderAdminForm
          orderId={order.id}
          initialStatus={order.status}
          initialPaymentStatus={order.paymentStatus}
          initialTrackingNumber={order.trackingNumber || ""}
          initialCourier={order.courier || ""}
        />
      </div>
    </div>
  )
}
