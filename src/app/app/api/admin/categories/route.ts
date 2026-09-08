import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRODUCT_MANAGER",
] as const

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

const DEFAULT_DEPARTMENT_CATEGORIES = {
  Women: [
    "Saree",
    "Shalwar Kameez",
    "2 Piece",
    "3 Piece",
    "Kurta",
    "Kurtis",
    "Suits",
    "Lawn",
    "Chiffon",
    "Linen",
    "Cambric",
    "Formal Wear",
    "Party Wear",
    "Casual Wear",
    "Pret",
    "Unstitched",
    "Dupattas",
    "Shawls",
    "Bottoms",
    "New Arrivals",
    "Sale",
  ],
  Men: [
    "Shalwar Kameez",
    "Kurta",
    "2 Piece",
    "3 Piece",
    "Waistcoats",
    "Prince Coats",
    "Suits",
    "Formal Wear",
    "Casual Wear",
    "Unstitched",
    "Kameez",
    "Shalwar",
    "Trousers",
    "Jackets",
    "Festive Wear",
    "New Arrivals",
    "Sale",
  ],
  Kids: [
    "Girls Shalwar Kameez",
    "Girls 2 Piece",
    "Girls 3 Piece",
    "Girls Kurtis",
    "Girls Festive Wear",
    "Boys Shalwar Kameez",
    "Boys Kurta",
    "Boys Waistcoats",
    "Boys 2 Piece",
    "Girls Casual",
    "Boys Casual",
    "Formal",
    "Festive",
    "New Arrivals",
    "Sale",
  ],
} as const

async function ensureDefaultDepartmentCategories() {
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
  })

  const rootByName = new Map(roots.map((root) => [root.name.toLowerCase(), root]))

  for (const [department, children] of Object.entries(DEFAULT_DEPARTMENT_CATEGORIES)) {
    let root = rootByName.get(department.toLowerCase())

    if (!root) {
      const baseSlug = makeSlug(department)
      let slug = baseSlug
      let suffix = 2

      while (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${baseSlug}-${suffix++}`
      }

      root = await prisma.category.create({
        data: {
          name: department,
          slug,
          parentId: null,
          active: true,
          sortOrder: Object.keys(DEFAULT_DEPARTMENT_CATEGORIES).indexOf(department),
        },
        select: { id: true, name: true },
      })
      rootByName.set(department.toLowerCase(), root)
    }

    for (let index = 0; index < children.length; index += 1) {
      const childName = children[index]
      const existing = await prisma.category.findFirst({
        where: {
          parentId: root.id,
          name: { equals: childName, mode: "insensitive" },
        },
        select: { id: true },
      })

      if (existing) continue

      const baseSlug = makeSlug(`${department}-${childName}`)
      let slug = baseSlug
      let suffix = 2

      while (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${baseSlug}-${suffix++}`
      }

      await prisma.category.create({
        data: {
          name: childName,
          slug,
          parentId: root.id,
          active: true,
          sortOrder: index,
        },
      })
    }
  }
}

export async function GET() {
  const { response } = await requireAdmin(ADMIN_ROLES)

  if (response) {
    return response
  }

  try {
    await ensureDefaultDepartmentCategories()

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