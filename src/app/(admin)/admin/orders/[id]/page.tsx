import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OrderAdminForm } from "@/components/admin/order-admin-form"

export const dynamic = "force-dynamic"

const labels: Record<string, string> = { PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing", PACKED: "Packed", SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled", RETURNED: "Returned", REFUNDED: "Refunded" }
const timeline = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]

const formatDate = (value: Date | null | undefined) => value ? value.toLocaleString() : "—"
const money = (value: number | null | undefined) => `PKR ${(value ?? 0).toLocaleString()}`

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

  const status = String(order.status ?? "PENDING")
  const currentIndex = timeline.indexOf(status)
  const address = order.address
  const terminal = ["CANCELLED", "RETURNED", "REFUNDED"].includes(status)
  const itemCount = order.items.reduce((n, item) => n + (item.quantity || 0), 0)

  return <div className="max-w-7xl">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <a href="/admin/orders" className="text-sm text-secondary hover:text-charcoal">← All orders</a>
        <p className="text-xs uppercase tracking-[0.2em] text-secondary mt-4">Order operations</p>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">#{order.orderNumber}</h1>
        <p className="text-secondary mt-2">Placed {formatDate(order.createdAt)} · Updated {formatDate(order.updatedAt)}</p>
      </div>
      <div className="flex gap-2 print:hidden">
        <a href={`/admin/orders/${order.id}/print`} className="border border-cream px-4 py-2.5 rounded-xl font-medium hover:bg-cream">Invoice</a>
        <a href={`/admin/orders/${order.id}/print?mode=packing`} target="_blank" rel="noreferrer" className="border border-cream px-4 py-2.5 rounded-xl font-medium hover:bg-cream">Packing slip</a>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="space-y-6">
        <section className="bg-white border border-cream rounded-2xl p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-secondary">Fulfilment</p><h2 className="text-xl font-semibold mt-1">{labels[status] || status}</h2></div><span className="rounded-full border border-cream px-3 py-1 text-xs">{order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "Payment not specified"}</span></div>
          <div className="mt-7 overflow-x-auto"><div className="min-w-[680px] flex items-start">{timeline.map((step, i) => <div key={step} className="flex-1 relative text-center"><div className={`mx-auto h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${currentIndex >= i && currentIndex >= 0 ? "bg-charcoal text-white" : "bg-cream text-secondary"}`}>{i + 1}</div>{i < timeline.length - 1 && <div className={`absolute top-4 left-1/2 w-full h-px ${currentIndex > i && currentIndex >= 0 ? "bg-charcoal" : "bg-cream"}`} /> }<p className="relative mt-3 text-xs font-medium">{labels[step]}</p></div>)}</div></div>
          {terminal && <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm">This order is {(labels[status] || status).toLowerCase()}. Inventory has been handled by the order status workflow.</div>}
        </section>

        <section className="bg-white border border-cream rounded-2xl p-5 lg:p-6">
          <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">Items</h2><span className="text-sm text-secondary">{itemCount} units</span></div>
          {order.items.length === 0 ? <div className="rounded-xl border border-dashed border-cream p-6 text-sm text-secondary">No items were found on this order.</div> : <div className="divide-y divide-cream">{order.items.map(item => <div key={item.id} className="py-4 flex justify-between gap-5"><div><p className="font-medium">{item.product?.name || "Product unavailable"}</p><p className="text-sm text-secondary mt-1">{item.variant ? `${item.variant.color || "Color"} / ${item.variant.size || "Size"} · ` : ""}Qty {item.quantity || 0}</p></div><div className="text-right"><p className="font-medium">{money(item.total)}</p><p className="text-xs text-secondary">{money(item.price)} each</p></div></div>)}</div>}
          <div className="border-t border-cream mt-3 pt-4 space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>- {money(order.discount)}</span></div><div className="flex justify-between"><span>Shipping</span><span>{money(order.shipping)}</span></div><div className="flex justify-between text-lg font-semibold pt-3"><span>Total</span><span>{money(order.total)}</span></div></div>
        </section>

        <section className="bg-white border border-cream rounded-2xl p-5 lg:p-6"><h2 className="text-lg font-semibold mb-5">Customer & delivery</h2><div className="grid md:grid-cols-2 gap-5 text-sm"><div><p className="text-secondary">Customer</p><p className="font-medium mt-1">{order.user?.name || "Customer"}</p><p>{order.user?.email || ""}</p></div><div><p className="text-secondary">Phone</p><p className="font-medium mt-1">{address?.phone || "Not provided"}</p></div><div className="md:col-span-2"><p className="text-secondary">Delivery address</p><p className="font-medium mt-1">{address?.address || "Address not provided"}</p><p>{[address?.city, address?.province, address?.postal].filter(Boolean).join(", ") || "Address details not provided"}</p></div></div></section>
      </div>
      <OrderAdminForm orderId={order.id} initialStatus={status} initialPaymentStatus={order.paymentStatus} initialTrackingNumber={order.trackingNumber || ""} initialCourier={order.courier || ""} />
    </div>
  </div>
}
