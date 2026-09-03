import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function statusClass(status: string) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700"
    case "CANCELLED":
      return "bg-red-100 text-red-700"
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "bg-blue-100 text-blue-700"
    case "PROCESSING":
    case "PACKED":
      return "bg-amber-100 text-amber-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/account/orders/${params.id}`)
  }

  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      address: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-cream py-10">
      <div className="max-w-5xl mx-auto px-4">
        <Link
          href="/account/orders"
          className="text-sm text-secondary hover:text-charcoal"
        >
          ← Back to orders
        </Link>

        <div className="mt-6 flex flex-wrap justify-between items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-secondary">
              Order details
            </p>

            <h1 className="font-editorial text-4xl mt-2">
              #{order.orderNumber}
            </h1>

            <p className="text-sm text-secondary mt-2">
              Placed {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/order-tracking?orderNumber=${encodeURIComponent(
                order.orderNumber
              )}`}
              className="border border-cream bg-white rounded-lg px-4 py-2 text-sm"
            >
              Track order
            </Link>

            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${statusClass(
                order.status
              )}`}
            >
              {order.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-8">
          <div className="bg-white border border-cream rounded-2xl p-6">
            <h2 className="font-semibold text-lg">
              Items
            </h2>

            <div className="mt-5 divide-y divide-cream">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex gap-4"
                >
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="w-20 h-24 bg-cream rounded-lg overflow-hidden shrink-0"
                  >
                    <img
                      src={item.product.images[0] || "/placeholder.jpg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1">
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="font-medium hover:underline"
                    >
                      {item.product.name}
                    </Link>

                    {item.variant && (
                      <p className="text-xs text-secondary mt-1">
                        {item.variant.color} / {item.variant.size}
                      </p>
                    )}

                    <p className="text-sm text-secondary mt-2">
                      Qty {item.quantity} × PKR{" "}
                      {item.price.toLocaleString()}
                    </p>
                  </div>

                  <p className="font-semibold">
                    PKR {item.total.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white border border-cream rounded-2xl p-6">
              <h2 className="font-semibold">
                Summary
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">
                    Subtotal
                  </span>
                  <span>
                    PKR {order.subtotal.toLocaleString()}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-secondary">
                      Discount
                    </span>
                    <span>
                      - PKR {order.discount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-secondary">
                    Shipping
                  </span>
                  <span>
                    {order.shipping === 0
                      ? "FREE"
                      : `PKR ${order.shipping.toLocaleString()}`}
                  </span>
                </div>

                <div className="border-t border-cream pt-3 mt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    PKR {order.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-secondary mt-4">
                Payment: Cash on Delivery · {order.paymentStatus}
              </p>
            </div>

            <div className="bg-white border border-cream rounded-2xl p-6">
              <h2 className="font-semibold">
                Delivery address
              </h2>

              <div className="mt-4 text-sm text-secondary space-y-1">
                <p className="text-charcoal font-medium">
                  {order.address.name}
                </p>
                <p>{order.address.phone}</p>
                <p>{order.address.address}</p>
                <p>
                  {order.address.city}, {order.address.province}
                </p>
                <p>{order.address.postal}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}