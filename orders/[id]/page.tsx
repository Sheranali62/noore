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

function safeString(value: unknown, fallback = "—") {
  if (typeof value !== "string") return fallback

  const trimmed = value.trim()

  return trimmed || fallback
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  /*
   * IMPORTANT:
   * Load the Order using scalar fields only.
   *
   * We intentionally do NOT use:
   * include: {
   *   user,
   *   address,
   *   items,
   *   courierCompany
   * }
   *
   * This prevents a broken/missing relation from taking down
   * the entire admin order detail page.
   */

  let order: Awaited<
    ReturnType<typeof prisma.order.findUnique>
  > | null = null

  try {
    order = await prisma.order.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        addressId: true,

        subtotal: true,
        discount: true,
        shipping: true,
        tax: true,
        total: true,

        status: true,
        paymentMethod: true,
        paymentStatus: true,

        trackingNumber: true,
        courier: true,
        courierCompanyId: true,

        notes: true,
        couponCode: true,

        createdAt: true,
        updatedAt: true,
      },
    })
  } catch (error) {
    console.error("Admin order scalar query failed:", error)

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
            There was a problem loading this order from the
            database. Please try again.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/orders"
              className="inline-flex border border-cream px-4 py-2 rounded hover:bg-cream transition"
            >
              ← Back to Orders
            </a>

            <a
              href={`/admin/orders/${params.id}`}
              className="inline-flex bg-black text-white px-4 py-2 rounded hover:opacity-90 transition"
            >
              Retry
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    notFound()
  }

  /*
   * ---------------------------------------------------------
   * CUSTOMER
   * ---------------------------------------------------------
   */

  let customer: {
    name: string | null
    email: string
  } | null = null

  try {
    customer = await prisma.user.findUnique({
      where: {
        id: order.userId,
      },
      select: {
        name: true,
        email: true,
      },
    })
  } catch (error) {
    console.error("Admin order customer query failed:", error)
  }

  /*
   * ---------------------------------------------------------
   * ADDRESS
   * ---------------------------------------------------------
   */

  let address: {
    name: string
    phone: string
    address: string
    city: string
    province: string
    postal: string
  } | null = null

  try {
    address = await prisma.address.findUnique({
      where: {
        id: order.addressId,
      },
      select: {
        name: true,
        phone: true,
        address: true,
        city: true,
        province: true,
        postal: true,
      },
    })
  } catch (error) {
    console.error("Admin order address query failed:", error)
  }

  /*
   * ---------------------------------------------------------
   * ORDER ITEMS
   * ---------------------------------------------------------
   *
   * Again, load only scalar item fields first.
   * Products and variants are fetched separately.
   */

  type OrderItemRow = {
    id: string
    productId: string
    variantId: string | null
    quantity: number
    price: number
    total: number
  }

  let rawItems: OrderItemRow[] = []

  try {
    rawItems = await prisma.orderItem.findMany({
      where: {
        orderId: order.id,
      },
      select: {
        id: true,
        productId: true,
        variantId: true,
        quantity: true,
        price: true,
        total: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })
  } catch (error) {
    console.error("Admin order items query failed:", error)
  }

  /*
   * ---------------------------------------------------------
   * PRODUCTS
   * ---------------------------------------------------------
   */

  const productIds = Array.from(
    new Set(rawItems.map((item) => item.productId).filter(Boolean))
  )

  type ProductRow = {
    id: string
    name: string
    sku: string
    images: string[]
  }

  let products: ProductRow[] = []

  if (productIds.length > 0) {
    try {
      products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          images: true,
        },
      })
    } catch (error) {
      console.error("Admin order products query failed:", error)
    }
  }

  /*
   * ---------------------------------------------------------
   * VARIANTS
   * ---------------------------------------------------------
   */

  const variantIds = Array.from(
    new Set(
      rawItems
        .map((item) => item.variantId)
        .filter((id): id is string => Boolean(id))
    )
  )

  type VariantRow = {
    id: string
    color: string
    size: string
    sku: string
    images: string[]
  }

  let variants: VariantRow[] = []

  if (variantIds.length > 0) {
    try {
      variants = await prisma.productVariant.findMany({
        where: {
          id: {
            in: variantIds,
          },
        },
        select: {
          id: true,
          color: true,
          size: true,
          sku: true,
          images: true,
        },
      })
    } catch (error) {
      console.error("Admin order variants query failed:", error)
    }
  }

  /*
   * ---------------------------------------------------------
   * COURIER COMPANY
   * ---------------------------------------------------------
   */

  type CourierCompanyRow = {
    id: string
    name: string
    accountNumber: string | null
    contractNumber: string | null
    contactName: string | null
    contactPhone: string | null
    contactEmail: string | null
    pickupAddress: string | null
    pickupCity: string | null
    serviceNotes: string | null
  }

  let courierCompany: CourierCompanyRow | null = null

  if (order.courierCompanyId) {
    try {
      courierCompany = await prisma.courierCompany.findUnique({
        where: {
          id: order.courierCompanyId,
        },
        select: {
          id: true,
          name: true,
          accountNumber: true,
          contractNumber: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
          pickupAddress: true,
          pickupCity: true,
          serviceNotes: true,
        },
      })
    } catch (error) {
      console.error(
        "Admin order courier company query failed:",
        error
      )
    }
  }

  /*
   * ---------------------------------------------------------
   * MAP PRODUCTS / VARIANTS
   * ---------------------------------------------------------
   */

  const productMap = new Map(
    products.map((product) => [product.id, product])
  )

  const variantMap = new Map(
    variants.map((variant) => [variant.id, variant])
  )

  const items = rawItems.map((item) => ({
    ...item,
    product: productMap.get(item.productId) ?? null,
    variant: item.variantId
      ? variantMap.get(item.variantId) ?? null
      : null,
  }))

  /*
   * ---------------------------------------------------------
   * DISPLAY DATA
   * ---------------------------------------------------------
   */

  const customerName = safeString(
    customer?.name,
    address?.name || "Customer"
  )

  const customerEmail = safeString(
    customer?.email,
    "No email available"
  )

  const phone = safeString(
    address?.phone,
    "No phone available"
  )

  const paymentMethod = String(
    order.paymentMethod || "COD"
  )

  const paymentStatus = String(
    order.paymentStatus || "UNPAID"
  )

  const orderStatus = String(
    order.status || "PENDING"
  )

  const courierName = safeString(
    order.courier,
    "Not assigned"
  )

  const trackingNumber = safeString(
    order.trackingNumber,
    "Not assigned"
  )

  return (
    <div className="max-w-6xl">
      {/* =====================================================
          HEADER
      ====================================================== */}

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

        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/orders"
            className="border border-cream px-4 py-2 rounded hover:bg-cream transition inline-flex items-center justify-center"
          >
            ← Back to Orders
          </a>

          <a
            href={`/admin/orders/${order.id}/print`}
            target="_blank"
            rel="noreferrer"
            className="border border-cream px-4 py-2 rounded hover:bg-cream transition inline-flex items-center justify-center"
          >
            Print
          </a>
        </div>
      </div>

      {/* =====================================================
          STATUS STRIP
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-cream bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-secondary">
            Order Status
          </p>

          <p className="font-semibold mt-1">
            {orderStatus}
          </p>
        </div>

        <div className="rounded-lg border border-cream bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-secondary">
            Payment
          </p>

          <p className="font-semibold mt-1">
            {paymentStatus}
          </p>
        </div>

        <div className="rounded-lg border border-cream bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-secondary">
            Method
          </p>

          <p className="font-semibold mt-1">
            {paymentMethod}
          </p>
        </div>

        <div className="rounded-lg border border-cream bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-secondary">
            Items
          </p>

          <p className="font-semibold mt-1">
            {items.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}

        <div className="lg:col-span-2 space-y-6">
          {/* =================================================
              ITEMS
          ================================================== */}

          <section className="bg-white rounded-lg border border-cream p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">
                Items
              </h2>

              <span className="text-sm text-secondary">
                {items.length} item
                {items.length === 1 ? "" : "s"}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium">
                  No items found
                </p>

                <p className="text-sm text-secondary mt-1">
                  This order currently has no readable order
                  items.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-cream">
                {items.map((item) => {
                  const product = item.product
                  const variant = item.variant

                  const image =
                    product?.images?.[0] ||
                    variant?.images?.[0] ||
                    null

                  return (
                    <div
                      key={item.id}
                      className="py-4 flex items-center gap-4"
                    >
                      {/* Product Image */}

                      <div className="w-16 h-20 rounded overflow-hidden bg-cream/50 shrink-0">
                        {image ? (
                          <img
                            src={image}
                            alt={product?.name || "Product"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-secondary">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Product Info */}

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {product?.name || "Product unavailable"}
                        </p>

                        {product?.sku ? (
                          <p className="text-xs text-secondary mt-1">
                            SKU: {product.sku}
                          </p>
                        ) : null}

                        {variant ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {variant.color ? (
                              <span className="rounded-full border border-cream px-2 py-1 text-xs">
                                {variant.color}
                              </span>
                            ) : null}

                            {variant.size ? (
                              <span className="rounded-full border border-cream px-2 py-1 text-xs">
                                Size {variant.size}
                              </span>
                            ) : null}

                            {variant.sku ? (
                              <span className="rounded-full border border-cream px-2 py-1 text-xs">
                                {variant.sku}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <p className="text-sm text-secondary mt-2">
                          Qty {item.quantity} × {money(item.price)}
                        </p>
                      </div>

                      {/* Total */}

                      <div className="text-right shrink-0">
                        <p className="font-semibold">
                          {money(item.total)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* =================================================
                TOTALS
            ================================================== */}

            <div className="border-t border-cream mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-secondary">
                  Subtotal
                </span>

                <span>
                  {money(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-secondary">
                  Discount
                </span>

                <span>
                  {money(order.discount)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-secondary">
                  Shipping
                </span>

                <span>
                  {money(order.shipping)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-secondary">
                  Tax
                </span>

                <span>
                  {money(order.tax)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-base font-semibold pt-3 border-t border-cream">
                <span>
                  Total
                </span>

                <span>
                  {money(order.total)}
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              CUSTOMER & DELIVERY
          ================================================== */}

          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-lg font-semibold mb-5">
              Customer & Delivery
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              {/* Customer */}

              <div>
                <p className="text-secondary mb-1">
                  Customer
                </p>

                <p className="font-medium">
                  {customerName}
                </p>

                <p className="break-all">
                  {customerEmail}
                </p>
              </div>

              {/* Phone */}

              <div>
                <p className="text-secondary mb-1">
                  Phone
                </p>

                <p className="font-medium">
                  {phone}
                </p>
              </div>

              {/* Address */}

              <div className="md:col-span-2">
                <p className="text-secondary mb-1">
                  Delivery Address
                </p>

                {address ? (
                  <div className="rounded-lg border border-cream bg-cream/20 p-4">
                    <p className="font-medium">
                      {safeString(address.name, customerName)}
                    </p>

                    <p className="mt-2">
                      {safeString(
                        address.address,
                        "Address not provided"
                      )}
                    </p>

                    <p className="mt-1">
                      {address.city || ""}
                      {address.province
                        ? `, ${address.province}`
                        : ""}
                      {address.postal
                        ? ` ${address.postal}`
                        : ""}
                    </p>

                    <p className="mt-2 text-secondary">
                      {safeString(
                        address.phone,
                        "No phone available"
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-cream bg-cream/30 p-4">
                    <p className="font-medium">
                      Delivery address unavailable
                    </p>

                    <p className="text-secondary mt-1">
                      The order references an address that could
                      not be loaded. The order itself is still
                      available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              ORDER INFORMATION
          ================================================== */}

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
                  Created
                </p>

                <p className="font-medium">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Last Updated
                </p>

                <p className="font-medium">
                  {formatDate(order.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Payment Method
                </p>

                <p className="font-medium">
                  {paymentMethod}
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
                  {paymentStatus}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Order Status
                </p>

                <p className="font-medium">
                  {orderStatus}
                </p>
              </div>

              {order.couponCode ? (
                <div>
                  <p className="text-secondary mb-1">
                    Coupon
                  </p>

                  <p className="font-medium">
                    {order.couponCode}
                  </p>
                </div>
              ) : null}

              {order.notes ? (
                <div className="md:col-span-2">
                  <p className="text-secondary mb-1">
                    Order Notes
                  </p>

                  <div className="rounded-lg border border-cream bg-cream/20 p-4 whitespace-pre-wrap">
                    {order.notes}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* =================================================
              COURIER COMPANY
          ================================================== */}

          <section className="bg-white rounded-lg border border-cream p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary">
                  Fulfilment
                </p>

                <h2 className="text-lg font-semibold mt-1">
                  Courier Company
                </h2>
              </div>

              <a
                href="/admin/couriers"
                className="text-sm border border-cream rounded px-3 py-2 hover:bg-cream transition"
              >
                Manage Couriers
              </a>
            </div>

            {courierCompany ? (
              <div className="rounded-lg border border-cream p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold">
                      {courierCompany.name}
                    </p>

                    <p className="text-sm text-secondary mt-1">
                      Saved courier profile
                    </p>
                  </div>

                  <div className="rounded-full border border-cream px-3 py-1 text-xs">
                    Selected for this order
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
                  {courierCompany.accountNumber ? (
                    <div>
                      <p className="text-secondary">
                        Account Number
                      </p>

                      <p className="font-medium mt-1">
                        {courierCompany.accountNumber}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.contractNumber ? (
                    <div>
                      <p className="text-secondary">
                        Contract Number
                      </p>

                      <p className="font-medium mt-1">
                        {courierCompany.contractNumber}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.contactName ? (
                    <div>
                      <p className="text-secondary">
                        Contact Person
                      </p>

                      <p className="font-medium mt-1">
                        {courierCompany.contactName}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.contactPhone ? (
                    <div>
                      <p className="text-secondary">
                        Contact Phone
                      </p>

                      <p className="font-medium mt-1">
                        {courierCompany.contactPhone}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.contactEmail ? (
                    <div>
                      <p className="text-secondary">
                        Contact Email
                      </p>

                      <p className="font-medium mt-1 break-all">
                        {courierCompany.contactEmail}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.pickupCity ? (
                    <div>
                      <p className="text-secondary">
                        Pickup City
                      </p>

                      <p className="font-medium mt-1">
                        {courierCompany.pickupCity}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.pickupAddress ? (
                    <div className="md:col-span-2">
                      <p className="text-secondary">
                        Pickup Address
                      </p>

                      <p className="font-medium mt-1">
                        {courierCompany.pickupAddress}
                      </p>
                    </div>
                  ) : null}

                  {courierCompany.serviceNotes ? (
                    <div className="md:col-span-2">
                      <p className="text-secondary">
                        Service Notes
                      </p>

                      <p className="mt-1 whitespace-pre-wrap">
                        {courierCompany.serviceNotes}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-cream p-5">
                <p className="font-medium">
                  No saved courier company selected
                </p>

                <p className="text-sm text-secondary mt-1">
                  Use the order controls to select one of your
                  saved courier companies. Manual courier and
                  tracking fields remain available.
                </p>
              </div>
            )}
          </section>

          {/* =================================================
              SHIPPING SUMMARY
          ================================================== */}

          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-lg font-semibold mb-5">
              Shipping & Tracking
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-secondary mb-1">
                  Courier
                </p>

                <p className="font-medium">
                  {courierName}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Tracking Number
                </p>

                <p className="font-medium break-all">
                  {trackingNumber}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Shipping Charge
                </p>

                <p className="font-medium">
                  {money(order.shipping)}
                </p>
              </div>

              <div>
                <p className="text-secondary mb-1">
                  Delivery Method
                </p>

                <p className="font-medium">
                  Cash on Delivery
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ===================================================
            ORDER CONTROLS
        ==================================================== */}

        <div>
          <div className="lg:sticky lg:top-6">
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
      </div>
    </div>
  )
}