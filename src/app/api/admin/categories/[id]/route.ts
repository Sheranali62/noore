import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRODUCT_MANAGER",
] as const

function makeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toSortOrder(
  value: unknown,
  fallback: number
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.trunc(number)
}

/**
 * Checks whether assigning candidateParentId as the
 * parent of categoryId would create a circular tree.
 *
 * Example:
 *
 * Women
 *   └── Formal
 *       └── Wedding
 *
 * We must prevent:
 *
 * Women -> Wedding
 * while Wedding is already below Women.
 */
async function wouldCreateCycle(
  categoryId: string,
  candidateParentId: string
): Promise<boolean> {
  let currentId: string | null = candidateParentId

  const visited = new Set<string>()

  while (currentId !== null) {
    if (currentId === categoryId) {
      return true
    }

    if (visited.has(currentId)) {
      return true
    }

    visited.add(currentId)

    const parentRecord: {
      parentId: string | null
    } | null = await prisma.category.findUnique({
      where: {
        id: currentId,
      },
      select: {
        parentId: true,
      },
    })

    if (parentRecord === null) {
      return false
    }

    currentId = parentRecord.parentId
  }

  return false
}

/**
 * PATCH
 *
 * Edit:
 * - name
 * - slug
 * - description
 * - parent
 * - active status
 * - sort order
 */
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string
    }
  }
) {
  const { response } = await requireAdmin(
    ADMIN_ROLES
  )

  if (response) {
    return response
  }

  try {
    const categoryId = params.id

    if (!categoryId) {
      return NextResponse.json(
        {
          error: "Category ID is required",
        },
        {
          status: 400,
        }
      )
    }

    const current =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      })

    if (!current) {
      return NextResponse.json(
        {
          error: "Category not found",
        },
        {
          status: 404,
        }
      )
    }

    const body = await request.json()

    /*
     * NAME
     */
    const name =
      body.name === undefined
        ? current.name
        : String(body.name ?? "").trim()

    /*
     * SLUG
     */
    const slugInput =
      body.slug === undefined
        ? current.slug
        : String(body.slug ?? "").trim()

    const slug = makeSlug(
      slugInput || name
    )

    /*
     * PARENT
     */
    let parentId: string | null

    if (
      body.parentId === undefined ||
      body.parentId === null ||
      String(body.parentId).trim() === ""
    ) {
      parentId = null
    } else {
      parentId = String(
        body.parentId
      ).trim()
    }

    /*
     * DESCRIPTION
     */
    const description =
      body.description === undefined
        ? current.description
        : String(
            body.description ?? ""
          ).trim() || null

    /*
     * ACTIVE
     */
    let active: boolean

    if (body.active === undefined) {
      active = current.active
    } else if (
      body.active === true ||
      body.active === "true"
    ) {
      active = true
    } else {
      active = false
    }

    /*
     * SORT ORDER
     */
    const sortOrder =
      body.sortOrder === undefined
        ? current.sortOrder
        : toSortOrder(
            body.sortOrder,
            current.sortOrder
          )

    /*
     * VALIDATE NAME
     */
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

    /*
     * VALIDATE SLUG
     */
    if (!slug) {
      return NextResponse.json(
        {
          error:
            "A valid category name is required",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * CATEGORY CANNOT BE ITS OWN PARENT
     */
    if (parentId === categoryId) {
      return NextResponse.json(
        {
          error:
            "A category cannot be its own parent",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * VALIDATE PARENT EXISTS
     */
    if (parentId) {
      const parent =
        await prisma.category.findUnique({
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
            error:
              "Parent category not found",
          },
          {
            status: 400,
          }
        )
      }

      /*
       * PREVENT CIRCULAR TREE
       */
      const cycle =
        await wouldCreateCycle(
          categoryId,
          parentId
        )

      if (cycle) {
        return NextResponse.json(
          {
            error:
              "Invalid parent category. This would create a circular category structure.",
          },
          {
            status: 400,
          }
        )
      }
    }

    /*
     * CHECK GLOBAL SLUG DUPLICATE
     */
    const duplicateSlug =
      await prisma.category.findFirst({
        where: {
          slug,
          NOT: {
            id: categoryId,
          },
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
     * CHECK DUPLICATE NAME UNDER SAME PARENT
     *
     * This allows:
     *
     * Women
     *   └── Formal
     *
     * Men
     *   └── Formal
     *
     * But prevents:
     *
     * Women
     *   ├── Formal
     *   └── Formal
     */
    const duplicateName =
      await prisma.category.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          parentId,
          NOT: {
            id: categoryId,
          },
        },
        select: {
          id: true,
          name: true,
        },
      })

    if (duplicateName) {
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

    /*
     * UPDATE
     */
    const category =
      await prisma.category.update({
        where: {
          id: categoryId,
        },

        data: {
          name,
          slug,
          parentId,
          description,
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

    return NextResponse.json(category)
  } catch (error) {
    console.error(
      "Update category error:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to update category",
      },
      {
        status: 500,
      }
    )
  }
}

/**
 * DELETE
 *
 * A category can only be deleted when it has
 * no children.
 *
 * This prevents accidentally orphaning a whole
 * category tree.
 */
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string
    }
  }
) {
  const { response } = await requireAdmin(
    ADMIN_ROLES
  )

  if (response) {
    return response
  }

  try {
    const categoryId = params.id

    if (!categoryId) {
      return NextResponse.json(
        {
          error: "Category ID is required",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * FIND CATEGORY
     */
    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
          name: true,
        },
      })

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found",
        },
        {
          status: 404,
        }
      )
    }

    /*
     * CHECK CHILDREN
     */
    const childCount =
      await prisma.category.count({
        where: {
          parentId: categoryId,
        },
      })

    if (childCount > 0) {
      return NextResponse.json(
        {
          error:
            `Cannot delete "${category.name}" because it has ${childCount} child categor${
              childCount === 1
                ? "y"
                : "ies"
            }. Move or delete its children first.`,
        },
        {
          status: 409,
        }
      )
    }

    /*
     * DELETE
     */
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    })

    return NextResponse.json({
      message:
        "Category deleted successfully",
    })
  } catch (error) {
    console.error(
      "Delete category error:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to delete category",
      },
      {
        status: 500,
      }
    )
  }
}