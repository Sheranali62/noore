import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const clean = (value: unknown) => typeof value === "string" ? value.trim() : ""

function isCrossSite(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (request.headers.get("sec-fetch-site") === "cross-site") return true
  if (!origin) return false
  try {
    return new URL(origin).origin !== request.nextUrl.origin
  } catch {
    return true
  }
}

function addressData(body: any) {
  return {
    name: clean(body.name),
    phone: clean(body.phone),
    address: clean(body.address),
    city: clean(body.city),
    province: clean(body.province),
    postal: clean(body.postal),
    default: Boolean(body.default),
  }
}

function validAddress(data: ReturnType<typeof addressData>) {
  return Boolean(
    data.name && data.name.length <= 100 &&
    data.phone && data.phone.length <= 32 &&
    data.address && data.address.length <= 300 &&
    data.city && data.city.length <= 100 &&
    data.province && data.province.length <= 100 &&
    data.postal && data.postal.length <= 24
  )
}

async function readJson(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return { error: "A JSON request body is required.", status: 415 as const }
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > 16 * 1024) return { error: "Address request is too large.", status: 413 as const }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid address request.", status: 400 as const }
  }
  return { body }
}

async function lockUser(tx: any, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ default: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ addresses }, { headers: { "Cache-Control": "private, no-store, max-age=0" } })
}

export async function POST(request: NextRequest) {
  if (isCrossSite(request)) return NextResponse.json({ error: "Cross-site address updates are not allowed." }, { status: 403 })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "address-change", 20, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit

  try {
    const parsed = await readJson(request)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    const data = addressData(parsed.body)
    if (!validAddress(data)) return NextResponse.json({ error: "Please complete all address fields with valid lengths." }, { status: 400 })

    const result = await prisma.$transaction(async tx => {
      await lockUser(tx, session.user.id)
      const count = await tx.address.count({ where: { userId: session.user.id } })
      if (count >= 10) throw new Error("ADDRESS_LIMIT")
      if (data.default) await tx.address.updateMany({ where: { userId: session.user.id }, data: { default: false } })
      return tx.address.create({
        data: { ...data, userId: session.user.id, default: data.default || count === 0 },
      })
    })
    return NextResponse.json(
      { address: result },
      { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "ADDRESS_LIMIT") {
      return NextResponse.json({ error: "You can save up to 10 addresses." }, { status: 409 })
    }
    console.error("Address creation failed", error)
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (isCrossSite(request)) return NextResponse.json({ error: "Cross-site address updates are not allowed." }, { status: 403 })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "address-change", 20, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit

  try {
    const parsed = await readJson(request)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    const id = clean(parsed.body.id)
    if (!id || id.length > 128) return NextResponse.json({ error: "A valid address ID is required." }, { status: 400 })
    const data = addressData(parsed.body)
    if (!validAddress(data)) return NextResponse.json({ error: "Please complete all address fields with valid lengths." }, { status: 400 })

    const result = await prisma.$transaction(async tx => {
      await lockUser(tx, session.user.id)
      const existing = await tx.address.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
      if (!existing) throw new Error("ADDRESS_NOT_FOUND")
      if (data.default) await tx.address.updateMany({ where: { userId: session.user.id, NOT: { id } }, data: { default: false } })
      return tx.address.update({ where: { id }, data })
    })
    return NextResponse.json(
      { address: result },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") {
      return NextResponse.json({ error: "Address not found." }, { status: 404 })
    }
    console.error("Address update failed", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (isCrossSite(request)) return NextResponse.json({ error: "Cross-site address updates are not allowed." }, { status: 403 })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "address-change", 20, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit

  try {
    const parsed = await readJson(request)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    const id = clean(parsed.body.id)
    if (!id || id.length > 128) return NextResponse.json({ error: "A valid address ID is required." }, { status: 400 })

    await prisma.$transaction(async tx => {
      await lockUser(tx, session.user.id)
      const address = await tx.address.findFirst({ where: { id, userId: session.user.id } })
      if (!address) throw new Error("ADDRESS_NOT_FOUND")
      const used = await tx.order.count({ where: { addressId: id } })
      if (used > 0) throw new Error("ADDRESS_IN_USE")
      await tx.address.delete({ where: { id } })
      if (address.default) {
        const next = await tx.address.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } })
        if (next) await tx.address.update({ where: { id: next.id }, data: { default: true } })
      }
    })
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } })
  } catch (error) {
    if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") {
      return NextResponse.json({ error: "Address not found." }, { status: 404 })
    }
    if (error instanceof Error && error.message === "ADDRESS_IN_USE") {
      return NextResponse.json({ error: "This address is linked to an order and cannot be deleted." }, { status: 409 })
    }
    console.error("Address deletion failed", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}
