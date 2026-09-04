import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
export const dynamic="force-dynamic"
function csv(rows:string[][]){ return rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n") }
export async function GET(request:NextRequest){ const guard=await requireAdmin(); if(guard.response) return guard.response; const type=request.nextUrl.searchParams.get("type")||"sales"; const since=new Date(); since.setDate(since.getDate()-30)
 let rows:string[][]=[]
 if(type==="customers"){ const users=await prisma.user.findMany({where:{role:"CUSTOMER"},orderBy:{createdAt:"desc"},take:1000,include:{orders:{select:{total:true,status:true}}}}); rows=[["Name","Email","Orders","Total Spent","Joined"],...users.map(u=>[u.name||"",u.email,String(u.orders.length),String(u.orders.filter(o=>!['CANCELLED','REFUNDED'].includes(o.status)).reduce((a,o)=>a+o.total,0)),u.createdAt.toISOString()])] }
 else if(type==="inventory"){ const products=await prisma.product.findMany({where:{status:"ACTIVE"},orderBy:{stock:"asc"}}); rows=[["Product","SKU","Stock","Low Stock","Price","Status"],...products.map(p=>[p.name,p.sku,String(p.stock),String(p.lowStock),String(p.salePrice??p.price),p.stock===0?"OUT_OF_STOCK":p.stock<=p.lowStock?"LOW_STOCK":"IN_STOCK"])] }
 else { const orders=await prisma.order.findMany({where:{createdAt:{gte:since}},orderBy:{createdAt:"desc"},take:5000,include:{user:{select:{name:true,email:true}}}}); rows=[["Order","Customer","Email","Status","Payment","Subtotal","Discount","Shipping","Total","Date"],...orders.map(o=>[o.orderNumber,o.user?.name||"",o.user?.email||"",o.status,o.paymentMethod,o.subtotal.toFixed(2),o.discount.toFixed(2),o.shipping.toFixed(2),o.total.toFixed(2),o.createdAt.toISOString()])] }
 return new NextResponse(csv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename=noore-${type}-report.csv`}})
}
