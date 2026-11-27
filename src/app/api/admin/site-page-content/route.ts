import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { normalizePageContent } from "@/lib/site-page-content"

export const dynamic = "force-dynamic"
const KEY = "site_page_content"
export async function GET() {
 const auth=await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER"])
 if(!auth.session)return auth.response
 const row=await prisma.setting.findUnique({where:{key:KEY},select:{value:true}})
 let saved:unknown={}
 try{saved=row?.value?JSON.parse(row.value):{}}catch{}
 return NextResponse.json({pages:normalizePageContent(saved)})
}
export async function PUT(request:Request) {
 const auth=await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER"])
 if(!auth.session)return auth.response
 if(process.env.VERCEL_ENV === "preview") return NextResponse.json({error:"Publishing page content is disabled in preview because it shares production data."},{status:409})
 let body:unknown
 try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON body"},{status:400})}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid page content"},{status:400})
 const pages=normalizePageContent(body)
 await prisma.setting.upsert({where:{key:KEY},create:{key:KEY,value:JSON.stringify(pages)},update:{value:JSON.stringify(pages)}})
 return NextResponse.json({pages,message:"Page content saved and published."})
}
