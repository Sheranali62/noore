import { PrismaClient } from '@prisma/client'

const ACTIVE_STATUS = 'ACTIVE' as const

const prisma = new PrismaClient()

async function main() {
  const products = [
    // Women - Unstitched
    {
      name: 'Noor Lawn Edit',
      slug: 'noor-lawn-edit',
      sku: 'NL-001',
      description: 'Premium lawn fabric with delicate floral embroidery.',
      category: 'Women',
      subcategory: 'Unstitched',
      price: 2499,
      salePrice: 1999,
      stock: 50,
      images: ['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Aab-e-Rang Lawn',
      slug: 'aab-e-rang-lawn',
      sku: 'AR-002',
      description: 'Luxurious lawn fabric with intricate thread work.',
      category: 'Women',
      subcategory: 'Unstitched',
      price: 3799,
      salePrice: 2999,
      stock: 35,
      images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Zara Embroidered Lawn',
      slug: 'zara-embroidered-lawn',
      sku: 'ZE-003',
      description: 'Hand-embroidered lawn suit with elegant cutwork.',
      category: 'Women',
      subcategory: 'Unstitched',
      price: 4299,
      salePrice: 3599,
      stock: 20,
      images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    // Women - Ready to Wear
    {
      name: 'Mehr Embroidered Suit',
      slug: 'mehr-embroidered-suit',
      sku: 'ME-004',
      description: 'Ready-to-wear embroidered suit with elegant neckline.',
      category: 'Women',
      subcategory: 'Ready to Wear',
      price: 3499,
      salePrice: 2799,
      stock: 30,
      images: ['https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Aira Cotton Co-Ord',
      slug: 'aira-cotton-co-ord',
      sku: 'AC-005',
      description: 'Modern cotton co-ord set with contemporary silhouette.',
      category: 'Women',
      subcategory: 'Ready to Wear',
      price: 2999,
      stock: 45,
      images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Zoya Printed Set',
      slug: 'zoya-printed-set',
      sku: 'ZY-006',
      description: 'Beautiful printed 3-piece set with dupatta.',
      category: 'Women',
      subcategory: '3 Piece',
      price: 4599,
      salePrice: 3899,
      stock: 25,
      images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    // Luxury
    {
      name: 'Rania Silk Pret',
      slug: 'rania-silk-pret',
      sku: 'RN-007',
      description: 'Exclusive silk pret with hand-embellished details.',
      category: 'Luxury',
      subcategory: 'Luxury Pret',
      price: 7999,
      salePrice: 6999,
      stock: 15,
      images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Luxe Embroidered Ensemble',
      slug: 'luxe-embroidered-ensemble',
      sku: 'LE-008',
      description: 'Handcrafted luxury ensemble with intricate zari work.',
      category: 'Luxury',
      subcategory: 'Embroidered',
      price: 12999,
      salePrice: 10999,
      stock: 8,
      images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    // Men
    {
      name: 'Meher Kurta',
      slug: 'meher-kurta',
      sku: 'MK-009',
      description: 'Classic men\'s kurta in premium cotton fabric.',
      category: 'Men',
      subcategory: 'Stitched',
      price: 1999,
      stock: 40,
      images: ['https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: "Men's Shalwar Kameez",
      slug: 'mens-shalwar-kameez',
      sku: 'MS-010',
      description: 'Traditional shalwar kameez with modern fit.',
      category: 'Men',
      subcategory: 'Stitched',
      price: 2999,
      salePrice: 2599,
      stock: 30,
      images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    // Accessories
    {
      name: 'Nooré Signature Tote',
      slug: 'noore-signature-tote',
      sku: 'NS-012',
      description: 'Elegant leather tote bag for everyday style.',
      category: 'Accessories',
      subcategory: 'Bags',
      price: 2499,
      stock: 35,
      images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Embroidered Clutch',
      slug: 'embroidered-clutch',
      sku: 'EC-013',
      description: 'Hand-embroidered clutch for special occasions.',
      category: 'Accessories',
      subcategory: 'Bags',
      price: 1899,
      stock: 20,
      images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
    {
      name: 'Silk Scarf',
      slug: 'silk-scarf',
      sku: 'SS-014',
      description: 'Luxurious silk scarf with elegant prints.',
      category: 'Accessories',
      subcategory: 'Scarves',
      price: 999,
      stock: 50,
      images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop&crop=center'],
      status: ACTIVE_STATUS,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    })
  }

  console.log(`✅ Seeded ${products.length} products successfully!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })