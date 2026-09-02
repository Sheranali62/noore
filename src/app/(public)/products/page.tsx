import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { ProductFilters } from "@/components/product/product-filters"
import { ProductSort } from "@/components/product/product-sort"

type PageProps = {
  searchParams?: {
    category?: string
    sort?: string
    page?: string
  }
}

type Product = {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  category: string
  stock: number
}

type Category = {
  category: string
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const category = searchParams?.category || ""
  const sort = searchParams?.sort || "newest"
  const page = parseInt(searchParams?.page || "1")
  const perPage = 12

  const where: any = { status: "ACTIVE" }
  if (category && category !== "all") where.category = category

  let orderBy: any = {}
  switch (sort) {
    case "newest": orderBy = { createdAt: "desc" }; break
    case "price-low": orderBy = { price: "asc" }; break
    case "price-high": orderBy = { price: "desc" }; break
    case "best-selling": orderBy = { stock: "desc" }; break
    default: orderBy = { createdAt: "desc" }
  }

  const totalCount = await prisma.product.count({ where })
  const totalPages = Math.ceil(totalCount / perPage)

  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: (page - 1) * perPage,
    take: perPage,
  })

  const categories = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { category: true },
    distinct: ["category"],
  })

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="bg-charcoal text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-editorial text-4xl font-semibold">All Products</h1>
          <p className="text-white/60 mt-2">{totalCount} products available</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-cream p-6 sticky top-20">
              <ProductFilters 
                categories={categories.map((c: Category) => c.category)} 
                currentCategory={category} 
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Sort */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-secondary hidden md:block">
                Showing {products.length} of {totalCount} products
              </p>
              <ProductSort currentSort={sort} />
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-cream">
                <p className="text-secondary">No products found in this category</p>
                <Link href="/products" className="inline-block mt-4 bg-charcoal text-white px-6 py-3 rounded-md font-medium hover:bg-charcoal/80 transition">
                  View All Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    salePrice={product.salePrice}
                    image={product.images[0] || "/placeholder.jpg"}
                    category={product.category}
                    stock={product.stock}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const params = new URLSearchParams()
                  params.set("page", String(p))
                  if (category && category !== "all") params.set("category", category)
                  if (sort) params.set("sort", sort)
                  
                  return (
                    <a
                      key={p}
                      href={`/products?${params.toString()}`}
                      className={`px-4 py-2 rounded-md border transition ${
                        p === page
                          ? "bg-charcoal text-white border-charcoal"
                          : "border-cream hover:border-charcoal hover:bg-charcoal/5"
                      }`}
                    >
                      {p}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}