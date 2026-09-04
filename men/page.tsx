import { prisma } from "@/lib/prisma"
import { EditorialLanding } from "@/components/home/editorial-landing"
export const dynamic = "force-dynamic"
export default async function MenPage() {
  const rows = await prisma.product.findMany({ where: { status: "ACTIVE", gender: { in: ["Men", "MEN", "men"] } }, orderBy: { createdAt: "desc" }, take: 12, include: { variants: { select: { color: true }, distinct: ["color"] } } })
  return <EditorialLanding eyebrow="NOORÉ / Men" title="Refined dressing, without the noise." description="Clean silhouettes, considered fabrics and timeless Pakistani menswear for every setting." image="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=2200&auto=format&fit=crop" href="/products?gender=Men" products={rows.map(p => ({...p, colors: p.variants.map(v => v.color)}))} />
}
