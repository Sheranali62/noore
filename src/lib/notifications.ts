export type OrderNotificationStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED"

const labels: Record<OrderNotificationStatus, string> = {
  PENDING: "received",
  CONFIRMED: "confirmed",
  PROCESSING: "being prepared",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out for delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
  REFUNDED: "refunded",
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character)
}

function emailConfig() {
  return {
    key: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    site: (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://noore-nine.vercel.app").replace(/\/$/, ""),
  }
}

async function sendEmail(payload: { to: string; subject: string; html: string; text: string }) {
  const { key, from } = emailConfig()
  if (!key || !from) return { sent: false, skipped: true, reason: "Email provider is not configured" }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [payload.to], subject: payload.subject, html: payload.html, text: payload.text }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Email provider returned ${response.status}: ${detail.slice(0, 300)}`)
  }
  return { sent: true, skipped: false }
}

export async function sendOrderStatusEmail(input: {
  to: string
  customerName?: string | null
  orderNumber: string
  status: OrderNotificationStatus
  trackingNumber?: string | null
  courier?: string | null
}) {
  const { site } = emailConfig()
  const name = escapeHtml(input.customerName?.trim() || "Customer")
  const order = escapeHtml(input.orderNumber)
  const status = labels[input.status]
  const tracking = input.trackingNumber
    ? `<p style="margin:16px 0;color:#4b463e"><strong>Tracking number:</strong> ${escapeHtml(input.trackingNumber)}${input.courier ? ` · ${escapeHtml(input.courier)}` : ""}</p>`
    : ""
  const trackingUrl = `${site}/order-tracking`
  const subject = `NOORÉ · Order #${input.orderNumber} is ${status}`
  const html = `<div style="background:#f5f1e9;padding:32px 12px;font-family:Arial,sans-serif;color:#24211c"><div style="max-width:580px;margin:auto;background:#fff;padding:36px;border:1px solid #e7dfd2"><p style="font-family:Georgia,serif;font-size:30px;letter-spacing:5px;margin:0 0 28px;color:#171615">NOORÉ</p><p style="font-size:14px;color:#6c6254">ORDER UPDATE</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px">Your order is ${status}</h1><p>Dear ${name},</p><p>Your order <strong>#${order}</strong> is now ${status}. We’ll keep you informed as it moves through our delivery process.</p>${tracking}<p style="margin:28px 0"><a href="${trackingUrl}" style="display:inline-block;background:#c6a15b;color:#171615;padding:14px 22px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1px">TRACK YOUR ORDER</a></p><p style="font-size:12px;color:#786f63;line-height:1.7">Thank you for shopping with NOORÉ. If you need help, reply to this email or contact our support team.</p></div></div>`
  const text = `Dear ${input.customerName || "Customer"}, your NOORÉ order #${input.orderNumber} is ${status}.${input.trackingNumber ? ` Tracking number: ${input.trackingNumber}.` : ""} Track your order: ${trackingUrl}`
  return sendEmail({ to: input.to, subject, html, text })
}

export async function sendNewOrderAdminEmail(input: {
  customerName: string
  customerEmail: string
  customerPhone: string
  orderNumber: string
  total: number
  address: string
  city: string
  province: string
}) {
  const { from, site } = emailConfig()
  const recipient = process.env.ADMIN_ORDER_EMAIL || from
  if (!recipient) return { sent: false, skipped: true, reason: "Store notification recipient is not configured" }
  const order = escapeHtml(input.orderNumber)
  const name = escapeHtml(input.customerName)
  const email = escapeHtml(input.customerEmail)
  const phone = escapeHtml(input.customerPhone)
  const address = escapeHtml(`${input.address}, ${input.city}, ${input.province}`)
  const subject = `New NOORÉ order · #${input.orderNumber}`
  const html = `<div style="background:#f5f1e9;padding:32px 12px;font-family:Arial,sans-serif;color:#24211c"><div style="max-width:580px;margin:auto;background:#fff;padding:36px;border:1px solid #e7dfd2"><p style="font-family:Georgia,serif;font-size:28px;letter-spacing:5px;margin:0 0 24px">NOORÉ</p><p style="font-size:12px;letter-spacing:2px;color:#927345">NEW ORDER RECEIVED</p><h1 style="font-family:Georgia,serif;font-size:27px;font-weight:400">Order #${order}</h1><p><strong>Customer:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Delivery address:</strong><br/>${address}</p><p style="font-size:20px;border-top:1px solid #e7dfd2;padding-top:18px"><strong>Total due (COD): PKR ${input.total.toLocaleString("en-PK")}</strong></p><p style="margin-top:26px"><a href="${site}/admin/orders" style="display:inline-block;background:#c6a15b;color:#171615;padding:14px 22px;text-decoration:none;font-size:12px;font-weight:bold">OPEN ADMIN ORDERS</a></p></div></div>`
  const text = `New NOORÉ order #${input.orderNumber}. Customer: ${input.customerName}; Email: ${input.customerEmail}; Phone: ${input.customerPhone}; Address: ${input.address}, ${input.city}, ${input.province}; COD total: PKR ${input.total.toLocaleString("en-PK")}. Admin: ${site}/admin/orders`
  return sendEmail({ to: recipient, subject, html, text })
}

