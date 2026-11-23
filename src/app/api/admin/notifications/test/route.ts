import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { sendNooreEmailConnectionTest } from "@/lib/notifications"

export async function POST() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response

  const recipient = process.env.ADMIN_ORDER_EMAIL || process.env.EMAIL_FROM
  if (!recipient) {
    return NextResponse.json(
      { sent: false, error: "Admin notification recipient is not configured" },
      { status: 503 }
    )
  }

  try {
    const result = await sendNooreEmailConnectionTest(recipient)
    return NextResponse.json({ sent: result.sent, skipped: result.skipped ?? false })
  } catch (error) {
    console.error("NOORE email connection test failed", error)
    return NextResponse.json(
      { sent: false, error: "Email provider rejected or could not send the test message" },
      { status: 502 }
    )
  }
}
