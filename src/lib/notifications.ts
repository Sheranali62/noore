export type OrderNotificationStatus = "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"

const labels: Record<OrderNotificationStatus, string> = {
  CONFIRMED: "confirmed", PROCESSING: "being prepared", PACKED: "packed", SHIPPED: "shipped", OUT_FOR_DELIVERY: "out for delivery", DELIVERED: "delivered", CANCELLED: "cancelled",
}

export async function sendOrderStatusEmail(input: { to: string; customerName?: string | null; orderNumber: string; status: OrderNotificationStatus; trackingNumber?: string | null; courier?: string | null }) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) return { sent: false, skipped: true, reason: "Email provider is not configured" }
  const site = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const subject = `NOORÉ Order #${input.orderNumber} is ${labels[input.status]}`
  const tracking = input.trackingNumber ? `<p><strong>Tracking:</strong> ${input.trackingNumber}${input.courier ? ` (${input.courier})` : ""}</p>` : ""
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="font-family:Georgia,serif">NOORÉ</h1><p>Dear ${input.customerName || "Customer"},</p><p>Your order <strong>#${input.orderNumber}</strong> is now <strong>${labels[input.status]}</strong>.</p>${tracking}<p>You can view your order from your account: <a href="${site}/account/orders">My Orders</a></p><p>Thank you for shopping with NOORÉ.</p></div>`
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.to], subject, html }) })
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`)
  return { sent: true, skipped: false }
}
