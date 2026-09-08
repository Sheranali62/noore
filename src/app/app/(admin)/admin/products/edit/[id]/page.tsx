import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProductForm, { ProductFormData } from "@/components/admin/product-form"

export const dynamic = "force-dynamic"

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  })

  if (!product) notFound()

  const initialData: ProductFormData = {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description || "",
    category: product.category,
    subcategory: product.subcategory || "",
    collection: product.collection || "",
    gender: product.gender || "",
    type: product.type || "",
    fabric: product.fabric || "",
    pieces: product.pieces?.toString() || "",
    costPrice: product.costPrice?.toString() || "",
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() || "",
    stock: product.stock.toString(),
    lowStock: product.lowStock.toString(),
    status: product.status,
    video: product.video || "",
    tags: product.tags.join(", "),
    seoTitle: product.seoTitle || "",
    seoDesc: product.seoDesc || "",
    images: product.images.length ? product.images : [""],
  }

  const initialVariants = product.variants.map(variant => ({
    id: variant.id,
    color: variant.color,
    size: variant.size,
    sku: variant.sku,
    price: variant.price?.toString() || "",
    stock: variant.stock.toString(),
    images: variant.images,
  }))

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-secondary">Catalog / Edit</p>
        <h1 className="mt-2 text-3xl font-semibold">Edit Product</h1>
        <p className="mt-2 text-sm text-secondary">Update the full product record without dropping existing merchandising fields.</p>
      </div>
      <ProductForm mode="edit" productId={product.id} initialData={initialData} initialVariants={initialVariants} />
    </div>
  )
}
