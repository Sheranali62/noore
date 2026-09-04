import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const guard = await requireAdmin([
    "SUPER_ADMIN",
    "ADMIN",
    "PRODUCT_MANAGER",
  ])

  if (guard.response) {
    return guard.response
  }

  try {
    const body = await request.json()

    const productId = String(body.productId ?? "")
    const variantId = body.variantId
      ? String(body.variantId)
      : null
    const change = Number(body.change)
    const reason =
      String(body.reason ?? "Manual adjustment").trim() ||
      "Manual adjustment"
    const note =
      String(body.note ?? "").trim() || null

    if (
      !productId ||
      !Number.isInteger(change) ||
      change === 0
    ) {
      return NextResponse.json(
        {
          error:
            "A non-zero whole-number stock change is required",
        },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const product =
          await tx.product.findUnique({
            where: {
              id: productId,
            },
            select: {
              id: true,
              stock: true,
            },
          })

        if (!product) {
          throw new Error("NOT_FOUND")
        }

        if (variantId) {
          const variant =
            await tx.productVariant.findFirst({
              where: {
                id: variantId,
                productId,
              },
              select: {
                id: true,
                stock: true,
              },
            })

          if (!variant) {
            throw new Error(
              "VARIANT_NOT_FOUND"
            )
          }

          const after =
            variant.stock + change

          if (after < 0) {
            throw new Error(
              "NEGATIVE_STOCK"
            )
          }

          await tx.productVariant.update({
            where: {
              id: variant.id,
            },
            data: {
              stock: after,
            },
          })

          await tx.inventoryMovement.create({
            data: {
              productId,
              variantId,
              change,
              beforeStock:
                variant.stock,
              afterStock: after,
              reason,
              note,
            },
          })

          return {
            beforeStock:
              variant.stock,
            afterStock: after,
            variantId,
          }
        }

        const after =
          product.stock + change

        if (after < 0) {
          throw new Error(
            "NEGATIVE_STOCK"
          )
        }

        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stock: after,
          },
        })

        await tx.inventoryMovement.create({
          data: {
            productId,
            change,
            beforeStock:
              product.stock,
            afterStock: after,
            reason,
            note,
          },
        })

        return {
          beforeStock:
            product.stock,
          afterStock: after,
          variantId: null,
        }
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Adjustment failed"

    if (message === "NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 }
      )
    }

    if (
      message === "VARIANT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Variant not found",
        },
        { status: 404 }
      )
    }

    if (
      message === "NEGATIVE_STOCK"
    ) {
      return NextResponse.json(
        {
          error:
            "Stock cannot become negative",
        },
        { status: 409 }
      )
    }

    console.error(
      "Inventory adjustment error",
      error
    )

    return NextResponse.json(
      {
        error: "Adjustment failed",
      },
      { status: 500 }
    )
  }
}