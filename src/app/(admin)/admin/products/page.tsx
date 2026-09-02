import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Products</h1>
        <Link href="/admin/products/add" className="bg-charcoal text-white px-4 py-2 rounded hover:bg-charcoal/80 transition">
          + Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Name</th>
                <th className="text-left p-4 text-sm font-medium">Category</th>
                <th className="text-left p-4 text-sm font-medium">Price</th>
                <th className="text-left p-4 text-sm font-medium">Stock</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-secondary">
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-cream hover:bg-cream/50 transition">
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4 text-secondary">{product.category}</td>
                    <td className="p-4">PKR {product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={product.stock < 5 ? "text-red-600" : "text-green-600"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        product.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/products/edit/${product.id}`} className="text-blue-600 hover:text-blue-800 mr-3">
                        Edit
                      </Link>
                      <button className="text-red-600 hover:text-red-800">Delete</button>
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