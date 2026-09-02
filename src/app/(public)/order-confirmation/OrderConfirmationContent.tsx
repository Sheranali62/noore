"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending">("pending")
  const [orderNumber, setOrderNumber] = useState("")

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status")

    if (redirectStatus === "failed") {
      setPaymentStatus("failed")
    } else {
      setPaymentStatus("success")
    }

    const storedOrder = window.localStorage.getItem("last_order_number")
    if (storedOrder) {
      setOrderNumber(storedOrder)
      window.localStorage.removeItem("last_order_number")
    }
  }, [searchParams])

  if (paymentStatus === "pending") {
    return (
      <div className="min-h-screen bg-cream py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal mx-auto" />
          <p className="mt-4 text-secondary">Processing your order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg border border-cream p-8 text-center">
          {paymentStatus === "success" ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="font-editorial text-3xl font-semibold">Order Confirmed!</h1>
              <p className="text-secondary mt-2">Your order has been placed successfully</p>
              {orderNumber && (
                <div className="bg-cream p-4 rounded-lg mt-6 inline-block">
                  <p className="text-sm text-secondary">Order Number</p>
                  <p className="font-mono text-xl font-bold">#{orderNumber}</p>
                </div>
              )}
              <div className="mt-6 space-y-2">
                <p className="text-sm text-secondary">We&apos;ve sent a confirmation email with your order details.</p>
                <p className="text-sm text-secondary">You can track your order status in your account.</p>
              </div>
              <div className="flex gap-4 justify-center mt-8">
                <Link href="/" className="bg-charcoal text-white px-6 py-3 rounded font-medium hover:bg-charcoal/80 transition">Continue Shopping</Link>
                <Link href="/account/orders" className="border border-charcoal text-charcoal px-6 py-3 rounded font-medium hover:bg-charcoal hover:text-white transition">View Orders</Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😕</div>
              <h1 className="font-editorial text-3xl font-semibold">Payment Failed</h1>
              <p className="text-secondary mt-2">Your payment could not be processed</p>
              <div className="flex gap-4 justify-center mt-8">
                <Link href="/checkout" className="bg-charcoal text-white px-6 py-3 rounded font-medium hover:bg-charcoal/80 transition">Try Again</Link>
                <Link href="/cart" className="border border-charcoal text-charcoal px-6 py-3 rounded font-medium hover:bg-charcoal hover:text-white transition">Return to Cart</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
