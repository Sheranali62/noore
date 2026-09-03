import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { InventoryAdjustment } from "@/components/admin/inventory-adjustment"

export const dynamic = "force-dynamic"

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { stock: "asc" },
    include: { variants: { select: { id: true, color: true, size: true, sku: true, stock: true } } },
  })
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.lowStock)
  const outOfStock = products.filter((p) => p.stock === 0)
  const variantCount = products.reduce((sum, p) => sum + p.variants.length, 0)

  return <div className="space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.2em] text-secondary">Operations</p><h1 className="font-editorial text-4xl mt-1">Inventory</h1><p className="text-sm text-secondary mt-2">Monitor stock, variants and every manual adjustment.</p></div>
      <Link href="/admin/inventory/history" className="border border-charcoal px-4 py-2 text-sm hover:bg-charcoal hover:text-white transition">View stock history</Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {[["Products", products.length, ""],["Variants", variantCount, ""],["Low stock", lowStock.length, "text-amber-700"],["Out of stock", outOfStock.length, "text-red-700"]].map(([label,value,cls]) => <div key={label} className="bg-white border border-cream p-5"><p className="text-xs uppercase tracking-wider text-secondary">{label}</p><p className={`text-3xl font-semibold mt-2 ${cls}`}>{value}</p></div>)}
    </div>
    <div className="bg-white border border-cream overflow-hidden">
      <div className="p-5 border-b border-cream flex justify-between"><h2 className="font-medium">Stock overview</h2><span className="text-xs text-secondary">Product stock + variant stock</span></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream"><tr>{["Product","SKU","Stock","Variants","Status","Action"].map(h=><th key={h} className="text-left p-4 font-medium">{h}</th>)}</tr></thead><tbody>
        {products.map((p) => <tr key={p.id} className="border-t border-cream">
          <td className="p-4 font-medium">{p.name}</td><td className="p-4 text-secondary">{p.sku}</td>
          <td className="p-4 font-semibold">{p.stock}</td><td className="p-4">{p.variants.length}</td>
          <td className="p-4">{p.stock === 0 ? <span className="text-red-700">Out of stock</span> : p.stock <= p.lowStock ? <span className="text-amber-700">Low stock</span> : <span className="text-green-700">Healthy</span>}</td>
          <td className="p-4"><div className="flex gap-3"><Link className="underline underline-offset-4" href={`/admin/products/edit/${p.id}`}>Manage</Link><details><summary className="cursor-pointer underline underline-offset-4">Adjust</summary><div className="absolute right-4 z-20 mt-2 w-80"><InventoryAdjustment productId={p.id} variants={p.variants} /></div></details></div></td>
        </tr>)}
      </tbody></table></div>
    </div>
  </div>
}
