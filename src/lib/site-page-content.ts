import { prisma } from "@/lib/prisma"
import { DEFAULT_PAGE_CONTENT, normalizePageContent, type PageContentMap } from "@/lib/site-page-content-defaults"
export { DEFAULT_PAGE_CONTENT, normalizePageContent } from "@/lib/site-page-content-defaults"
export type { EditablePage, PageContent, PageContentMap } from "@/lib/site-page-content-defaults"

const valid = (v: unknown, max=500) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max
(input: unknown): PageContentMap {
 const raw=input && typeof input==="object" ? input as Record<string,unknown> : {}
 const result={...DEFAULT_PAGE_CONTENT}
 for (const key of Object.keys(DEFAULT_PAGE_CONTENT) as EditablePage[]) {
  const candidate=raw[key]
  if (!candidate || typeof candidate!=="object" || Array.isArray(candidate)) continue
  const row=candidate as Record<string,unknown>
  const next={...DEFAULT_PAGE_CONTENT[key]}
  for (const field of Object.keys(next) as (keyof PageContent)[]) {
   const value=row[field]
   if (!valid(value, field==="buttonUrl"?180:500)) continue
   if(field==="buttonUrl") {const url=value.trim();if((url.startsWith("/")&&!url.startsWith("//"))||url.toLowerCase().startsWith("https://"))next[field]=url}
   else next[field]=value.trim()
  }
  result[key]=next
 }
 return result
}
export async function getPageContent(): Promise<PageContentMap> {
 const row=await prisma.setting.findUnique({where:{key:"site_page_content"},select:{value:true}})
 try{return normalizePageContent(row?.value?JSON.parse(row.value):{})}catch{return DEFAULT_PAGE_CONTENT}
}
