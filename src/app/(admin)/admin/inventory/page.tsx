import { prisma } from "@/lib/prisma"
import Link from "next/link"  // ← Add this line
export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { stock: "asc" },
    where: { status: "ACTIVE" },
  })

  const lowStockProducts = products.filter(p => p.stock < 5)
  const outOfStockProducts = products.filter(p => p.stock === 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Inventory</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-cream">
          <p className="text-secondary text-sm">Total Products</p>
          <p className="text-2xl font-semibold">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-cream">
          <p className="text-secondary text-sm">Low Stock (&lt;5)</p>
          <p className="text-2xl font-semibold text-amber-600">{lowStockProducts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-cream">
          <p className="text-secondary text-sm">Out of Stock</p>
          <p className="text-2xl font-semibold text-red-600">{outOfStockProducts.length}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Product</th>
                <th className="text-left p-4 text-sm font-medium">SKU</th>
                <th className="text-left p-4 text-sm font-medium">Stock</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-secondary">
                    No products in inventory.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-cream hover:bg-cream/50 transition">
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4 text-secondary">{product.sku}</td>
                    <td className="p-4">
                      <span className={product.stock === 0 ? "text-red-600 font-bold" : product.stock < 5 ? "text-amber-600" : ""}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.stock === 0 ? (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Out of Stock</span>
                      ) : product.stock < 5 ? (
                        <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">In Stock</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/products/edit/${product.id}`} className="text-blue-600 hover:text-blue-800">
                        Update Stock
                      </Link>
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