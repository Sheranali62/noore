"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Search, PackageCheck, Truck, ShieldCheck, Star } from "lucide-react"

type Order = {
  orderNumber: string
  status: string
  total: number
  createdAt: string
  paymentMethod: string
  trackingNumber?: string | null
  courier?: string | null
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
  ["SHIPPED", "Shipped", "Your order is on its way."],
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
    const queryEmail = params.get("email")
    if (queryOrder) setOrderNumber(queryOrder)
    if (queryEmail) setEmail(queryEmail)
  }, [params])

  const currentIndex = useMemo(() => statuses.findIndex(([status]) => status === order?.status), [order?.status])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOrder(null)
    try {
      const response = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "We could not find an order with those details. Please check and try again.")
        return
      }
      setOrder(data.order)
    } catch {
      setError("We could not check your order right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isException = order?.status === "CANCELLED" || order?.status === "REFUNDED" || order?.status === "RETURNED"

  return (
    <main className="min-h-screen bg-[#EEEDE6] py-10 text-[#343A30] md:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#535F4C]/30 bg-[#C2C5B0]/35 text-[#535F4C]">
            <PackageCheck className="h-6 w-6" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#535F4C]">NOORÉ delivery service</p>
          <h1 className="mt-3 font-editorial text-4xl md:text-5xl">Track your order</h1>
          <p className="mt-4 text-sm leading-7 text-[#777967]">Your order journey, all in one place. Enter the order number and email address used at checkout to view the latest status.</p>
        </header>

        <section className="mx-auto mt-9 max-w-3xl rounded-3xl border border-[#D8D8CB] bg-[#171315] p-5 shadow-2xl sm:p-7" aria-label="Order lookup">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-xs font-semibold uppercase tracking-[0.13em] text-[#535F4C]">
              Order number
              <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} required autoComplete="off" spellCheck={false} className="mt-2.5 w-full rounded-xl border border-[#D8D8CB] bg-[#EEEDE6] px-4 py-3.5 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#81756d] focus:border-[#535F4C] focus:ring-2 focus:ring-[#535F4C]/20" placeholder="e.g. NOO-1234567890-123" />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.13em] text-[#535F4C]">
              Email address
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="mt-2.5 w-full rounded-xl border border-[#D8D8CB] bg-[#EEEDE6] px-4 py-3.5 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#81756d] focus:border-[#535F4C] focus:ring-2 focus:ring-[#535F4C]/20" placeholder="you@example.com" />
            </label>
            <button type="submit" disabled={loading || !orderNumber.trim() || !email.trim()} className="inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-[#535F4C] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#171315] transition hover:bg-[#d8b978] disabled:cursor-wait disabled:opacity-50">
              <Search className="h-4 w-4" />{loading ? "Checking…" : "Track order"}
            </button>
          </form>
          <p className="mt-4 flex items-center gap-2 text-[11px] text-[#777967]"><ShieldCheck className="h-4 w-4 shrink-0 text-[#535F4C]" /> Your order details are only shown when both details match.</p>
        </section>

        {error && <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200" role="alert">{error}</div>}

        {order && (
          <div className="mx-auto mt-7 max-w-3xl space-y-6" aria-live="polite">
            <section className="rounded-3xl border border-[#D8D8CB] bg-[#171315] p-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#535F4C]">Order confirmed in our system</p>
                  <h2 className="mt-2 break-all font-editorial text-3xl sm:text-4xl">#{order.orderNumber}</h2>
                  <p className="mt-2 text-xs text-[#777967]">Placed {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="min-w-[130px] rounded-2xl border border-[#D8D8CB] bg-[#EEEDE6] p-4 sm:text-right">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#777967]">Order total</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">PKR {order.total.toLocaleString()}</p>
                  <p className="mt-1 text-[10px] text-[#535F4C]">{order.paymentMethod.replaceAll("_", " ")}</p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#535F4C]/25 bg-[#535F4C]/10 p-4">
                  <div><p className="text-[10px] uppercase tracking-[0.16em] text-[#b9aa98]">Courier tracking number</p><p className="mt-1 break-all font-semibold tracking-wide text-[#343A30]">{order.trackingNumber}</p>{order.courier && <p className="mt-1 text-xs text-[#b9aa98]">{order.courier}</p>}</div>
                  <Truck className="h-5 w-5 text-[#535F4C]" />
                </div>
              )}

              {isException ? (
                <div className="mt-7 rounded-2xl border border-red-900/50 bg-red-950/30 p-5">
                  <p className="font-semibold text-red-200">{order.status === "CANCELLED" ? "Order cancelled" : order.status === "RETURNED" ? "Order returned" : "Order refunded"}</p>
                  <p className="mt-1 text-sm leading-6 text-[#777967]">This order is no longer moving through the delivery journey. Please contact our support team if you need assistance.</p>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#535F4C]">Live order journey</p><h3 className="mt-1 font-editorial text-2xl">Delivery progress</h3></div>
                    <span className="rounded-full border border-[#535F4C]/30 bg-[#C2C5B0]/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#535F4C]">{order.status.replaceAll("_", " ")}</span>
                  </div>
                  {statuses.map(([status, label, description], index) => {
                    const completed = currentIndex >= 0 && index <= currentIndex
                    const current = index === currentIndex
                    return (
                      <div key={status} className="flex gap-4">
                        <div className="flex shrink-0 flex-col items-center">
                          <div className={`grid h-10 w-10 place-items-center rounded-full border text-xs font-semibold ${completed ? "border-[#c6a15b] bg-[#535F4C] text-[#171315]" : "border-[#D8D8CB] bg-[#EEEDE6] text-[#777967]"}`}>{completed ? "✓" : index + 1}</div>
                          {index < statuses.length - 1 && <div className={`h-12 w-px ${index < currentIndex ? "bg-[#535F4C]" : "bg-[#51423a]"}`} />}
                        </div>
                        <div className="min-w-0 pb-7">
                          <div className="flex flex-wrap items-center gap-2"><p className={`text-sm font-medium ${completed ? "text-[#343A30]" : "text-[#777967]"}`}>{label}</p>{current && <span className="rounded-full bg-[#535F4C] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#171315]">Current status</span>}</div>
                          <p className="mt-1 text-xs leading-5 text-[#777967]">{description}</p>
                          {status === "PENDING" && <p className="mt-1 text-[10px] text-[#81756d]">Placed {new Date(order.createdAt).toLocaleString()}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#D8D8CB] bg-[#171315] p-5 sm:p-8">
              <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#535F4C]">Your purchase</p><h3 className="mt-1 font-editorial text-2xl">Order items</h3></div><span className="text-xs text-[#777967]">{order.items.length} item{order.items.length === 1 ? "" : "s"}</span></div>
              <div className="mt-5 divide-y divide-[#51423a]">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EEEDE6] sm:h-24 sm:w-20"><img src={item.product.images[0] || "/placeholder.jpg"} alt={item.product.name} className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#343A30]">{item.product.name}</p>{item.variant && <p className="mt-1 text-xs text-[#777967]">{item.variant.color} / {item.variant.size}</p>}<p className="mt-2 text-xs text-[#777967]">Qty {item.quantity} × PKR {item.price.toLocaleString()}</p></div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-[#343A30]">PKR {item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <footer className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-[#D8D8CB] pt-6 text-[10px] uppercase tracking-[0.14em] text-[#777967]">
          <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[#535F4C]" /> Nationwide delivery</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#535F4C]" /> Secure order lookup</span>
          <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-[#535F4C]" /> NOORÉ service</span>
        </footer>
      </div>
    </main>
  )
}
