"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addToCart(productId: string, variantId?: string, quantity: number = 1) {
  const session = await auth()
  if (!session?.user) {
    // For guests, we handle on client via local storage, but we can also create a guest cart.
    // We'll just return a message.
    return { success: false, message: "Please log in to add to cart" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { cart: true },
  })
  if (!user) return { success: false, message: "User not found" }

  let cart = user.cart
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } })
  }

  // Check existing item
  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId || null,
    },
  })

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
      },
    })
  }

  revalidatePath("/cart")
  return { success: true }
}

export async function removeFromCart(itemId: string) {
  // ...
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  // ...
}