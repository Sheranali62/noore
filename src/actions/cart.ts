"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addToCart(productId: string, variantId?: string, quantity = 1) {
  const session = await auth()
  if (!session?.user) return { success: false, message: "Please log in to add to cart" }
  if (!Number.isInteger(quantity) || quantity < 1) return { success: false, message: "Invalid quantity" }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, stock: true, status: true } })
  if (!product || product.status !== "ACTIVE") return { success: false, message: "Product is unavailable" }

  if (variantId) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId }, select: { stock: true } })
    if (!variant || variant.stock < quantity) return { success: false, message: "Insufficient stock" }
  } else if (product.stock < quantity) {
    return { success: false, message: "Insufficient stock" }
  }

  let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } })
  if (!cart) cart = await prisma.cart.create({ data: { userId: session.user.id } })

  const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId, variantId: variantId || null } })
  const newQuantity = (existing?.quantity || 0) + quantity
  const available = variantId
    ? (await prisma.productVariant.findUnique({ where: { id: variantId }, select: { stock: true } }))?.stock || 0
    : product.stock
  if (newQuantity > available) return { success: false, message: "Requested quantity exceeds stock" }

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } })
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId || null, quantity } })
  }
  revalidatePath("/cart")
  return { success: true }
}

export async function removeFromCart(itemId: string) {
  const session = await auth()
  if (!session?.user) return { success: false, message: "Please log in" }
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId: session.user.id } }, select: { id: true } })
  if (!item) return { success: false, message: "Cart item not found" }
  await prisma.cartItem.delete({ where: { id: item.id } })
  revalidatePath("/cart")
  return { success: true }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const session = await auth()
  if (!session?.user) return { success: false, message: "Please log in" }
  if (!Number.isInteger(quantity)) return { success: false, message: "Invalid quantity" }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId: session.user.id } },
    include: { product: { select: { stock: true } }, variant: { select: { stock: true } } },
  })
  if (!item) return { success: false, message: "Cart item not found" }
  if (quantity <= 0) return removeFromCart(itemId)

  const available = item.variant?.stock ?? item.product.stock
  if (quantity > available) return { success: false, message: "Requested quantity exceeds stock" }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
  revalidatePath("/cart")
  return { success: true }
}
