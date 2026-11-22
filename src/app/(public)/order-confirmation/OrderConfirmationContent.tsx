"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Package, ArrowRight, ShoppingBag, Truck, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react"

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending">("pending")
  const [orderNumber, setOrderNumber] = useState("")

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status")
    setPaymentStatus(redirectStatus === "failed" ? "failed" : "success")

    const storedOrder = window.localStorage.getItem("last_order_number")
    if (storedOrder) {
      setOrderNumber(storedOrder)
      window.localStorage.removeItem("last_order_number")
    }
  }, [searchParams])

  if (paymentStatus === "pending") {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#211b1d] px-4 py-16 text-[#f5f0e7]">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-[#51423a] border-t-[#c6a15b]" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#c6a879]">NOORÉ · Processing</p>
          <p className="mt-2 text-sm text-[#c2b8b0]">Please wait while we confirm your order.</p>
        </div>
      </main>
    )
  }

  const isSuccess = paymentStatus === "success"

  return (
    <main className="min-h-[70vh] bg-[#211b1d] px-4 py-12 text-[#f5f0e7] sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[28px] border border-[#6a5540]/60 bg-[#171315] shadow-2xl shadow-black/20">
          <div className="h-1.5 bg-gradient-to-r from-[#8d6c3e] via-[#e0c48e] to-[#8d6c3e]" />
          <div className="px-5 py-10 text-center sm:px-12 sm:py-14">
            <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full border ${isSuccess ? "border-[#c6a15b]/50 bg-[#c6a15b]/10 text-[#e0c48e]" : "border-red-400/30 bg-red-400/10 text-red-300"}`}>
              {isSuccess ? <Check className="h-9 w-9" strokeWidth={1.6} /> : <AlertCircle className="h-9 w-9" strokeWidth={1.6} />}
            </div>
            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c6a879]">NOORÉ · Order update</p>
            <h1 className="mt-3 font-editorial text-4xl leading-tight sm:text-5xl">{isSuccess ? "Thank you for your order." : "Payment unsuccessful."}</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#c2b8b0]">
              {isSuccess
                ? "Your order has been received. You can keep its reference number and use it to check delivery progress whenever you need."
                : "We could not confirm this payment. You can return to checkout and try again. If your account was charged, please contact our support team before placing another order."}
            </p>

            {isSuccess && orderNumber && (
              <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#b8945e]/35 bg-[#211b1d] px-5 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#b9aa98]">Your order reference</p>
                <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-wide text-[#f0d8a8]">#{orderNumber}</p>
                <p className="mt-2 text-[11px] text-[#a99d92]">Keep this number handy when contacting NOORÉ.</p>
              </div>
            )}

            {isSuccess ? (
              <>
                <div className="mx-auto mt-9 grid max-w-xl gap-3 text-left sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#51423a] bg-[#211b1d] p-4">
                    <Package className="h-5 w-5 text-[#c6a15b]" />
                    <p className="mt-3 text-xs font-semibold text-[#f5f0e7]">Order received</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#a99d92]">We have received your order details.</p>
                  </div>
                  <div className="rounded-2xl border border-[#51423a] bg-[#211b1d] p-4">
                    <ShieldCheck className="h-5 w-5 text-[#c6a15b]" />
                    <p className="mt-3 text-xs font-semibold text-[#f5f0e7]">Order review</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#a99d92]">Our team will process your order.</p>
                  </div>
                  <div className="rounded-2xl border border-[#51423a] bg-[#211b1d] p-4">
                    <Truck className="h-5 w-5 text-[#c6a15b]" />
                    <p className="mt-3 text-xs font-semibold text-[#f5f0e7]">Delivery updates</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#a99d92]">Check your order journey online.</p>
                  </div>
                </div>
                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  {orderNumber ? (
                    <Link href={`/order-tracking?orderNumber=${encodeURIComponent(orderNumber)}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c6a15b] px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#171315] transition hover:bg-[#e0c48e]">
                      <Truck className="h-4 w-4" /> Track your order <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link href="/account/orders" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c6a15b] px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#171315] transition hover:bg-[#e0c48e]">
                      <Package className="h-4 w-4" /> View my orders <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#8b755c] px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f5f0e7] transition hover:border-[#d6b77c] hover:text-[#e0c48e]">
                    <ShoppingBag className="h-4 w-4" /> Continue shopping
                  </Link>
                </div>
                <p className="mt-7 text-[11px] text-[#8f837a]">For help with your order, visit our <Link href="/contact" className="text-[#d6b77c] underline underline-offset-4 hover:text-[#f0d8a8]">customer support page</Link>.</p>
              </>
            ) : (
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/checkout" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c6a15b] px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#171315] transition hover:bg-[#e0c48e]"><RefreshCw className="h-4 w-4" /> Return to checkout</Link>
                <Link href="/cart" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#8b755c] px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f5f0e7] transition hover:border-[#d6b77c] hover:text-[#e0c48e]">View cart</Link>
              </div>
            )}
          </div>
        </div>
        <p className="mt-7 text-center text-[9px] font-semibold uppercase tracking-[0.3em] text-[#887b71]">NOORÉ · Thoughtfully selected. Beautifully delivered.</p>
      </div>
    </main>
  )
}
