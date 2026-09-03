import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!name || !email) return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })

    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: session.user.id } } })
    if (existing) return NextResponse.json({ error: "That email is already in use" }, { status: 409 })

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile update failed", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
