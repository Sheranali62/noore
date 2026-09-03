import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function InventoryHistoryPage() {
  const movements = await (prisma as any).inventoryMovement.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, sku: true } }, variant: { select: { color: true, size: true, sku: true } } } })
  return <div className="space-y-6">
    <div><Link href="/admin/inventory" className="text-sm text-secondary">← Inventory</Link><h1 className="font-editorial text-4xl mt-3">Stock History</h1><p className="text-sm text-secondary mt-2">Latest inventory movements and audit trail.</p></div>
    <div className="bg-white border border-cream overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream"><tr>{["Date","Product","Variant","Change","Before","After","Reason","Note"].map(h=><th key={h} className="text-left p-4 font-medium">{h}</th>)}</tr></thead><tbody>{movements.map((m: any)=><tr key={m.id} className="border-t border-cream"><td className="p-4 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td><td className="p-4"><div className="font-medium">{m.product.name}</div><div className="text-xs text-secondary">{m.product.sku}</div></td><td className="p-4">{m.variant ? `${m.variant.color} / ${m.variant.size}` : "Base stock"}</td><td className={`p-4 font-semibold ${m.change > 0 ? "text-green-700" : "text-red-700"}`}>{m.change > 0 ? "+" : ""}{m.change}</td><td className="p-4">{m.beforeStock}</td><td className="p-4">{m.afterStock}</td><td className="p-4">{m.reason}</td><td className="p-4 text-secondary">{m.note || "—"}</td></tr>)}</tbody></table></div></div>
  </div>
}
