ximport { prisma } from "@/lib/prisma"

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 12,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-editorial text-3xl font-semibold mb-2">All Products</h1>
      <p className="text-secondary mb-8">{products.length} products</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border border-cream rounded-lg overflow-hidden hover:shadow-lg transition">
            <div className="aspect-[3/4] bg-cream">
              {product.images[0] && (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <p className="text-xs text-secondary">{product.category}</p>
              <h3 className="font-medium text-sm truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold">PKR {product.price.toLocaleString()}</span>
                {product.salePrice && (
                  <span className="text-xs text-secondary line-through">
                    PKR {product.salePrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}