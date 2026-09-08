import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function money(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "bigint"
        ? Number(value)
        : typeof value === "string"
          ? Number(value)
          : value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function"
            ? value.toNumber()
            : Number(value)

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function statusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^| )\S/g, (letter) => letter.toUpperCase())
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function PrintOrderPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { mode?: string }
}) {
  let order

  try {
    order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
            variant: {
              select: {
                color: true,
                size: true,
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error("NOORE print order database error:", error)
    throw new Error("Unable to load this order for printing.")
  }

  if (!order) {
    notFound()
  }

  const packing = searchParams?.mode === "packing"

  const itemCount = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const customerName =
    order.address?.name ||
    order.user?.name ||
    "Customer"

  const customerEmail = order.user?.email || ""
  const customerPhone = order.address?.phone || ""

  const deliveryAddress = order.address
    ? [
        order.address.address,
        order.address.city,
        order.address.province,
        order.address.postal,
      ]
        .filter(Boolean)
        .join(", ")
    : "—"

  return (
    <main className="min-h-screen bg-[#e9e7e2] px-3 py-5 text-[#151515] sm:px-6 sm:py-10 print:bg-white print:p-0">
      <article className="mx-auto w-full max-w-[900px] overflow-hidden bg-white shadow-[0_30px_100px_rgba(0,0,0,0.13)] print:max-w-none print:shadow-none">

        <header className="relative overflow-hidden bg-[#111111] text-white print:bg-[#111111]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/[0.07]" />
          <div className="absolute -bottom-40 left-[48%] h-80 w-80 rounded-full border border-white/[0.05]" />

          <div className="relative px-7 py-8 sm:px-12 sm:py-10">
            <div className="flex items-start justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] bg-[#f5f2ec] p-2">
                  <img
                    src="/apple-touch-icon.png"
                    alt="NOORE"
                    className="h-full w-full rounded-[13px] object-cover"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.5em] text-white/50">
                    NOORE
                  </div>

                  <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] sm:text-[38px]">
                    {packing ? "Packing Slip" : "Invoice"}
                  </h1>

                  <p className="mt-2 max-w-[360px] text-[11px] leading-5 text-white/50">
                    Premium Pakistani fashion, prepared with care.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/40">
                  {packing ? "Order reference" : "Invoice number"}
                </p>

                <p className="mt-2 text-[18px] font-semibold tracking-wide">
                  #{order.orderNumber}
                </p>

                <p className="mt-2 text-[10px] text-white/45">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">
                {packing ? "Fulfilment document" : "Official order document"}
              </span>

              {!packing && (
                <>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-black">
                    Cash on Delivery
                  </span>

                  <span className="rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/65">
                    {statusLabel(order.status)}
                  </span>
                </>
              )}

              <span className="ml-auto text-[10px] text-white/40">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </header>

        <div className="px-7 py-8 sm:px-12 sm:py-10">

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="border border-black/10 bg-[#faf9f6] p-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-black/40">
                Bill to
              </p>

              <h2 className="mt-4 text-[17px] font-semibold tracking-tight">
                {customerName}
              </h2>

              <div className="mt-3 space-y-1 text-[11px] leading-5 text-black/55">
                {customerEmail && (
                  <p className="break-all">{customerEmail}</p>
                )}
                {customerPhone && <p>{customerPhone}</p>}
              </div>
            </div>

            <div className="border border-black/10 bg-[#faf9f6] p-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-black/40">
                Ship to
              </p>

              <h2 className="mt-4 text-[14px] font-semibold leading-5">
                Delivery address
              </h2>

              <p className="mt-2 text-[11px] leading-5 text-black/55">
                {deliveryAddress}
              </p>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">
                  Order details
                </p>

                <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.025em]">
                  Your NOORE selection
                </h2>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-black/35">
                  Order date
                </p>

                <p className="mt-1 text-[11px] font-medium">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden border border-black/10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f3f0ea]">
                    <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-5">
                      Product
                    </th>

                    <th className="px-3 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-5">
                      Variant
                    </th>

                    <th className="px-3 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-5">
                      Qty
                    </th>

                    <th className="px-4 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-5">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        index > 0
                          ? "border-t border-black/[0.08]"
                          : ""
                      }
                    >
                      <td className="px-4 py-5 sm:px-5">
                        <p className="text-[12px] font-semibold">
                          {item.product.name}
                        </p>

                        <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-black/35">
                          SKU {item.product.sku}
                        </p>
                      </td>

                      <td className="px-3 py-5 text-[10px] text-black/55 sm:px-5">
                        {item.variant
                          ? `${item.variant.color} / ${item.variant.size}`
                          : "Standard"}
                      </td>

                      <td className="px-3 py-5 text-right text-[11px] sm:px-5">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-5 text-right text-[11px] font-semibold sm:px-5">
                        {money(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {!packing && (
            <section className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="bg-[#111111] p-6 text-white">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-white/40">
                  Payment & fulfilment
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] text-white/45">
                      Payment method
                    </span>

                    <span className="text-[11px] font-medium">
                      Cash on Delivery
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] text-white/45">
                      Payment status
                    </span>

                    <span className="text-[11px] font-medium">
                      {statusLabel(order.paymentStatus)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] text-white/45">
                      Order status
                    </span>

                    <span className="text-[11px] font-medium">
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  {order.trackingNumber && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">
                        Tracking
                      </p>

                      <p className="mt-2 text-[11px] font-medium">
                        {order.courier
                          ? `${order.courier} · `
                          : ""}
                        {order.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-black/10 p-6">
                <div className="space-y-3 text-[11px]">
                  <div className="flex justify-between gap-5">
                    <span className="text-black/45">Subtotal</span>
                    <span>{money(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-black/45">Discount</span>
                    <span>
                      {order.discount > 0
                        ? `- ${money(order.discount)}`
                        : money(0)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-black/45">Shipping</span>
                    <span>
                      {order.shipping === 0
                        ? "FREE"
                        : money(order.shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-black/45">Tax</span>
                    <span>
                      {order.tax === 0
                        ? "INCLUDED"
                        : money(order.tax)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t-2 border-black pt-5">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black/40">
                        Total payable
                      </p>

                      <p className="mt-1 text-[9px] text-black/35">
                        Inclusive of listed charges
                      </p>
                    </div>

                    <p className="text-[23px] font-semibold tracking-tight">
                      {money(order.total)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {packing && (
            <section className="mt-8">
              <div className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-black/40">
                  Fulfilment checklist
                </p>

                <h2 className="mt-2 text-[22px] font-semibold">
                  Final quality control
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Packed", "Confirm all ordered items"],
                  ["02", "Quality checked", "Verify garment and variant"],
                  ["03", "Ready to ship", "Attach courier label"],
                ].map(([number, title, note]) => (
                  <div
                    key={number}
                    className="border border-black/10 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center border border-black/15 text-[9px] font-semibold">
                        {number}
                      </span>

                      <span className="text-[11px] font-semibold">
                        {title}
                      </span>
                    </div>

                    <p className="mt-3 text-[9px] leading-4 text-black/40">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!packing && (
            <section className="relative mt-10 overflow-hidden bg-[#f3f0ea] p-7 sm:p-9">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-black/[0.05]" />

              <div className="relative flex flex-col items-center justify-between gap-8 sm:flex-row">
                <div className="max-w-[510px]">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-black/40">
                    A note from NOORE
                  </p>

                  <h2 className="mt-3 text-[27px] font-semibold leading-tight tracking-[-0.025em]">
                    Thank you for making us part of your wardrobe.
                  </h2>

                  <p className="mt-3 text-[11px] leading-5 text-black/50">
                    We believe fashion should feel personal. Thank you for
                    choosing NOORE and allowing us to be part of your style
                    journey.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      "Premium edit",
                      "Pakistan-wide delivery",
                      "Made with care",
                    ].map((label) => (
                      <span
                        key={label}
                        className="border border-black/10 bg-white/70 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.13em] text-black/45"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 text-center">
                  <div className="bg-white p-2 shadow-sm">
                    <img
                      src="/noore-website-qr.png"
                      alt="Visit NOORE"
                      className="h-[112px] w-[112px]"
                    />
                  </div>

                  <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-black/35">
                    Scan to visit NOORE
                  </p>
                </div>
              </div>
            </section>
          )}

          <footer className="mt-9 border-t border-black/10 pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[17px] font-semibold tracking-[0.28em]">
                  NOORE
                </p>

                <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35">
                  Premium Pakistani fashion
                </p>
              </div>

              <div className="text-[9px] leading-5 text-black/35 sm:text-right">
                <p>noore-slf5.vercel.app</p>
                <p>Thank you for shopping with NOORE.</p>
              </div>
            </div>

            <div className="mt-6 text-center text-[8px] uppercase tracking-[0.2em] text-black/25">
              This document was generated electronically by NOORE.
            </div>
          </footer>
        </div>
      </article>


      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener("load", () => {
              setTimeout(() => window.print(), 500)
            })
          `,
        }}
      />
    </main>
  )
}


