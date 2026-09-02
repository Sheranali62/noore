import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Coupons</h1>
        <Link href="/admin/coupons/add" className="bg-charcoal text-white px-4 py-2 rounded hover:bg-charcoal/80 transition">
          + Add Coupon
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Code</th>
                <th className="text-left p-4 text-sm font-medium">Type</th>
                <th className="text-left p-4 text-sm font-medium">Value</th>
                <th className="text-left p-4 text-sm font-medium">Min Order</th>
                <th className="text-left p-4 text-sm font-medium">Uses</th>
                <th className="text-left p-4 text-sm font-medium">Expires</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-secondary">
                    No coupons created yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-cream hover:bg-cream/50 transition">
                    <td className="p-4 font-medium">#{coupon.code}</td>
                    <td className="p-4 text-secondary">{coupon.type}</td>
                    <td className="p-4">
                      {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `PKR ${coupon.value}`}
                    </td>
                    <td className="p-4">PKR {coupon.minOrder.toLocaleString()}</td>
                    <td className="p-4">{coupon.usedCount} / {coupon.usageLimit || "∞"}</td>
                    <td className="p-4 text-secondary">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${coupon.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {coupon.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}