import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calculateCouponDiscount } from "@/lib/coupons"
import { randomBytes } from "crypto"
import { sendNewOrderAdminEmail, sendOrderStatusEmail } from "@/lib/notifications"

export const dynamic = "force-dynamic"

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function trackingResponse(body: unknown, options?: { status?: number }) {
  return NextResponse.json(body, {
    ...options,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  })
}

async function makeOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const value = `NO-${new Date().getFullYear()}-${randomBytes(8)
      .toString("hex")
      .toUpperCase()}`

    const exists = await prisma.order.findUnique({
      where: { orderNumber: value },
      select: { id: true },
    })

    if (!exists) return value
  }

  throw new Error("Unable to generate a unique order number")
}

export async function GET(request: NextRequest) {
  const databaseLimit = await enforceRateLimit(request, "order-tracking", 20, 60000)
  if (databaseLimit) return databaseLimit
  try {
    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get("orderNumber")?.trim()
    const email = normalizeEmail(searchParams.get("email"))

    if (
      !orderNumber ||
      orderNumber.length > 64 ||
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return trackingResponse(
        { error: "A valid order number and email are required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        paymentMethod: true,
        trackingNumber: true,
        courier: true,
        user: { select: { email: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: { select: { name: true, images: true } },
            variant: { select: { color: true, size: true } },
          },
        },
      },
    })

    if (!order) {
      return trackingResponse(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    if (normalizeEmail(order.user?.email) !== email) {
      return trackingResponse(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return trackingResponse({ order })
  } catch (error) {
    console.error("Error tracking order:", error)

    return trackingResponse(
      { error: "Failed to track order" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const databaseLimit = await enforceRateLimit(request, "order-creation", 10, 3600000)
  if (databaseLimit) return databaseLimit
  try {
    const origin = request.headers.get("origin")
    const fetchSite = request.headers.get("sec-fetch-site")
    if (
      (origin && new URL(origin).origin !== request.nextUrl.origin) ||
      fetchSite === "cross-site"
    ) {
      return NextResponse.json({ error: "Cross-site order requests are not allowed" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required" }, { status: 415 })
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ error: "Order request is too large" }, { status: 413 })
    }

    const body = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid order request" }, { status: 400 })
    }

    const customer = body.customer ?? {}
    const address = body.address ?? {}

    const email = normalizeEmail(customer.email)
    const name = String(customer.name ?? "").trim()
    const phone = String(customer.phone ?? "").trim()

    const addressLine = String(address.address ?? "").trim()
    const city = String(address.city ?? "").trim()
    const province = String(address.province ?? "").trim()
    const postal = String(address.postal ?? "").trim()

    const paymentMethod = String(body.paymentMethod ?? "").toUpperCase()
    const deliveryMethod = String(
      body.deliveryMethod ?? "standard"
    ).toLowerCase()

    const couponCode =
      String(body.couponCode ?? "").trim().toUpperCase() || null

    const items = Array.isArray(body.items) ? body.items : []

    if (
      !name ||
      name.length > 120 ||
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !phone ||
      phone.length > 32 ||
      !addressLine ||
      addressLine.length > 300 ||
      !city ||
      city.length > 100 ||
      !province ||
      province.length > 100 ||
      !postal ||
      postal.length > 24 ||
      !items.length ||
      items.length > 50 ||
      (couponCode !== null && couponCode.length > 64)
    ) {
      return NextResponse.json(
        {
          error:
            "Complete customer, address, and cart details are required",
        },
        { status: 400 }
      )
    }

    // NOORÉ is COD-only.
    if (paymentMethod !== "COD") {
      return NextResponse.json(
        {
          error:
            "Cash on Delivery is the only available payment method",
        },
        { status: 400 }
      )
    }

    if (!["standard", "express"].includes(deliveryMethod)) {
      return NextResponse.json(
        { error: "Invalid delivery method" },
        { status: 400 }
      )
    }

    const session = await auth()
    const sessionUserId = session?.user?.id
    const sessionEmail = normalizeEmail(session?.user?.email)
    if (sessionUserId && sessionEmail !== email) {
      return NextResponse.json(
        { error: "Please use the email address on your signed-in NOORÉ account" },
        { status: 403 }
      )
    }

    const subtotalInput = Number(body.subtotal)
    const shippingInput = Number(body.shipping)
    const taxInput = Number(body.tax ?? 0)
    const totalInput = Number(body.total)

    if (
      !Number.isFinite(subtotalInput) ||
      !Number.isFinite(shippingInput) ||
      !Number.isFinite(taxInput) ||
      !Number.isFinite(totalInput)
    ) {
      return NextResponse.json(
        { error: "Invalid totals" },
        { status: 400 }
      )
    }

    const requested = items.map((item: any) => ({
      productId: String(item.productId ?? ""),
      variantId: item.variantId
        ? String(item.variantId)
        : null,
      quantity: Number(item.quantity),
    }))

    if (
      requested.some(
        (item: any) =>
          !item.productId ||
          item.productId.length > 128 ||
          (item.variantId !== null && item.variantId.length > 128) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 99
      )
    ) {
      return NextResponse.json(
        { error: "Invalid cart items" },
        { status: 400 }
      )
    }

    if (new Set(requested.map((item: any) => `${item.productId}:${item.variantId ?? "no-variant"}`)).size !== requested.length) {
      return NextResponse.json(
        { error: "Remove duplicate items from your cart and try again" },
        { status: 400 }
      )
    }

    const productIds: string[] = Array.from(
      new Set(
        requested.map(
          (item: any) => item.productId
        )
      )
    )

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        variants: true,
      },
    })

    const byId = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    )

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more products are no longer available",
        },
        { status: 400 }
      )
    }

    let subtotal = 0

    const couponItems: {
      productId: string
      quantity: number
      price: number
      category: string
    }[] = []

    const orderItems: {
      productId: string
      variantId: string | null
      quantity: number
      price: number
      costPrice: number | null
      total: number
    }[] = []

    for (const item of requested) {
      const product = byId.get(item.productId)!

      if (product.status !== "ACTIVE") {
        return NextResponse.json(
          {
            error: `${product.name} is no longer available`,
          },
          { status: 400 }
        )
      }

      const variant = item.variantId
        ? product.variants.find(
            (v) => v.id === item.variantId
          )
        : null

      if (item.variantId && !variant) {
        return NextResponse.json(
          {
            error: `Invalid variant for ${product.name}`,
          },
          { status: 400 }
        )
      }

      const stock =
        variant?.stock ?? product.stock

      if (item.quantity > stock) {
        return NextResponse.json(
          {
            error: `Only ${stock} unit(s) of ${product.name} are available`,
          },
          { status: 409 }
        )
      }

      const price =
        variant?.price ??
        product.salePrice ??
        product.price

      const total = price * item.quantity

      subtotal += total

      couponItems.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        category: product.category,
      })

      orderItems.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity: item.quantity,
        price,
        costPrice: product.costPrice ?? null,
        total,
      })
    }

    const shippingSettings =
      await prisma.setting.findMany({
        where: {
          key: {
            in: [
              "freeShippingThreshold",
              "standardShipping",
              "expressShipping",
              "taxRate",
            ],
          },
        },
      })

    const shippingValues: Record<
      string,
      number
    > = {
      freeShippingThreshold: 5000,
      standardShipping: 250,
      expressShipping: 500,
      taxRate: 0,
    }

    for (const setting of shippingSettings) {
      shippingValues[setting.key] =
        Number(setting.value)
    }

    const shipping =
      deliveryMethod === "express"
        ? shippingValues.expressShipping
        : subtotal >=
            shippingValues.freeShippingThreshold
          ? 0
          : shippingValues.standardShipping

    if (
      Math.abs(
        shipping - shippingInput
      ) > 0.01 ||
      Math.abs(
        subtotal - subtotalInput
      ) > 0.01
    ) {
      return NextResponse.json(
        {
          error:
            "Cart total changed. Please review your order and try again.",
        },
        { status: 409 }
      )
    }

    const orderNumber =
      await makeOrderNumber()

    const order = await prisma.$transaction(
      async (tx) => {
        let userId = sessionUserId

        if (userId) {
          const current = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
          })
          if (!current) {
            throw new Error("Your session is no longer valid. Please sign in again.")
          }
        } else {
          const existing = await tx.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true },
          })
          if (existing) {
            throw new Error("An account already uses this email. Please sign in before placing this order.")
          }
          const created = await tx.user.create({
            data: { email, name, role: "CUSTOMER" },
            select: { id: true },
          })
          userId = created.id
        }

        let discount = 0
        let appliedCoupon: any = null

        if (couponCode) {
          appliedCoupon =
            await tx.coupon.findUnique({
              where: {
                code: couponCode,
              },
            })

          if (!appliedCoupon) {
            throw new Error(
              "Invalid coupon code"
            )
          }

          // Serialize coupon claims so per-customer limits cannot be raced by
          // two simultaneous checkout transactions.
          await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "Coupon" WHERE "id" = ${appliedCoupon.id} FOR UPDATE
          `
          appliedCoupon = await tx.coupon.findUnique({
            where: { id: appliedCoupon.id },
          })
          if (!appliedCoupon) throw new Error("Invalid coupon code")

          const existingCustomerUsage =
            await tx.couponUsage.count({
              where: {
                couponId:
                  appliedCoupon.id,
                userId,
              },
            })

          if (
            appliedCoupon.perCustomer !=
              null &&
            existingCustomerUsage >=
              appliedCoupon.perCustomer
          ) {
            throw new Error(
              "You have reached the usage limit for this coupon"
            )
          }

          if (
            appliedCoupon.usageLimit !=
              null &&
            appliedCoupon.usedCount >=
              appliedCoupon.usageLimit
          ) {
            throw new Error(
              "This coupon has reached its usage limit"
            )
          }

          const result =
            calculateCouponDiscount(
              appliedCoupon,
              couponItems
            )

          discount = result.discount

          if (
            appliedCoupon.usageLimit !=
            null
          ) {
            const claimed =
              await tx.coupon.updateMany({
                where: {
                  id: appliedCoupon.id,
                  active: true,
                  usedCount: {
                    lt:
                      appliedCoupon.usageLimit,
                  },
                },
                data: {
                  usedCount: {
                    increment: 1,
                  },
                },
              })

            if (claimed.count !== 1) {
              throw new Error(
                "This coupon has just reached its usage limit"
              )
            }
          } else {
            await tx.coupon.update({
              where: {
                id: appliedCoupon.id,
              },
              data: {
                usedCount: {
                  increment: 1,
                },
              },
            })
          }
        }

        const savedAddress =
          await tx.address.create({
            data: {
              userId,
              name,
              phone,
              address: addressLine,
              city,
              province,
              postal,
              default: false,
            },
          })

        for (const item of orderItems) {
          if (item.variantId) {
            const current =
              await tx.productVariant.findUnique(
                {
                  where: {
                    id: item.variantId,
                  },
                  select: {
                    stock: true,
                  },
                }
              )

            if (
              !current ||
              current.stock < item.quantity
            ) {
              throw new Error(
                "Stock changed while placing the order"
              )
            }

            const changed = await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })
            if (changed.count !== 1) throw new Error("Stock changed while placing the order")

            await tx.inventoryMovement.create(
              {
                data: {
                  productId:
                    item.productId,
                  variantId:
                    item.variantId,
                  change:
                    -item.quantity,
                  beforeStock:
                    current.stock,
                  afterStock:
                    current.stock -
                    item.quantity,
                  reason:
                    "Order sale",
                  note: orderNumber,
                },
              }
            )
          } else {
            const current =
              await tx.product.findUnique({
                where: {
                  id: item.productId,
                },
                select: {
                  stock: true,
                },
              })

            if (
              !current ||
              current.stock < item.quantity
            ) {
              throw new Error(
                "Stock changed while placing the order"
              )
            }

            const changed = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })
            if (changed.count !== 1) throw new Error("Stock changed while placing the order")

            await tx.inventoryMovement.create(
              {
                data: {
                  productId:
                    item.productId,
                  change:
                    -item.quantity,
                  beforeStock:
                    current.stock,
                  afterStock:
                    current.stock -
                    item.quantity,
                  reason:
                    "Order sale",
                  note: orderNumber,
                },
              }
            )
          }
        }

        const taxRate = Math.min(100, Math.max(0, shippingValues.taxRate || 0))
        const tax = Math.round(Math.max(0, subtotal - discount) * taxRate) / 100
        const total = Math.max(0, subtotal - discount + shipping + tax)

        if (Math.abs(tax - taxInput) > 0.01 || Math.abs(total - totalInput) > 0.01) {
          throw new Error("Cart total changed. Please review your order and try again.")
        }

        const createdOrder =
          await tx.order.create({
            data: {
              orderNumber,
              userId,
              addressId:
                savedAddress.id,
              subtotal,
              discount,
              shipping,
              tax,
              total,
              couponCode:
                appliedCoupon?.code ??
                null,
              paymentMethod: "COD",
              paymentStatus: "UNPAID",
              status: "PENDING",
              notes:
                deliveryMethod ===
                "express"
                  ? "Express delivery"
                  : "Standard delivery",
              items: {
                create: orderItems,
              },
            },
            select: {
              id: true,
              orderNumber: true,
              total: true,
              discount: true,
              status: true,
            },
          })

        await tx.orderEvent.create({
          data: {
            orderId: createdOrder.id,
            actorId: userId,
            event: "ORDER_CREATED",
            message: "Customer placed a new Cash on Delivery order.",
            metadata: { orderNumber, paymentMethod: "COD", total },
          },
        })

        await tx.auditLog.create({
          data: {
            actorId: userId,
            action: "CREATE_ORDER",
            entityType: "Order",
            entityId: createdOrder.id,
            details: { orderNumber, total, itemCount: orderItems.length },
          },
        })

        if (appliedCoupon) {
          await tx.couponUsage.create({
            data: {
              couponId:
                appliedCoupon.id,
              userId,
              orderId:
                createdOrder.id,
            },
          })
        }

        return createdOrder
      }
    )

    const notificationResults = await Promise.allSettled([
      sendOrderStatusEmail({
        to: email,
        customerName: name,
        orderNumber: order.orderNumber,
        status: "PENDING",
      }),
      sendNewOrderAdminEmail({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        orderNumber: order.orderNumber,
        total: order.total,
        address: addressLine,
        city,
        province,
      }),
    ])
    notificationResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(index === 0 ? "Customer order email failed" : "Admin order notification failed", result.reason)
      }
    })

    return NextResponse.json(
      order,
      { status: 201 }
    )
  } catch (error) {
    console.error(
      "Error creating order:",
      error
    )

    const message = error instanceof Error ? error.message : ""
    const safeMessages = new Set([
      "Invalid coupon code",
      "This coupon is inactive",
      "This coupon is not active yet",
      "This coupon has expired",
      "This coupon has reached its usage limit",
      "This coupon has just reached its usage limit",
      "You have reached the usage limit for this coupon",
      "Stock changed while placing the order",
      "Your session is no longer valid. Please sign in again.",
      "An account already uses this email. Please sign in before placing this order.",
      "Cart total changed. Please review your order and try again.",
    ])
    return NextResponse.json(
      { error: safeMessages.has(message) ? message : "Failed to place order. Please try again." },
      { status: message === "Stock changed while placing the order" ? 409 : 400 }
    )
  }
}