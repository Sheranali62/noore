import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function money(value: number) {
  return `PKR ${value.toLocaleString("en-PK")}`
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\S/g, (letter) => letter.toUpperCase())
}

export default async function PrintOrderPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { mode?: string }
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: { include: { product: true, variant: true } },
    },
  })

  if (!order) notFound()

  const packing = searchParams?.mode === "packing"
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="min-h-screen bg-[#eeece7] px-3 py-4 text-[#151515] sm:px-6 sm:py-8 print:bg-white print:p-0">
      <article className="mx-auto max-w-[900px] overflow-hidden rounded-[32px] bg-white shadow-[0_28px_90px_rgba(18,18,18,0.14)] print:max-w-none print:rounded-none print:shadow-none">
        {/* Brand masthead */}
        <header className="relative overflow-hidden bg-[#171717] text-white">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-white/[0.08]" />
          <div className="absolute -bottom-36 left-[42%] h-72 w-72 rounded-full border border-white/[0.05]" />
          <div className="relative px-6 py-7 sm:px-10 sm:py-9">
            <div className="flex items-start justify-between gap-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f4f1eb] p-1 shadow-inner">
                  <img src="/apple-touch-icon.png" alt="NOORÉ" className="h-full w-full rounded-xl object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-white/45">NOORÉ</p>
                  <h1 className="mt-1 font-editorial text-3xl leading-none sm:text-4xl">
                    {packing ? "Packing Slip" : "Order Invoice"}
                  </h1>
                  <p className="mt-2 text-xs text-white/55">Premium Pakistani fashion, prepared with care.</p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/40">Order number</p>
                <p className="mt-1 text-lg font-semibold tracking-wide sm:text-xl">#{order.orderNumber}</p>
                <p className="mt-1 text-[11px] text-white/50">
                  {order.createdAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em]">
                {packing ? "Fulfilment document" : "Official order document"}
              </span>
              {!packing && (
                <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#171717]">
                  Cash on Delivery
                </span>
              )}
              <span className="ml-auto text-[10px] text-white/45">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            </div>
          </div>
        </header>

        <div className="px-6 py-7 sm:px-10 sm:py-10">
          {/* Customer / delivery */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#faf9f6] p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-black/40">Customer</p>
              <p className="mt-3 text-base font-semibold">{order.user?.name || "Customer"}</p>
              {order.user?.email && <p className="mt-1 break-all text-xs text-black/60">{order.user.email}</p>}
              {order.address?.phone && <p className="mt-1 text-xs text-black/60">{order.address.phone}</p>}
            </div>
            <div className="rounded-2xl border border-black/10 bg-[#faf9f6] p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-black/40">Deliver to</p>
              <p className="mt-3 text-sm font-semibold leading-5">{order.address?.address || "—"}</p>
              <p className="mt-1 text-xs leading-5 text-black/60">
                {order.address ? `${order.address.city}, ${order.address.province} ${order.address.postal}` : "—"}
              </p>
            </div>
          </section>

          {/* Items */}
          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-black/40">Order contents</p>
                <h2 className="mt-1 font-editorial text-2xl">Your NOORÉ edit</h2>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/40">{itemCount} units</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/10">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#f4f1eb]">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-black/50 sm:px-5">Item</th>
                    <th className="px-3 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-black/50 sm:px-5">Variant</th>
                    <th className="px-3 py-3.5 text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-black/50 sm:px-5">Qty</th>
                    <th className="px-4 py-3.5 text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-black/50 sm:px-5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.id} className={index ? "border-t border-black/10" : ""}>
                      <td className="px-4 py-4 font-medium sm:px-5">
                        <div>{item.product.name}</div>
                        <div className="mt-1 text-[10px] text-black/40">SKU {item.product.sku}</div>
                      </td>
                      <td className="px-3 py-4 text-xs text-black/55 sm:px-5">
                        {item.variant ? `${item.variant.color} / ${item.variant.size}` : "Standard"}
                      </td>
                      <td className="px-3 py-4 text-right text-xs sm:px-5">{item.quantity}</td>
                      <td className="px-4 py-4 text-right font-medium sm:px-5">{money(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {!packing && (
            <section className="mt-7 grid gap-5 md:grid-cols-[1fr_300px]">
              <div className="rounded-2xl bg-[#171717] p-5 text-white">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/40">Order status</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xl font-semibold">{statusLabel(order.status)}</span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/70">COD</span>
                </div>
                {order.trackingNumber ? (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Tracking</p>
                    <p className="mt-1 text-sm font-medium tracking-wide">{order.courier ? `${order.courier} · ` : ""}{order.trackingNumber}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-white/45">Tracking information will appear when dispatched.</p>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 p-5 text-sm">
                <div className="flex justify-between gap-5"><span className="text-black/50">Subtotal</span><span>{money(order.subtotal)}</span></div>
                <div className="mt-2 flex justify-between gap-5"><span className="text-black/50">Discount</span><span>- {money(order.discount)}</span></div>
                <div className="mt-2 flex justify-between gap-5"><span className="text-black/50">Shipping</span><span>{order.shipping === 0 ? "FREE" : money(order.shipping)}</span></div>
                <div className="mt-5 flex justify-between gap-5 border-t border-black/10 pt-4"><span className="font-semibold">Total</span><span className="text-xl font-semibold">{money(order.total)}</span></div>
              </div>
            </section>
          )}

          {packing && (
            <section className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                ["Packed", "Confirm all items"],
                ["Quality checked", "Verify garment & variant"],
                ["Ready to ship", "Attach courier label"],
              ].map(([title, note]) => (
                <div key={title} className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-md border border-black/20" />
                    <span className="text-xs font-semibold">{title}</span>
                  </div>
                  <p className="mt-2 pl-9 text-[10px] leading-4 text-black/45">{note}</p>
                </div>
              ))}
            </section>
          )}

          {/* Customer wow moment */}
          <section className="mt-10 overflow-hidden rounded-[24px] bg-[#f4f1eb] p-6 sm:p-7">
            <div className="flex flex-col items-center justify-between gap-7 sm:flex-row">
              <div className="max-w-[520px]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">A note from NOORÉ</p>
                <h2 className="mt-2 font-editorial text-3xl leading-tight">Thank you for making us part of your wardrobe.</h2>
                <p className="mt-3 text-xs leading-5 text-black/55">Discover the latest Pakistani fashion edits, new arrivals and occasion-ready pieces at NOORÉ.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-black/50">
                  <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5">Premium edit</span>
                  <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5">Pakistan-wide</span>
                  <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5">COD</span>
                </div>
              </div>
              <div className="shrink-0 text-center">
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <img src="/noore-website-qr.png" alt="Scan to visit NOORÉ" className="h-28 w-28" />
                </div>
                <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">Scan to shop NOORÉ</p>
              </div>
            </div>
          </section>

          <footer className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="font-editorial text-xl">NOORÉ</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/35">Premium Pakistani fashion</p>
            </div>
            <div className="text-[9px] leading-4 text-black/40 sm:text-right">
              <p>noore-slf5.vercel.app</p>
              <p>Thank you for shopping with NOORÉ.</p>
            </div>
          </footer>
        </div>
      </article>

      <script
        dangerouslySetInnerHTML={{
          __html: `window.addEventListener("load",()=>setTimeout(()=>window.print(),450))`,
        }}
      />
    </main>
  )
}
