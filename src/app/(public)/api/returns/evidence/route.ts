import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ error: "Evidence storage is not configured." }, { status: 503 })

  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 })
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Use JPG, PNG, WebP or AVIF images." }, { status: 415 })
    if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: "Each image must be smaller than 8 MB." }, { status: 413 })

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-70)
    const pathname = `noore/returns/${session.user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName || `evidence.${extension}`}`
    const uploaded = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "x-api-version": "7", "x-content-type": file.type, "x-allow-overwrite": "false" },
      body: await file.arrayBuffer(),
      cache: "no-store",
    })
    const result = await uploaded.json().catch(() => null)
    if (!uploaded.ok || !result?.url) {
      console.error("NOORE return evidence upload rejected", uploaded.status)
      return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 502 })
    }
    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error("NOORE return evidence upload failed", error)
    return NextResponse.json({ error: "Unable to upload this image." }, { status: 500 })
  }
}
