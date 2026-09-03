import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditCouponForm from "./form"

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } })
  if (!coupon) notFound()
  return <EditCouponForm coupon={coupon} />
}
