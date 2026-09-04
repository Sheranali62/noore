import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
export const dynamic="force-dynamic"
export default async function AdminPage(){
 const guard=await requireAdmin(); if(guard.response) return null
 const since=new Date(); since.setDate(since.getDate()-30); const abandonedBefore=new Date(Date.now()-2*60*60*1000)
 const [orders,revenue,customers,activeProducts,pending,units,lowStock,abandoned,wishlist,statuses,top]=await Promise.all([
  prisma.order.count({where:{createdAt:{gte:since}}}),
  prisma.order.aggregate({where:{createdAt:{gte:since},status:{notIn:["CANCELLED","REFUNDED"]}},_sum:{total:true}}),
  prisma.user.count({where:{createdAt:{gte:since},role:"CUSTOMER"}}),
  prisma.product.count({where:{status:"ACTIVE"}}),
  prisma.order.count({where:{status:"PENDING"}}),
  prisma.orderItem.aggregate({where:{order:{createdAt:{gte:since},status:{notIn:["CANCELLED","REFUNDED"]}}},_sum:{quantity:true}}),
  prisma.product.count({where:{status:"ACTIVE",stock:{lte:5}}}),
  prisma.cart.count({where:{updatedAt:{lt:abandonedBefore},items:{some:{}}}}),
  prisma.wishlistItem.count({where:{createdAt:{gte:since}}}),
  prisma.order.groupBy({by:["status"],_count:{_all:true}}),
  prisma.orderItem.groupBy({by:["productId"],_sum:{quantity:true,total:true},orderBy:{_sum:{quantity:"desc"}},take:6}),
 ])
 const names=await prisma.product.findMany({where:{id:{in:top.map(x=>x.productId)}},select:{id:true,name:true}}); const map=Object.fromEntries(names.map(x=>[x.id,x.name]))
 const delivered=statuses.find(s=>s.status==="DELIVERED")?._count._all||0; const avg=orders?((revenue._sum.total||0)/orders):0
 return <div className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-secondary">NOORÉ intelligence</p><h1 className="text-3xl md:text-4xl font-semibold mt-2">Command center</h1><p className="text-secondary mt-1">Live operating metrics for the last 30 days.</p></div><div className="flex gap-2"><Link href="/admin/analytics" className="border border-cream bg-white rounded-lg px-4 py-2 text-sm">Full analytics</Link><a href="/api/admin/reports?type=sales" className="bg-charcoal text-white rounded-lg px-4 py-2 text-sm">Export sales CSV</a></div></div>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[["Revenue",`PKR ${(revenue._sum.total||0).toLocaleString()}`],["Orders",orders],["Average order",`PKR ${Math.round(avg).toLocaleString()}`],["Units sold",units._sum.quantity||0],["New customers",customers],["Delivered",delivered],["Pending COD",pending],["Active products",activeProducts]].map(([l,v])=><div key={String(l)} className="bg-white border border-cream rounded-2xl p-5"><p className="text-xs uppercase tracking-wider text-secondary">{l}</p><p className="text-2xl font-semibold mt-2">{v}</p></div>)}</div>
 <div className="grid lg:grid-cols-3 gap-6"><section className="lg:col-span-2 bg-white border border-cream rounded-2xl p-6"><div className="flex justify-between items-center mb-5"><div><p className="text-xs uppercase tracking-wider text-secondary">Merchandising</p><h2 className="font-editorial text-2xl mt-1">Best sellers</h2></div><Link href="/admin/products" className="text-sm hover:underline">Manage products →</Link></div><div className="space-y-4">{top.length===0?<p className="text-secondary">No order data yet.</p>:top.map((p,i)=><div key={p.productId} className="flex items-center gap-4"><span className="w-6 text-secondary">0{i+1}</span><div className="flex-1"><p className="font-medium">{map[p.productId]||"Unknown"}</p><p className="text-xs text-secondary">{p._sum.quantity||0} units sold</p></div><p className="font-medium">PKR {(p._sum.total||0).toLocaleString()}</p></div>)}</div></section><section className="bg-charcoal text-white rounded-2xl p-6"><p className="text-xs uppercase tracking-wider text-white/60">Attention</p><h2 className="font-editorial text-2xl mt-1">Operations</h2><div className="mt-6 space-y-4 text-sm"><Link href="/admin/inventory" className="flex justify-between border-b border-white/10 pb-3"><span>Low-stock products</span><b>{lowStock}</b></Link><Link href="/admin/orders" className="flex justify-between border-b border-white/10 pb-3"><span>Pending COD orders</span><b>{pending}</b></Link><div className="flex justify-between border-b border-white/10 pb-3"><span>Abandoned carts</span><b>{abandoned}</b></div><div className="flex justify-between border-b border-white/10 pb-3"><span>Wishlist activity</span><b>{wishlist}</b></div><div className="flex justify-between"><span>Searches</span><b></b></div></div></section></div>
 <section className="bg-white border border-cream rounded-2xl p-6"><div className="flex justify-between items-center mb-5"><div><p className="text-xs uppercase tracking-wider text-secondary">Order pipeline</p><h2 className="font-editorial text-2xl mt-1">Status overview</h2></div><Link href="/admin/orders" className="text-sm hover:underline">View orders →</Link></div><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{statuses.map(s=><div key={s.status} className="bg-cream/60 rounded-xl p-4"><p className="text-xs text-secondary">{s.status.replaceAll("_"," ")}</p><p className="text-xl font-semibold mt-1">{s._count._all}</p></div>)}</div></section></div>
}
