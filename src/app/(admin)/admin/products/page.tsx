import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/admin"
import ProductsWorkspace, { type AdminProduct } from "@/components/admin/products-workspace"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const access = await requireAdmin(["SUPER_ADMIN","ADMIN","PRODUCT_MANAGER"])
  if (access.response) notFound()

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: { select: { id: true, color: true, size: true, stock: true } },
    },
  })

  const rows: AdminProduct[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    lowStock: product.lowStock,
    status: product.status,
    images: product.images,
    variants: product.variants,
    createdAt: product.createdAt.toISOString(),
  }))

  return <ProductsWorkspace products={rows} />
}
