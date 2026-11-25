import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const steps = [
  ["PENDING", "Order placed", "We received your order."],
  ["CONFIRMED", "Confirmed", "Your order has been confirmed."],
  ["PROCESSING", "Processing", "Your pieces are being prepared."],
  ["PACKED", "Packed", "Your order has been packed."],
  ["SHIPPED", "Shipped", "Your order is on the way."],
  ["OUT_FOR_DELIVERY", "Out for delivery", "Your order is with the delivery team."],
  ["DELIVERED", "Delivered", "Your order has arrived."],
] as const

function statusClass(status: string) {
  if (status === "DELIVERED") return "bg-green-100 text-green-800"
  if (status === "CANCELLED" || status === "REFUNDED") return "bg-red-100 text-red-800"
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "bg-[#E8ECE6] text-[#465340]"
  return "bg-[#EEEDE6] text-[#535F4C]"
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`/login?callbackUrl=/account/orders/${(await params).id}`)

  const order = await prisma.order.findFirst({
    where: { id: (await params).id, userId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      trackingNumber: true,
      subtotal: true,
      discount: true,
      shipping: true,
      tax: true,
      total: true,
      paymentStatus: true,
      address: { select: { name: true, phone: true, address: true, city: true, province: true, postal: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          total: true,
          product: { select: { id: true, name: true, slug: true, images: true } },
          variant: { select: { color: true, size: true } },
        },
      },
      orderEvents: {
        orderBy: { createdAt: "desc" },
        select: { id: true, event: true, message: true, createdAt: true },
      },
    },
  })
  if (!order) notFound()

  const currentIndex = steps.findIndex(([status]) => status === order.status)
  const isException = order.status === "CANCELLED" || order.status === "REFUNDED"

  return (
    <div className="min-h-screen bg-[#F7F6F2] py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/account/orders" className="text-sm text-[#777967] hover:text-[#343A30]">← Back to orders</Link>

        <div className="mt-6 flex flex-wrap justify-between items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#777967]">Order details</p>
            <h1 className="font-editorial text-4xl md:text-5xl mt-2">#{order.orderNumber}</h1>
            <p className="text-sm text-[#777967] mt-2">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}`} className="border border-[#D8D8CB] bg-white rounded-xl px-4 py-2.5 text-sm font-medium">Track order</Link>
            {order.status === "DELIVERED" && <Link href="/account/returns" className="rounded-xl bg-[#535F4C] px-4 py-2.5 text-sm font-medium text-white">Request return</Link>}
            <span className={`rounded-full px-4 py-2 text-xs uppercase tracking-wide font-medium ${statusClass(order.status)}`}>{order.status.replaceAll("_", " ")}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 mt-8">
          <div className="space-y-6">
            <section className="bg-white border border-[#D8D8CB] rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#777967]">Delivery progress</p>
                  <h2 className="font-editorial text-2xl mt-1">Your order journey</h2>
                </div>
                {order.trackingNumber && <p className="text-xs text-[#777967]">Tracking: <span className="font-medium text-[#343A30]">{order.trackingNumber}</span></p>}
              </div>

              {isException ? (
                <div className="mt-7 rounded-2xl bg-red-50 border border-red-100 p-5">
                  <p className="font-semibold">{order.status === "CANCELLED" ? "This order was cancelled." : "This order was refunded."}</p>
                  <p className="text-sm text-[#777967] mt-1">The normal delivery journey is no longer active for this order.</p>
                </div>
              ) : (
                <div className="mt-8">
                  {steps.map(([status, label, description], index) => {
                    const completed = currentIndex >= 0 && index <= currentIndex
                    const current = index === currentIndex
                    return (
                      <div key={status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${completed ? "bg-[#535F4C] text-[#F7F6F2]" : "bg-[#F7F6F2] text-[#777967]"}`}>
                            {completed ? "✓" : index + 1}
                          </div>
                          {index < steps.length - 1 && <div className={`w-px h-12 ${index < currentIndex ? "bg-[#535F4C]" : "bg-[#F7F6F2]"}`} />}
                        </div>
                        <div className="pb-7">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-medium ${completed ? "text-[#343A30]" : "text-[#777967]"}`}>{label}</p>
                            {current && <span className="text-[10px] uppercase tracking-wide rounded-full bg-[#535F4C] text-[#F7F6F2] px-2 py-1">Current</span>}
                          </div>
                          <p className="text-sm text-[#777967] mt-1">{description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {order.orderEvents.length > 0 && <section className="bg-white border border-[#D8D8CB] rounded-3xl p-6 md:p-8">
              <h2 className="font-editorial text-2xl">Order activity</h2>
              <div className="mt-5 space-y-4">{order.orderEvents.map(event => <div key={event.id} className="flex gap-3 border-l-2 border-[#535F4C]/30 pl-4"><div className="min-w-0"><p className="text-sm font-medium">{event.event.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-[#777967]">{event.message || "Order updated."}</p><p className="mt-1 text-[11px] text-[#777967]">{new Date(event.createdAt).toLocaleString()}</p></div></div>)}</div>
            </section>}

            <section className="bg-white border border-[#D8D8CB] rounded-3xl p-6 md:p-8">
              <h2 className="font-editorial text-2xl">Items</h2>
              <div className="mt-5 divide-y divide-[#3a3328]">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <Link href={`/product/${item.product.slug}`} className="w-20 h-24 md:w-24 md:h-28 bg-[#F7F6F2] rounded-xl overflow-hidden shrink-0">
                      <img src={item.product.images[0] || "/placeholder.jpg"} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.slug}`} className="font-medium hover:underline">{item.product.name}</Link>
                      {item.variant && <p className="text-xs text-[#777967] mt-1">{item.variant.color} / {item.variant.size}</p>}
                      <p className="text-sm text-[#777967] mt-2">Qty {item.quantity} × PKR {item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-semibold">PKR {item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-white border border-[#D8D8CB] rounded-3xl p-6">
              <h2 className="font-semibold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#777967]">Subtotal</span><span>PKR {order.subtotal.toLocaleString()}</span></div>
                {order.discount > 0 && <div className="flex justify-between"><span className="text-[#777967]">Discount</span><span>- PKR {order.discount.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span className="text-[#777967]">Shipping</span><span>{order.shipping === 0 ? "FREE" : `PKR ${order.shipping.toLocaleString()}`}</span></div>
                {order.tax > 0 && <div className="flex justify-between"><span className="text-[#777967]">Tax</span><span>PKR {order.tax.toLocaleString()}</span></div>}
                <div className="border-t border-[#D8D8CB] pt-3 mt-3 flex justify-between font-semibold"><span>Total</span><span>PKR {order.total.toLocaleString()}</span></div>
              </div>
              <div className="mt-5 rounded-2xl bg-[#EEEDE6] p-4">
                <p className="text-xs uppercase tracking-wide text-[#777967]">Payment</p>
                <p className="font-medium mt-1">Cash on Delivery</p>
                <p className="text-xs text-[#777967] mt-1">Status: {order.paymentStatus}</p>
              </div>
            </section>

            <section className="bg-white border border-[#D8D8CB] rounded-3xl p-6">
              <h2 className="font-semibold">Delivery address</h2>
              <div className="mt-4 text-sm text-[#777967] space-y-1">
                <p className="text-[#343A30] font-medium">{order.address.name}</p>
                <p>{order.address.phone}</p>
                <p>{order.address.address}</p>
                <p>{order.address.city}, {order.address.province}</p>
                <p>{order.address.postal}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
