import { CouponType } from "@prisma/client"

export type CouponCartItem = {
  productId: string
  quantity: number
  price: number
  category?: string
}

export type CouponResult = {
  code: string
  discount: number
  eligibleSubtotal: number
  message: string
}

export function calculateCouponDiscount(coupon: {
  code: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount: number | null
  startDate: Date
  expiryDate: Date
  active: boolean
  applicableCategories: string[]
  applicableProductIds: string[]
}, items: CouponCartItem[], now = new Date()): CouponResult {
  const code = coupon.code.trim().toUpperCase()
  if (!coupon.active) throw new Error("This coupon is inactive")
  if (now < coupon.startDate) throw new Error("This coupon is not active yet")
  if (now > coupon.expiryDate) throw new Error("This coupon has expired")

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (subtotal < coupon.minOrder) {
    throw new Error(`Minimum order value is PKR ${coupon.minOrder.toLocaleString()}`)
  }

  const categorySet = new Set(coupon.applicableCategories.map(v => v.trim().toLowerCase()).filter(Boolean))
  const productSet = new Set(coupon.applicableProductIds.map(v => v.trim()).filter(Boolean))
  const restricted = categorySet.size > 0 || productSet.size > 0

  const eligibleItems = restricted
    ? items.filter(item => productSet.has(item.productId) || (!!item.category && categorySet.has(item.category.trim().toLowerCase())))
    : items

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (eligibleSubtotal <= 0) throw new Error("This coupon does not apply to the items in your cart")

  let discount = coupon.type === "PERCENTAGE"
    ? eligibleSubtotal * (coupon.value / 100)
    : coupon.value

  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount)
  discount = Math.max(0, Math.min(discount, eligibleSubtotal, subtotal))

  return {
    code,
    discount: Math.round(discount * 100) / 100,
    eligibleSubtotal,
    message: `${code} applied successfully`,
  }
}
