import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRODUCT_MANAGER",
] as const

const DEFAULT_ROOT_CATEGORIES = [
  { name: "Women", slug: "women", sortOrder: 1 },
  { name: "Men", slug: "men", sortOrder: 2 },
  { name: "Kids", slug: "kids", sortOrder: 3 },
  { name: "Luxury", slug: "luxury", sortOrder: 4 },
  { name: "Accessories", slug: "accessories", sortOrder: 5 },
]

async function ensureDefaultRootCategories() {
  for (const item of DEFAULT_ROOT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: item.name, parentId: null },
      select: { id: true },
    })

    if (existing) continue

    let slug = item.slug
    const slugOwner = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (slugOwner) slug = `${item.slug}-department`

    await prisma.category.create({
      data: {
        name: item.name,
        slug,
        parentId: null,
        active: true,
        sortOrder: item.sortOrder,
      },
    })
  }
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value
  return fallback
}

function toSortOrder(value: unknown) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.trunc(number)
}

export async function GET() {
  const { response } = await requireAdmin(ADMIN_ROLES)

  if (response) {
    return response
  }

  try {
    await ensureDefaultRootCategories()

    const categories = await prisma.category.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        active: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,

        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        },

        _count: {
          select: {
            children: true,
          },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Get categories error:", error)

    return NextResponse.json(
      {
        error: "Failed to load categories",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(ADMIN_ROLES)

  if (response) {
    return response
  }

  try {
    const body = await request.json()

    const name = String(body.name ?? "").trim()

    const slugInput = String(body.slug ?? "").trim()

    const slug = makeSlug(
      slugInput || name
    )

    const parentId =
      body.parentId === null ||
      body.parentId === undefined ||
      String(body.parentId).trim() === ""
        ? null
        : String(body.parentId).trim()

    const description =
      String(body.description ?? "").trim() || null

    const active = toBoolean(
      body.active,
      true
    )

    const sortOrder = toSortOrder(
      body.sortOrder
    )

    if (!name) {
      return NextResponse.json(
        {
          error: "Category name is required",
        },
        {
          status: 400,
        }
      )
    }

    if (!slug) {
      return NextResponse.json(
        {
          error: "A valid category name is required",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Validate parent.
     */

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: {
          id: parentId,
        },

        select: {
          id: true,
        },
      })

      if (!parent) {
        return NextResponse.json(
          {
            error: "Parent category not found",
          },
          {
            status: 400,
          }
        )
      }
    }

    /*
     * Slugs must be globally unique because the Prisma schema
     * has a unique constraint on Category.slug.
     */

    const duplicateSlug =
      await prisma.category.findUnique({
        where: {
          slug,
        },

        select: {
          id: true,
          name: true,
        },
      })

    if (duplicateSlug) {
      return NextResponse.json(
        {
          error:
            "A category with this name/slug already exists",
        },
        {
          status: 409,
        }
      )
    }

    /*
     * Prevent duplicate category names under the same parent.
     *
     * This still allows:
     *
     * Women
     *   > Formal
     *
     * Men
     *   > Formal
     */

    const sameParentName =
      await prisma.category.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },

          parentId,
        },

        select: {
          id: true,
          name: true,
        },
      })

    if (sameParentName) {
      return NextResponse.json(
        {
          error:
            "A category with this name already exists under this parent",
        },
        {
          status: 409,
        }
      )
    }

    const category =
      await prisma.category.create({
        data: {
          name,
          slug,
          description,
          parentId,
          active,
          sortOrder,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true,
          active: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,

          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
            },
          },

          _count: {
            select: {
              children: true,
            },
          },
        },
      })

    return NextResponse.json(
      category,
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error("Create category error:", error)

    return NextResponse.json(
      {
        error: "Failed to create category",
      },
      {
        status: 500,
      }
    )
  }
}