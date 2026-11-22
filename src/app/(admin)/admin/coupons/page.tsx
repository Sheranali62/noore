import CouponsWorkspace from "@/components/admin/coupons-workspace"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })
  return (
    <CouponsWorkspace
      coupons={coupons.map((coupon) => ({
        ...coupon,
        startDate: coupon.startDate.toISOString(),
        expiryDate: coupon.expiryDate.toISOString(),
      }))}
    />
  )
}
