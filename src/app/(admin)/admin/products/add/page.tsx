import ProductForm from "@/components/admin/product-form"

export default function AddProductPage() {
  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-secondary">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold">Add Product</h1>
        <p className="mt-2 text-sm text-secondary">Create a complete product record with merchandising, inventory and SEO data.</p>
      </div>
      <ProductForm mode="create" />
    </div>
  )
}
