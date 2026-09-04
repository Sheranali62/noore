import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calculateCouponDiscount } from "@/lib/coupons"
import { randomBytes } from "crypto"
import { sendOrderStatusEmail } from "@/lib/notifications"

export const dynamic = "force-dynamic"

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

async function makeOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const value = `NO-${new Date().getFullYear()}-${randomBytes(4)
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
  try {
    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get("orderNumber")?.trim()
    const email = normalizeEmail(searchParams.get("email"))

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Order number and email are required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
        address: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    if (normalizeEmail(order.user?.email) !== email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error tracking order:", error)

    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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
      !email ||
      !email.includes("@") ||
      !phone ||
      !addressLine ||
      !city ||
      !province ||
      !postal ||
      !items.length
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

    const subtotalInput = Number(body.subtotal)
    const shippingInput = Number(body.shipping)

    if (
      !Number.isFinite(subtotalInput) ||
      !Number.isFinite(shippingInput)
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
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      return NextResponse.json(
        { error: "Invalid cart items" },
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
        let userId = session?.user?.id

        if (userId) {
          const current =
            await tx.user.findUnique({
              where: {
                id: userId,
              },
              select: {
                id: true,
              },
            })

          if (!current) {
            userId = undefined
          }
        }

        if (!userId) {
          const existing =
            await tx.user.findUnique({
              where: {
                email,
              },
              select: {
                id: true,
              },
            })

          if (existing) {
            userId = existing.id
          } else {
            const created =
              await tx.user.create({
                data: {
                  email,
                  name,
                  role: "CUSTOMER",
                },
                select: {
                  id: true,
                },
              })

            userId = created.id
          }
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

            await tx.productVariant.update({
              where: {
                id: item.variantId,
              },
              data: {
                stock: {
                  decrement:
                    item.quantity,
                },
              },
            })

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

            await tx.product.update({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  decrement:
                    item.quantity,
                },
              },
            })

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

        const total = Math.max(
          0,
          subtotal -
            discount +
            shipping
        )

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

    void sendOrderStatusEmail({
      to: email,
      customerName: name,
      orderNumber:
        order.orderNumber,
      status: "PENDING",
    }).catch((err) =>
      console.error(
        "Order confirmation email failed",
        err
      )
    )

    return NextResponse.json(
      order,
      { status: 201 }
    )
  } catch (error) {
    console.error(
      "Error creating order:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Failed to place order. Please try again."

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}