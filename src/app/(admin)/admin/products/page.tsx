import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { variants: { select: { id: true, color: true, size: true, stock: true } } },
  })

  const active = products.filter(product => product.status === "ACTIVE").length
  const drafts = products.filter(product => product.status === "DRAFT").length
  const lowStock = products.filter(product => product.stock > 0 && product.stock <= product.lowStock).length
  const outOfStock = products.filter(product => product.stock === 0).length

  return (
    <div className="max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-secondary">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold">Products</h1>
          <p className="mt-2 text-sm text-secondary">Manage the complete NOORÉ catalog, variants, pricing and inventory.</p>
        </div>
        <Link href="/admin/products/add" className="rounded bg-charcoal px-5 py-3 text-sm text-white hover:bg-charcoal/90">+ Add Product</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <Stat label="Total catalog" value={products.length} />
        <Stat label="Active" value={active} />
        <Stat label="Drafts" value={drafts} />
        <Stat label="Stock alerts" value={lowStock + outOfStock} detail={`${lowStock} low · ${outOfStock} out`} />
      </div>

      <div className="overflow-hidden rounded-xl border border-cream bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-cream/70">
              <tr>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Product</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Category</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Price</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Variants</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Stock</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <p className="font-medium">No products are visible in this production database.</p>
                    <p className="mt-2 text-sm text-secondary">If your catalog was already entered, do not re-enter it. Check that Vercel is using the same production DATABASE_URL as the database where the catalog was saved.</p>
                    <Link href="/admin/settings" className="mt-5 inline-block text-sm underline">Open store settings</Link>
                  </td>
                </tr>
              ) : products.map(product => {
                const currentPrice = product.salePrice ?? product.price
                const stockClass = product.stock === 0 ? "text-red-700" : product.stock <= product.lowStock ? "text-amber-700" : "text-green-700"
                return (
                  <tr key={product.id} className="border-t border-cream hover:bg-cream/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-12 overflow-hidden rounded bg-cream shrink-0">
                          {product.images[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[280px]">{product.name}</p>
                          <p className="text-xs text-secondary mt-1">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm"><p>{product.category}</p><p className="text-xs text-secondary mt-1">{product.subcategory || product.type || "—"}</p></td>
                    <td className="p-4 text-sm"><p>PKR {currentPrice.toLocaleString()}</p>{product.salePrice !== null && <p className="text-xs text-secondary line-through">PKR {product.price.toLocaleString()}</p>}</td>
                    <td className="p-4 text-sm"><p>{product.variants.length}</p>{product.variants.length > 0 && <p className="text-xs text-secondary mt-1">{Array.from(new Set(product.variants.map(v => v.color))).slice(0, 3).join(" · ")}</p>}</td>
                    <td className={`p-4 text-sm font-medium ${stockClass}`}>{product.stock}</td>
                    <td className="p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product.status === "ACTIVE" ? "bg-green-100 text-green-800" : product.status === "DRAFT" ? "bg-gray-100 text-gray-800" : product.status === "OUT_OF_STOCK" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{product.status.replaceAll("_", " ")}</span></td>
                    <td className="p-4 whitespace-nowrap"><Link href={`/admin/products/edit/${product.id}`} className="text-sm text-blue-700 hover:underline mr-4">Edit</Link><DeleteProductButton id={product.id} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return <div className="rounded-xl border border-cream bg-white p-5"><p className="text-xs uppercase tracking-wider text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p>{detail && <p className="mt-1 text-xs text-secondary">{detail}</p>}</div>
}
