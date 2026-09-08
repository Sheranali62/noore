import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value)
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
    <main className="min-h-screen bg-[#eee8e2] px-3 py-5 text-[#211b1b] sm:px-6 sm:py-10 print:bg-white print:p-0">
      <article className="mx-auto w-full max-w-[920px] overflow-hidden rounded-[28px] bg-white shadow-[0_35px_100px_rgba(48,30,34,0.18)] print:max-w-none print:rounded-none print:shadow-none">

        {/* PREMIUM HEADER */}
        <header className="relative overflow-hidden bg-[#24151c] text-white print:bg-[#24151c]">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-[#d6ae72]/20" />
          <div className="absolute -right-8 top-16 h-44 w-44 rounded-full border border-[#d6ae72]/10" />
          <div className="absolute -bottom-36 left-[35%] h-80 w-80 rounded-full border border-white/[0.06]" />

          <div className="absolute right-10 top-8 hidden text-[80px] font-serif leading-none text-white/[0.025] sm:block">
            N
          </div>

          <div className="relative px-7 py-9 sm:px-12 sm:py-11">

            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex items-center gap-5">
                <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[22px] border border-[#d6ae72]/40 bg-[#f4eee7] p-2 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
                  <img
                    src="/apple-touch-icon.png"
                    alt="NOORE"
                    className="h-full w-full rounded-[16px] object-cover"
                  />

                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#d6ae72] text-[9px] font-bold text-[#24151c]">
                    N
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.55em] text-[#d6ae72]">
                    NOORE
                  </p>

                  <h1 className="mt-2 font-serif text-[34px] leading-none tracking-[-0.02em] sm:text-[43px]">
                    {packing ? "Packing Slip" : "Invoice"}
                  </h1>

                  <p className="mt-3 max-w-[390px] text-[10px] leading-5 text-white/55">
                    Premium Pakistani fashion, prepared with care and delivered
                    with elegance.
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#d6ae72]/75">
                  {packing ? "Order reference" : "Invoice number"}
                </p>

                <p className="mt-2 text-[20px] font-semibold tracking-wide text-white">
                  #{order.orderNumber}
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d6ae72]" />
                  <span className="text-[9px] text-white/55">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">
                  Document
                </p>
                <p className="mt-2 text-[10px] font-semibold text-white/80">
                  {packing ? "Fulfilment" : "Official invoice"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">
                  Items
                </p>
                <p className="mt-2 text-[10px] font-semibold text-white/80">
                  {itemCount} {itemCount === 1 ? "Item" : "Items"}
                </p>
              </div>

              {!packing ? (
                <>
                  <div className="rounded-2xl border border-[#d6ae72]/25 bg-[#d6ae72]/10 p-4">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-[#d6ae72]/65">
                      Payment
                    </p>
                    <p className="mt-2 text-[10px] font-semibold text-[#f0d29e]">
                      Cash on Delivery
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">
                      Status
                    </p>
                    <p className="mt-2 text-[10px] font-semibold text-white/80">
                      {statusLabel(order.status)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-[#d6ae72]/25 bg-[#d6ae72]/10 p-4">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-[#d6ae72]/65">
                      Purpose
                    </p>
                    <p className="mt-2 text-[10px] font-semibold text-[#f0d29e]">
                      Fulfilment
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">
                      Prepared
                    </p>
                    <p className="mt-2 text-[10px] font-semibold text-white/80">
                      For dispatch
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <div className="px-6 py-8 sm:px-12 sm:py-11">

          {/* CUSTOMER INFORMATION */}
          <section className="grid gap-4 sm:grid-cols-2">

            <div className="relative overflow-hidden rounded-[20px] border border-[#d9cbc3] bg-[#fbf8f5] p-6">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ead7d9]/50" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ead7d9] text-[11px] font-bold text-[#7a3d4a]">
                    01
                  </span>

                  <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8b7770]">
                    Bill to
                  </p>
                </div>

                <h2 className="mt-5 text-[19px] font-semibold tracking-[-0.02em]">
                  {customerName}
                </h2>

                <div className="mt-3 space-y-1.5 text-[10px] leading-5 text-[#786965]">
                  {customerEmail && (
                    <p className="break-all">{customerEmail}</p>
                  )}

                  {customerPhone && <p>{customerPhone}</p>}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] border border-[#d9cbc3] bg-[#f7f0ea] p-6">
              <div className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-[#ead7d9]/50" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfc3b5] text-[11px] font-bold text-[#704338]">
                    02
                  </span>

                  <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#8b7770]">
                    Ship to
                  </p>
                </div>

                <h2 className="mt-5 text-[15px] font-semibold">
                  Delivery address
                </h2>

                <p className="mt-2 max-w-[370px] text-[10px] leading-5 text-[#786965]">
                  {deliveryAddress}
                </p>
              </div>
            </div>

          </section>

          {/* ORDER DETAILS */}
          <section className="mt-10">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a06a5d]">
                    NOORE / COLLECTION
                  </span>

                  <span className="h-px w-10 bg-[#d6ae72]" />
                </div>

                <h2 className="mt-2 font-serif text-[28px] tracking-[-0.025em] sm:text-[31px]">
                  Your NOORE selection
                </h2>
              </div>

              <div className="rounded-full bg-[#f4eee9] px-4 py-2 sm:text-right">
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#9b8780]">
                  Order date
                </p>

                <p className="mt-1 text-[10px] font-semibold text-[#4b3c3a]">
                  {formatDate(order.createdAt)}
                </p>
              </div>

            </div>

            <div className="overflow-hidden rounded-[20px] border border-[#d8cbc4]">

              <table className="w-full border-collapse">

                <thead>
                  <tr className="bg-[#302027] text-white">
                    <th className="px-4 py-4 text-left text-[8px] font-bold uppercase tracking-[0.2em] text-white/65 sm:px-5">
                      Product
                    </th>

                    <th className="px-3 py-4 text-left text-[8px] font-bold uppercase tracking-[0.2em] text-white/65 sm:px-5">
                      Variant
                    </th>

                    <th className="px-3 py-4 text-right text-[8px] font-bold uppercase tracking-[0.2em] text-white/65 sm:px-5">
                      Qty
                    </th>

                    <th className="px-4 py-4 text-right text-[8px] font-bold uppercase tracking-[0.2em] text-[#d6ae72] sm:px-5">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-[#fcf9f7]"
                      }
                    >
                      <td className="px-4 py-5 sm:px-5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f1e4e2] text-[8px] font-bold text-[#814c55]">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div>
                            <p className="text-[11px] font-semibold text-[#292021]">
                              {item.product.name}
                            </p>

                            <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-[#9b8882]">
                              SKU {item.product.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-5 sm:px-5">
                        {item.variant ? (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-[#dfd2cb] bg-[#faf7f5] px-2.5 py-1 text-[8px] font-medium text-[#6f5d58]">
                              {item.variant.color}
                            </span>

                            <span className="rounded-full border border-[#dfd2cb] bg-[#faf7f5] px-2.5 py-1 text-[8px] font-medium text-[#6f5d58]">
                              Size {item.variant.size}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-[#81716c]">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-5 text-right text-[10px] font-semibold text-[#514442] sm:px-5">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-5 text-right sm:px-5">
                        <span className="text-[11px] font-bold text-[#39272d]">
                          {money(item.total)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </section>

          {/* PAYMENT + TOTAL */}
          {!packing && (
            <section className="mt-8 grid gap-5 md:grid-cols-[1fr_340px]">

              <div className="relative overflow-hidden rounded-[22px] bg-[#302027] p-7 text-white">
                <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full border border-[#d6ae72]/15" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#d6ae72]">
                        Payment & fulfilment
                      </p>

                      <h3 className="mt-2 font-serif text-[21px]">
                        Order summary
                      </h3>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6ae72]/25 bg-[#d6ae72]/10">
                      <span className="text-[14px] text-[#e2bf84]">
                        ✓
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">

                    <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
                      <span className="text-[9px] text-white/40">
                        Payment method
                      </span>

                      <span className="text-[10px] font-semibold text-white/85">
                        Cash on Delivery
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
                      <span className="text-[9px] text-white/40">
                        Payment status
                      </span>

                      <span className="rounded-full bg-[#d6ae72]/15 px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#e6c98f]">
                        {statusLabel(order.paymentStatus)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[9px] text-white/40">
                        Order status
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-white/70">
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[7px] font-bold uppercase tracking-[0.22em] text-[#d6ae72]/60">
                          Tracking
                        </p>

                        <p className="mt-2 text-[10px] font-semibold">
                          {order.courier
                            ? `${order.courier} · `
                            : ""}
                          {order.trackingNumber}
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[22px] border border-[#d8cbc4] bg-[#fcfaf8] p-7">

                <div className="absolute -bottom-14 -right-14 h-36 w-36 rounded-full bg-[#ead7d9]/30" />

                <div className="relative space-y-3 text-[10px]">

                  <div className="flex justify-between gap-5">
                    <span className="text-[#8b7973]">Subtotal</span>
                    <span className="font-medium">{money(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#8b7973]">Discount</span>

                    <span className="font-medium text-[#8c4c58]">
                      {order.discount > 0
                        ? `- ${money(order.discount)}`
                        : money(0)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#8b7973]">Shipping</span>

                    <span className="font-semibold text-[#55745e]">
                      {order.shipping === 0
                        ? "FREE"
                        : money(order.shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-[#8b7973]">Tax</span>

                    <span className="font-medium">
                      {order.tax === 0
                        ? "INCLUDED"
                        : money(order.tax)}
                    </span>
                  </div>

                  <div className="my-5 h-px bg-[#d8cbc4]" />

                  <div className="rounded-[18px] bg-[#302027] p-5 text-white">
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#d6ae72]">
                          Total payable
                        </p>

                        <p className="mt-1 text-[8px] text-white/40">
                          Inclusive of listed charges
                        </p>
                      </div>

                      <p className="text-[22px] font-semibold tracking-tight text-white">
                        {money(order.total)}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </section>
          )}

          {/* PACKING CHECKLIST */}
          {packing && (
            <section className="mt-8">

              <div className="mb-5">
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#a06a5d]">
                  Fulfilment checklist
                </p>

                <h2 className="mt-2 font-serif text-[26px]">
                  Final quality control
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">

                {[
                  ["01", "Packed", "Confirm all ordered items"],
                  ["02", "Quality checked", "Verify garment and variant"],
                  ["03", "Ready to ship", "Attach courier label"],
                ].map(([number, title, note], index) => (
                  <div
                    key={number}
                    className={
                      index === 0
                        ? "rounded-[20px] border border-[#d8c2c5] bg-[#f8eeee] p-5"
                        : index === 1
                          ? "rounded-[20px] border border-[#dccdb9] bg-[#faf5e9] p-5"
                          : "rounded-[20px] border border-[#cbd8cf] bg-[#f1f7f3] p-5"
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[9px] font-bold shadow-sm">
                        {number}
                      </span>

                      <span className="text-[11px] font-semibold">
                        {title}
                      </span>
                    </div>

                    <p className="mt-4 text-[9px] leading-4 text-[#756762]">
                      {note}
                    </p>
                  </div>
                ))}

              </div>
            </section>
          )}

          {/* NOORE BRAND MESSAGE */}
          {!packing && (
            <section className="relative mt-10 overflow-hidden rounded-[24px] bg-[#f4ebe6] p-7 sm:p-9">

              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#b77b78]/10" />
              <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full border border-[#d6ae72]/15" />

              <div className="relative flex flex-col items-center justify-between gap-8 sm:flex-row">

                <div className="max-w-[535px]">

                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#9b625d]">
                      A note from NOORE
                    </span>

                    <span className="h-px w-8 bg-[#d6ae72]" />
                  </div>

                  <h2 className="mt-4 font-serif text-[28px] leading-tight tracking-[-0.025em] text-[#302027]">
                    Thank you for making us part of your wardrobe.
                  </h2>

                  <p className="mt-3 text-[10px] leading-5 text-[#786964]">
                    We believe fashion should feel personal. Thank you for
                    choosing NOORE and allowing us to be part of your style
                    journey.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      ["Premium edit", "bg-[#302027] text-white"],
                      ["Pakistan-wide delivery", "bg-white text-[#654b48]"],
                      ["Made with care", "bg-[#ead7d9] text-[#784853]"],
                    ].map(([label, styles]) => (
                      <span
                        key={label}
                        className={`rounded-full px-3 py-1.5 text-[7px] font-bold uppercase tracking-[0.13em] ${styles}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                </div>

                <div className="shrink-0 text-center">

                  <div className="rounded-[18px] border border-white bg-white p-2 shadow-[0_12px_30px_rgba(80,50,50,0.12)]">
                    <img
                      src="/noore-website-qr.png"
                      alt="Visit NOORE"
                      className="h-[116px] w-[116px]"
                    />
                  </div>

                  <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.2em] text-[#947d76]">
                    Scan to visit NOORE
                  </p>

                </div>

              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="mt-10 border-t border-[#ded3ce] pt-7">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="font-serif text-[25px] font-semibold tracking-[0.18em] text-[#302027]">
                  NOORE
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-px w-6 bg-[#d6ae72]" />

                  <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-[#9b8780]">
                    Premium Pakistani fashion
                  </p>
                </div>
              </div>

              <div className="text-[8px] leading-5 text-[#9b8882] sm:text-right">
                <p className="font-medium text-[#695752]">
                  noore-slf5.vercel.app
                </p>

                <p>
                  Thank you for shopping with NOORE.
                </p>
              </div>

            </div>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#0c0908]" />

              <span className="text-[7px] font-bold uppercase tracking-[0.25em] text-[#b09d96]">
                Made with care · NOORE
              </span>

              <span className="h-px flex-1 bg-[#e4dcd8]" />
            </div>

            <p className="mt-4 text-center text-[7px] uppercase tracking-[0.2em] text-[#b3a19b]">
              This document was generated electronically by NOORE.
            </p>

          </footer>

        </div>
      </article>

      {/* AUTO PRINT — intentionally kept as a script, not an event handler */}
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