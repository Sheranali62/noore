"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type Order = {
  orderNumber: string
  status: string
  total: number
  createdAt: string
  paymentMethod: string
  trackingNumber?: string | null
  items: Array<{
    id: string
    quantity: number
    price: number
    total: number
    product: { name: string; images: string[] }
    variant?: { color: string; size: string } | null
  }>
}

const statuses = [
  ["PENDING", "Order placed", "Your order has been received."],
  ["CONFIRMED", "Confirmed", "Your order has been confirmed."],
  ["PROCESSING", "Processing", "Your pieces are being prepared."],
  ["PACKED", "Packed", "Your order has been packed."],
  ["SHIPPED", "Shipped", "Your order is on the way."],
  ["OUT_FOR_DELIVERY", "Out for delivery", "Your order is with the delivery team."],
  ["DELIVERED", "Delivered", "Your order has arrived."],
] as const

export default function OrderTrackingPage() {
  const params = useSearchParams()
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const queryOrder = params.get("orderNumber")
    if (queryOrder) setOrderNumber(queryOrder)
  }, [params])

  const currentIndex = useMemo(() => statuses.findIndex(([status]) => status === order?.status), [order?.status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOrder(null)

    try {
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Order not found")
        return
      }
      setOrder(data.order)
    } catch {
      setError("We could not check your order right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream py-8 md:py-14">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.28em] text-secondary">NOORÉ delivery</p>
          <h1 className="font-editorial text-4xl md:text-5xl mt-2">Track your order</h1>
          <p className="text-secondary mt-3">Enter the order number and email used at checkout to see the latest status.</p>
        </div>

        <div className="bg-white border border-cream rounded-3xl p-5 md:p-7 mt-8">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label className="text-sm font-medium">
              Order number
              <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required className="mt-2 w-full px-4 py-3 border border-cream rounded-xl outline-none focus:border-charcoal" placeholder="NOO-1234567890-123" />
            </label>
            <label className="text-sm font-medium">
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full px-4 py-3 border border-cream rounded-xl outline-none focus:border-charcoal" placeholder="you@example.com" />
            </label>
            <button disabled={loading} className="bg-charcoal text-white rounded-xl px-6 py-3.5 font-semibold disabled:opacity-50">
              {loading ? "Checking…" : "Track order"}
            </button>
          </form>
        </div>

        {error && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

        {order && (
          <div className="space-y-6 mt-6">
            <section className="bg-white border border-cream rounded-3xl p-6 md:p-8">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-secondary">Order</p>
                  <h2 className="font-editorial text-3xl mt-1">#{order.orderNumber}</h2>
                  <p className="text-sm text-secondary mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-secondary">Total</p>
                  <p className="text-2xl font-semibold mt-1">PKR {order.total.toLocaleString()}</p>
                  <p className="text-xs text-secondary mt-1">Cash on Delivery</p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-5 rounded-2xl bg-cream/60 p-4">
                  <p className="text-xs text-secondary">Courier tracking number</p>
                  <p className="font-semibold mt-1">{order.trackingNumber}</p>
                </div>
              )}

              {(order.status === "CANCELLED" || order.status === "REFUNDED") ? (
                <div className="mt-6 rounded-2xl bg-red-50 border border-red-100 p-5">
                  <p className="font-semibold">{order.status === "CANCELLED" ? "Order cancelled" : "Order refunded"}</p>
                  <p className="text-sm text-secondary mt-1">This order is no longer moving through the delivery journey.</p>
                </div>
              ) : (
                <div className="mt-8">
                  {statuses.map(([status, label, description], index) => {
                    const completed = currentIndex >= 0 && index <= currentIndex
                    const current = index === currentIndex
                    return (
                      <div key={status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${completed ? "bg-charcoal text-white" : "bg-cream text-secondary"}`}>
                            {completed ? "✓" : index + 1}
                          </div>
                          {index < statuses.length - 1 && <div className={`w-px h-12 ${index < currentIndex ? "bg-charcoal" : "bg-cream"}`} />}
                        </div>
                        <div className="pb-7">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-medium ${completed ? "text-charcoal" : "text-secondary"}`}>{label}</p>
                            {current && <span className="text-[10px] uppercase tracking-wide rounded-full bg-charcoal text-white px-2 py-1">Current</span>}
                          </div>
                          <p className="text-sm text-secondary mt-1">{description}</p>
                          {status === "PENDING" && <p className="text-xs text-secondary mt-1">Placed {new Date(order.createdAt).toLocaleString()}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="bg-white border border-cream rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center">
                <h2 className="font-editorial text-2xl">Order items</h2>
                <p className="text-sm text-secondary">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
              </div>
              <div className="mt-5 divide-y divide-cream">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <div className="w-16 h-20 bg-cream rounded-xl overflow-hidden shrink-0">
                      <img src={item.product.images[0] || "/placeholder.jpg"} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.product.name}</p>
                      {item.variant && <p className="text-xs text-secondary mt-1">{item.variant.color} / {item.variant.size}</p>}
                      <p className="text-sm text-secondary mt-2">Qty {item.quantity} × PKR {item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-semibold">PKR {item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
