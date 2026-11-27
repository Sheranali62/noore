import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { enforceRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])

function matchesImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
      bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d &&
      bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  }
  if (mimeType === "image/avif") {
    if (bytes.length < 16 || String.fromCharCode(...bytes.subarray(4, 8)) !== "ftyp") return false
    const brands = String.fromCharCode(...bytes.subarray(8, Math.min(bytes.length, 64)))
    return brands.includes("avif") || brands.includes("avis")
  }
  return false
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (
    (origin && new URL(origin).origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "Cross-site image uploads are not allowed." }, { status: 403 })
  }
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  if (process.env.VERCEL_ENV === "preview") return NextResponse.json({ error: "Image uploads are disabled in preview because the storage bucket is shared with production." }, { status: 409 })
  const rateLimit = await enforceRateLimit(request, "admin-image-upload", 50, 60 * 60 * 1000, auth.session.user.id)
  if (rateLimit) return rateLimit

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ error: "Image storage is not configured yet." }, { status: 503 })

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > MAX_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "Image upload is too large." }, { status: 413 })
    }
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 })
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Use JPG, PNG, WebP or AVIF images." }, { status: 415 })
    if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be smaller than 8 MB." }, { status: 413 })

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!matchesImageSignature(bytes, file.type)) {
      return NextResponse.json({ error: "The uploaded file does not match its image type." }, { status: 415 })
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
    const pathname = `noore/storefront/${Date.now()}-${crypto.randomUUID()}.${extension}`
    const uploaded = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "x-content-type": file.type,
        "x-allow-overwrite": "false",
      },
      body: bytes,
      cache: "no-store",
    })
    const result = await uploaded.json().catch(() => null)
    if (!uploaded.ok || !result?.url) {
      console.error("NOORE image upload rejected", uploaded.status)
      return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 502 })
    }
    return NextResponse.json(
      { url: result.url, pathname: result.pathname },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("NOORE image upload failed", error)
    return NextResponse.json({ error: "Unable to upload this image." }, { status: 500 })
  }
}
