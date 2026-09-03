import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "CONTENT_MANAGER",
] as const

export async function requireAdmin(roles?: readonly string[]) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role

  if (!session?.user || !role || !STAFF_ROLES.includes(role as typeof STAFF_ROLES[number])) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (roles && !roles.includes(role)) {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session, response: null }
}
