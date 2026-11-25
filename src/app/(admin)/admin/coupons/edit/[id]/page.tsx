import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { notFound } from "next/navigation"
import EditCouponForm from "./form"

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdmin(["SUPER_ADMIN","ADMIN"])
  if (access.response) notFound()

  const coupon = await prisma.coupon.findUnique({ where: { id: (await params).id } })
  if (!coupon) notFound()
  return <EditCouponForm coupon={coupon} />
}
