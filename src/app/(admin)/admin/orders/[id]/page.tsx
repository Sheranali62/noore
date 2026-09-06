import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OrderAdminForm } from "@/components/admin/order-admin-form"

export const dynamic = "force-dynamic"

function money(value: number | null | undefined) {
  return `PKR ${(value ?? 0).toLocaleString()}`
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—"

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString()
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  let order

  try {
    order = await prisma.order.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },

        address: true,

        items: {
          include: {
            product: true,
            variant: true,
          },
        },

        courierCompany: true,
      },
    })
  } catch (error) {
    console.error("Admin order detail failed:", error)

    return (
      <div className="max-w-4xl">
        <div className="rounded-lg border border-cream bg-white p-8">
          <p className="text-sm text-secondary mb-2">
            Order Details
          </p>

          <h1 className="text-2xl font-semibold mb-3">
            Unable to load this order
          </h1>

          <p className="text-secondary mb-6">
            This order could not be loaded right now. Please try again.
          </p>

          <a
            href="/admin/orders"
            className="inline-flex border border-cream px-4 py-2 rounded hover:bg-cream transition"
          >
            ← Back to Orders
          </a>
        </div>
      </div>
    )
  }

  if (!order) {
    notFound()
  }

  const address = order.address
  const customer = order.user

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-secondary mb-1">
            Order Details
          </p>

          <h1 className="text-3xl font-semibold">
            #{order.orderNumber}
          </h1>

          <p className="text-secondary mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <a
          href="/admin/orders"
          className="border border-cream px-4 py-2 rounded hover:bg-cream transition inline-flex items-center justify-center"
        >
          ← Back to Orders
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white rounded-lg border border-cream p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">
                Items
              </h2>

              <span className="text-sm text-secondary">
                {order.items.length} item
                {order.items.length === 1 ? "" : "s"}
              </span>
            </div>

            {order.items.length === 0 ? (
              <div className="py-8 text-center text-secondary">
                No items found for this order.
              </div>
            ) : (
              <div className="divide-y divide-cream">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.product?.name || "Product"}
                      </p>

                      {item.variant ? (
                        <p className="text-sm text-secondary mt-1">
                          {item.variant.color || "—"}
                          {" / "}
                          {item.variant.size || "—"}
                        </p>
                      ) : null}

                      <p className="text-sm text-secondary">
                        Qty {item.quantity}
                      </p>
                    </div>

                    <p className="font-medium whitespace-nowrap">
                      {money(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-cream mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>
                <span>{money(order.discount)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{money(order.shipping)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{money(order.tax)}</span>
              </div>

              <div className="flex justify-between text-base font-semibold pt-3 border-t border-cream">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Customer & Delivery */}
          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-lg font-semibold mb-5">
              Customer & Delivery
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-secondary mb-1">
                  Customer
                </p>

                <p className="font-medium">
                  {customer?.name || "Customer"}
                </p>

                <p>
                  {customer?.email || "No email available"}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Phone
                </p>

                <p className="font-medium">
                  {address?.phone || "No phone available"}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-secondary mb-1">
                  Delivery Address
                </p>

                {address ? (
                  <p>
                    {address.address || "Address not provided"}
                    {address.city
                      ? `, ${address.city}`
                      : ""}
                    {address.province
                      ? `, ${address.province}`
                      : ""}
                    {address.postal
                      ? ` ${address.postal}`
                      : ""}
                  </p>
                ) : (
                  <div className="rounded border border-cream bg-cream/30 p-4">
                    <p className="font-medium">
                      Delivery address unavailable
                    </p>

                    <p className="text-secondary mt-1">
                      This order does not currently have a
                      delivery address attached.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Order Information */}
          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-lg font-semibold mb-5">
              Order Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-secondary mb-1">
                  Order Number
                </p>

                <p className="font-medium">
                  #{order.orderNumber}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Payment Method
                </p>

                <p className="font-medium">
                  {String(order.paymentMethod || "COD")}
                </p>

                <p className="text-xs text-secondary mt-1">
                  Cash on Delivery
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Payment Status
                </p>

                <p className="font-medium">
                  {String(order.paymentStatus || "UNPAID")}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Order Status
                </p>

                <p className="font-medium">
                  {String(order.status || "PENDING")}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Courier
                </p>

                <p className="font-medium">
                  {order.courier || "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Tracking Number
                </p>

                <p className="font-medium">
                  {order.trackingNumber || "Not assigned"}
                </p>
              </div>

              {order.courierCompany ? (
                <div className="md:col-span-2 rounded-lg border border-cream p-4">
                  <p className="text-xs uppercase tracking-wide text-secondary mb-2">
                    Saved Courier Company
                  </p>

                  <p className="font-semibold text-base">
                    {order.courierCompany.name}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                    {order.courierCompany.accountNumber ? (
                      <div>
                        <p className="text-secondary">
                          Account Number
                        </p>
                        <p>
                          {order.courierCompany.accountNumber}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.contractNumber ? (
                      <div>
                        <p className="text-secondary">
                          Contract Number
                        </p>
                        <p>
                          {order.courierCompany.contractNumber}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.contactName ? (
                      <div>
                        <p className="text-secondary">
                          Contact Person
                        </p>
                        <p>
                          {order.courierCompany.contactName}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.contactPhone ? (
                      <div>
                        <p className="text-secondary">
                          Contact Phone
                        </p>
                        <p>
                          {order.courierCompany.contactPhone}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.contactEmail ? (
                      <div>
                        <p className="text-secondary">
                          Contact Email
                        </p>
                        <p>
                          {order.courierCompany.contactEmail}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.pickupCity ? (
                      <div>
                        <p className="text-secondary">
                          Pickup City
                        </p>
                        <p>
                          {order.courierCompany.pickupCity}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.pickupAddress ? (
                      <div className="md:col-span-2">
                        <p className="text-secondary">
                          Pickup Address
                        </p>
                        <p>
                          {order.courierCompany.pickupAddress}
                        </p>
                      </div>
                    ) : null}

                    {order.courierCompany.serviceNotes ? (
                      <div className="md:col-span-2">
                        <p className="text-secondary">
                          Service Notes
                        </p>
                        <p>
                          {order.courierCompany.serviceNotes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Order Controls */}
        <OrderAdminForm
          orderId={order.id}
          initialStatus={order.status}
          initialPaymentStatus={order.paymentStatus}
          initialTrackingNumber={
            order.trackingNumber || ""
          }
          initialCourier={order.courier || ""}
          initialCourierCompanyId={
            order.courierCompanyId || ""
          }
        />
      </div>
    </div>
  )
}