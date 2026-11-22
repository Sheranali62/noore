export type CategoryImageProduct = {
  category: string
  subcategory?: string | null
  images: string[]
}

function normalizeCategoryName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim()
}

export function getCategoryImage(
  name: string,
  products: CategoryImageProduct[],
  fallback: string,
) {
  const target = normalizeCategoryName(name)
  const match = products.find((product) => normalizeCategoryName(product.subcategory || "") === target && product.images?.[0])
    || products.find((product) => normalizeCategoryName(product.category || "") === target && product.images?.[0])
  return match?.images?.[0] || fallback
}
