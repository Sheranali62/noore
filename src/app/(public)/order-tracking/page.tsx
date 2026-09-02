"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type OrderStatus = {
  status: string
  label: string
  icon: string
  date: string
  description: string
}

export default function OrderTrackingPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOrder(null)

    try {
      const response = await fetch(`/api/orders/track?orderNumber=${orderNumber}&email=${email}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
      } else {
        setError(data.error || "Order not found")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Order status timeline
  const getStatuses = (currentStatus: string): OrderStatus[] => {
    const allStatuses: OrderStatus[] = [
      { status: "PENDING", label: "Order Placed", icon: "📦", date: order?.createdAt, description: "Your order has been received" },
      { status: "CONFIRMED", label: "Confirmed", icon: "✅", date: "", description: "Your order has been confirmed" },
      { status: "PROCESSING", label: "Processing", icon: "⚙️", date: "", description: "Your order is being prepared" },
      { status: "PACKED", label: "Packed", icon: "📦", date: "", description: "Your order has been packed" },
      { status: "SHIPPED", label: "Shipped", icon: "🚚", date: "", description: "Your order is on the way" },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚗", date: "", description: "Your order is out for delivery" },
      { status: "DELIVERED", label: "Delivered", icon: "🏠", date: "", description: "Your order has been delivered" },
    ]

    const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]
    const currentIndex = statusOrder.indexOf(currentStatus)

    return allStatuses.map((s, index) => ({
      ...s,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
    }))
  }

  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-editorial text-4xl font-semibold text-center mb-8">Track Your Order</h1>

        {/* Search Form */}
        <div className="bg-white rounded-lg border border-cream p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order Number *</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="NOO-1234567890-123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-charcoal text-white py-3 rounded font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-lg border border-cream p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-secondary">Order Number</p>
                  <p className="font-mono font-bold">#{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary">Total</p>
                  <p className="font-bold">PKR {order.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-cream">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Date</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-secondary">Payment</span>
                  <span>{order.paymentMethod}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-secondary">Tracking Number</span>
                    <span className="font-medium">{order.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg border border-cream p-6">
              <h2 className="font-semibold text-lg mb-6">Order Status</h2>
              <div className="space-y-4">
                {getStatuses(order.status).map((status, index) => {
                  const isCompleted = index <= getStatuses(order.status).findIndex(s => s.status === order.status)
                  return (
                    <div key={status.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                          isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                        }`}>
                          {status.icon}
                        </div>
                        {index < getStatuses(order.status).length - 1 && (
                          <div className={`w-0.5 h-12 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isCompleted ? "text-charcoal" : "text-secondary"}`}>
                            {status.label}
                          </p>
                          {isCompleted && (
                            <span className="text-xs text-green-600">✓ Done</span>
                          )}
                        </div>
                        <p className="text-sm text-secondary">{status.description}</p>
                        {status.date && (
                          <p className="text-xs text-secondary mt-1">
                            {new Date(status.date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-cream p-6">
              <h2 className="font-semibold text-lg mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 border-b border-cream pb-3">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-secondary">Qty: {item.quantity} × PKR {item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-medium">PKR {item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}