export async function sendSupportTicketEmail(input: {
  to: string
  ticketId: string
  subject: string
  message: string
  staffReply: boolean
}) {
  const { site, from } = emailConfig()
  if (!from) return { sent: false, skipped: true, reason: "Email provider is not configured" }
  const subject = input.staffReply ? `NOORÉ Support · Reply to ${input.subject}` : `New NOORÉ support request · ${input.subject}`
  const link = input.staffReply ? `${site}/account/support` : `${site}/admin/support`
  const body = escapeHtml(input.message.slice(0, 5000))
  const html = `<div style="background:#f5f1e9;padding:32px 12px;font-family:Arial,sans-serif;color:#24211c"><div style="max-width:580px;margin:auto;background:#fff;padding:36px;border:1px solid #e7dfd2"><p style="font-family:Georgia,serif;font-size:28px;letter-spacing:5px">NOORÉ</p><p style="font-size:12px;letter-spacing:2px;color:#927345">CUSTOMER SUPPORT</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:25px">${escapeHtml(input.subject)}</h1><p style="white-space:pre-wrap;line-height:1.7">${body}</p><p style="margin-top:28px"><a href="${link}" style="display:inline-block;background:#535F4C;color:#fff;padding:13px 20px;text-decoration:none;font-size:12px;font-weight:bold">OPEN SUPPORT CENTRE</a></p><p style="font-size:11px;color:#786f63">Ticket reference: ${escapeHtml(input.ticketId)}</p></div></div>`
  const text = `NOORÉ Support: ${input.subject}\n\n${input.message}\n\nOpen: ${link}\nTicket: ${input.ticketId}`
  return sendEmail({ to: input.to, subject, html, text })
}

export async function sendNewsletterWelcomeEmail(input: { to: string; unsubscribeToken: string }) {
  const { site } = emailConfig()
  const unsubscribeUrl = `${site}/newsletter/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`
  const subject = "NOORÉ · Welcome to our world"
  const html = `<div style="background:#f5f1e9;padding:32px 12px;font-family:Arial,sans-serif;color:#24211c"><div style="max-width:580px;margin:auto;background:#fff;padding:36px;border:1px solid #e7dfd2"><p style="font-family:Georgia,serif;font-size:30px;letter-spacing:5px;margin:0 0 28px">NOORÉ</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px">A little more you. A little more NOORÉ.</h1><p>Thank you for joining our world. Look out for considered collections, new arrivals and occasional private offers.</p><p style="margin-top:28px"><a href="${site}/products" style="display:inline-block;background:#535F4C;color:#fff;padding:14px 22px;text-decoration:none;font-size:12px;font-weight:bold">DISCOVER NOORÉ</a></p><p style="margin-top:28px;font-size:11px;color:#786f63">You received this because you subscribed to NOORÉ updates. <a href="${unsubscribeUrl}">Unsubscribe</a>.</p></div></div>`
  const text = `Thank you for joining NOORÉ. Discover the collection at ${site}/products. Unsubscribe: ${unsubscribeUrl}`
  return sendEmail({ to: input.to, subject, html, text })
}

export async function sendAbandonedCartEmail(input: {
  to: string
  customerName?: string | null
  itemCount: number
}) {
  const { site } = emailConfig()
  const name = escapeHtml(input.customerName?.trim() || "Customer")
  const count = Math.max(1, Math.floor(input.itemCount))
  const subject = "NOORÉ · Your saved pieces are waiting"
  const cartUrl = `${site}/cart`
  const html = `<div style="background:#f5f1e9;padding:32px 12px;font-family:Arial,sans-serif;color:#24211c"><div style="max-width:580px;margin:auto;background:#fff;padding:36px;border:1px solid #e7dfd2"><p style="font-family:Georgia,serif;font-size:30px;letter-spacing:5px;margin:0 0 28px;color:#171615">NOORÉ</p><p style="font-size:12px;letter-spacing:2px;color:#927345">A LITTLE REMINDER</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px">Your saved pieces are waiting.</h1><p>Dear ${name},</p><p>You still have ${count} item(s) in your NOORÉ cart. Your selection may change as availability changes, so you can return whenever you are ready.</p><p style="margin:28px 0"><a href="${cartUrl}" style="display:inline-block;background:#535F4C;color:#fff;padding:14px 22px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1px">RETURN TO YOUR CART</a></p><p style="font-size:12px;color:#786f63;line-height:1.7">If you have already placed your order, please disregard this message.</p></div></div>`
  const text = `Dear ${input.customerName || "Customer"}, you still have ${count} item(s) in your NOORÉ cart. Return to your cart: ${cartUrl}`
  return sendEmail({ to: input.to, subject, html, text })
}

export async function sendNooreEmailConnectionTest(to: string) {
  const { site } = emailConfig()
  const subject = "NOORÉ · Email connection test"
  const html = `<div style="background:#f5f1e9;padding:32px 12px;font-family:Arial,sans-serif;color:#24211c"><div style="max-width:580px;margin:auto;background:#fff;padding:36px;border:1px solid #e7dfd2"><p style="font-family:Georgia,serif;font-size:30px;letter-spacing:5px;margin:0 0 28px;color:#171615">NOORÉ</p><p style="font-size:14px;color:#6c6254">EMAIL CONNECTION TEST</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px">Your email service is connected.</h1><p>This is a test message from your NOORÉ store. No customer order was created.</p><p style="font-size:12px;color:#786f63">Store: ${escapeHtml(site)}</p></div></div>`
  const text = "NOORÉ email connection test: Your email service is connected. No customer order was created."
  return sendEmail({ to, subject, html, text })
}
