import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import ReviewsWorkspace from "@/components/admin/reviews-workspace"

export const dynamic = "force-dynamic"

export default async function AdminReviewsPage() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (guard.response) return null

  const [pending, approved, featured, reviews, rating] = await Promise.all([
    prisma.productReview.count({ where: { approved: false } }),
    prisma.productReview.count({ where: { approved: true } }),
    prisma.productReview.count({ where: { featured: true } }),
    prisma.productReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.productReview.aggregate({ _avg: { rating: true } }),
  ])

  return (
    <ReviewsWorkspace
      initialReviews={reviews.map(review => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
      }))}
      counts={{
        pending,
        approved,
        featured,
        average: rating._avg.rating ?? 0,
      }}
    />
  )
}
