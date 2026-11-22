import { prisma } from "@/lib/prisma"
import InventoryWorkspace from "@/components/admin/inventory-workspace"

export const dynamic = "force-dynamic"

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      stock: true,
      lowStock: true,
      status: true,
    },
  })

  return <InventoryWorkspace initialProducts={products} />
}
