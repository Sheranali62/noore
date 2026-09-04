import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function InventoryHistoryPage() {
  const guard = await requireAdmin([
    "SUPER_ADMIN",
    "ADMIN",
    "PRODUCT_MANAGER",
  ])

  if (guard.response) return null

  const movements = await prisma.inventoryMovement.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    include: {
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
      variant: {
        select: {
          color: true,
          size: true,
        },
      },
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin/inventory"
            className="text-sm text-secondary hover:underline"
          >
            ← Inventory
          </Link>

          <p className="text-xs uppercase tracking-[0.2em] text-secondary mt-5">
            Operations
          </p>

          <h1 className="text-3xl font-semibold mt-2">
            Inventory history
          </h1>
        </div>

        <span className="text-sm text-secondary">
          Last 100 movements
        </span>
      </div>

      <div className="bg-white border border-cream rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-cream">
              <tr>
                {[
                  "Product",
                  "Change",
                  "Before → After",
                  "Reason",
                  "User",
                  "Date",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="text-left p-4 text-sm font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-secondary"
                  >
                    No inventory movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-t border-cream"
                  >
                    <td className="p-4">
                      <p className="font-medium">
                        {movement.product.name}
                      </p>

                      <p className="text-xs text-secondary">
                        {movement.product.sku}

                        {movement.variant
                          ? ` · ${movement.variant.color} / ${movement.variant.size}`
                          : ""}
                      </p>
                    </td>

                    <td
                      className={`p-4 font-semibold ${
                        movement.change > 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {movement.change > 0 ? "+" : ""}
                      {movement.change}
                    </td>

                    <td className="p-4">
                      {movement.beforeStock} → {movement.afterStock}
                    </td>

                    <td className="p-4">
                      <p>{movement.reason}</p>

                      {movement.note && (
                        <p className="text-xs text-secondary mt-1">
                          {movement.note}
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-sm">
                      System
                    </td>

                    <td className="p-4 text-sm text-secondary">
                      {movement.createdAt.toLocaleString()}
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