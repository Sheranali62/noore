import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { stock: "asc" }, where: { status: "ACTIVE" } })
  const lowStockProducts = products.filter(p => p.stock < 5)
  const outOfStockProducts = products.filter(p => p.stock === 0)

  return <div className="admin-page space-y-7">
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="admin-eyebrow">Operations / Stock control</p><h1 className="admin-title">Inventory</h1><p className="admin-subtitle">Monitor stock health and jump straight to product updates.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/inventory/history" className="admin-button-secondary">History</Link><a href="/api/admin/reports?type=inventory" className="admin-button-primary">Export CSV</a></div>
    </header>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Stat label="Total products" value={products.length} hint="Active catalog" />
      <Stat label="Low stock" value={lowStockProducts.length} hint="Below 5 units" tone="amber" />
      <Stat label="Out of stock" value={outOfStockProducts.length} hint="Needs attention" tone="red" />
    </div>

    <section className="admin-surface overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6"><div><h2 className="text-sm font-semibold text-white">Stock overview</h2><p className="mt-1 text-xs text-white/45">Sorted from lowest available stock.</p></div><span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/55">{products.length} SKUs</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px]"><thead><tr className="border-b border-white/10 bg-white/[0.025] text-left text-[10px] uppercase tracking-[0.16em] text-white/40"><th className="px-6 py-4">Product</th><th className="px-6 py-4">SKU</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody>{products.length===0 ? <tr><td colSpan={5} className="px-6 py-16 text-center"><p className="font-medium text-white">No products in inventory</p><p className="mt-1 text-sm text-white/45">Your active products will appear here.</p></td></tr> : products.map(product => <tr key={product.id} className="border-b border-white/[0.07] last:border-0 hover:bg-white/[0.025]"><td className="px-6 py-5"><p className="font-medium text-white">{product.name}</p></td><td className="px-6 py-5 font-mono text-xs text-white/45">{product.sku}</td><td className="px-6 py-5"><span className={`text-lg font-semibold ${product.stock===0?"text-red-300":product.stock<5?"text-amber-300":"text-white"}`}>{product.stock}</span></td><td className="px-6 py-5">{product.stock===0?<Badge tone="red">Out of stock</Badge>:product.stock<5?<Badge tone="amber">Low stock</Badge>:<Badge tone="green">In stock</Badge>}</td><td className="px-6 py-5 text-right"><Link href={`/admin/products/edit/${product.id}`} className="text-sm font-medium text-white underline decoration-white/20 underline-offset-4 hover:decoration-white">Update stock</Link></td></tr>)}</tbody></table></div>
    </section>
  </div>
}

function Stat({label,value,hint,tone="default"}:{label:string;value:number;hint:string;tone?:string}) { const valueClass=tone==="red"?"text-red-300":tone==="amber"?"text-amber-300":"text-white"; return <div className="admin-surface"><p className="admin-eyebrow">{label}</p><p className={`mt-3 text-3xl font-semibold ${valueClass}`}>{value}</p><p className="mt-1 text-xs text-white/40">{hint}</p></div> }
function Badge({children,tone}:{children:React.ReactNode;tone:string}) { const c=tone==="red"?"border-red-400/20 bg-red-400/10 text-red-200":tone==="amber"?"border-amber-400/20 bg-amber-400/10 text-amber-200":"border-emerald-400/20 bg-emerald-400/10 text-emerald-200"; return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${c}`}>{children}</span> }
