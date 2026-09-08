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

  if (!order) notFound()

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
    <main className="min-h-screen bg-[#e9ddd5] px-3 py-5 text-[#2b1a24] sm:px-6 sm:py-8 print:bg-[#f5eee6] print:p-0">
      <article className="mx-auto w-full max-w-[794px] overflow-hidden rounded-[26px] border border-[#d5bda9] bg-[#f8f1e8] shadow-[0_30px_90px_rgba(48,25,37,0.18)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">

        {/* TOP BRAND AREA */}
        <header className="relative overflow-hidden bg-[#321526] text-[#f9efe4] print:bg-[#321526]">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#d6ae72]/25" />
          <div className="absolute -right-8 top-10 h-40 w-40 rounded-full border border-[#d6ae72]/12" />
          <div className="absolute bottom-[-130px] left-[42%] h-64 w-64 rounded-full border border-white/[0.06]" />

          <div className="relative px-8 pb-7 pt-8 sm:px-10 sm:pt-9">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] border border-[#d6ae72]/45 bg-[#f7eee4] p-2 shadow-lg">
                  <img
                    src="/apple-touch-icon.png"
                    alt="NOORE"
                    className="h-full w-full rounded-[12px] object-cover"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.55em] text-[#d6ae72]">
                    NOORÉ
                  </p>
                  <h1 className="mt-1 font-serif text-[38px] leading-none tracking-[-0.03em] sm:text-[45px]">
                    {packing ? "Packing Slip" : "Invoice"}
                  </h1>
                  <p className="mt-2 max-w-[360px] text-[8px] leading-4 text-[#eadbd1]/65">
                    Premium Pakistani fashion, prepared with care and
                    delivered with elegance.
                  </p>
                </div>
              </div>

              <div className="pt-1 text-right">
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#d6ae72]/75">
                  {packing ? "Order reference" : "Invoice number"}
                </p>
                <p className="mt-2 text-[15px] font-semibold tracking-wide">
                  #{order.orderNumber}
                </p>
                <div className="mt-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                  <span className="text-[7px] text-white/55">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-5 sm:grid-cols-4">
              <div className="rounded-[15px] border border-white/10 bg-white/[0.055] px-4 py-3">
                <p className="text-[6px] uppercase tracking-[0.22em] text-white/35">
                  Document
                </p>
                <p className="mt-1.5 text-[9px] font-semibold">
                  {packing ? "Fulfilment" : "Official invoice"}
                </p>
              </div>

              <div className="rounded-[15px] border border-white/10 bg-white/[0.055] px-4 py-3">
                <p className="text-[6px] uppercase tracking-[0.22em] text-white/35">
                  Items
                </p>
                <p className="mt-1.5 text-[9px] font-semibold">
                  {itemCount} {itemCount === 1 ? "Item" : "Items"}
                </p>
              </div>

              <div className="rounded-[15px] border border-[#d6ae72]/25 bg-[#d6ae72]/10 px-4 py-3">
                <p className="text-[6px] uppercase tracking-[0.22em] text-[#d6ae72]/70">
                  Payment
                </p>
                <p className="mt-1.5 text-[9px] font-semibold text-[#f1d39c]">
                  Cash on Delivery
                </p>
              </div>

              <div className="rounded-[15px] border border-white/10 bg-white/[0.055] px-4 py-3">
                <p className="text-[6px] uppercase tracking-[0.22em] text-white/35">
                  Status
                </p>
                <p className="mt-1.5 text-[9px] font-semibold">
                  {statusLabel(order.status)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* IVORY BODY */}
        <div className="relative px-7 py-7 sm:px-10 sm:py-8">

          <div className="pointer-events-none absolute right-[-35px] top-[260px] h-36 w-36 rounded-full border border-[#b78a70]/10" />
          <div className="pointer-events-none absolute left-[-50px] bottom-[300px] h-44 w-44 rounded-full border border-[#d6ae72]/10" />

          {/* BILL / SHIP */}
          <section className="relative grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-[18px] border border-[#d8c1ae] bg-[#da7a21] p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5a2943] text-[8px] font-bold text-[#f8e9dc]">
                  01
                </span>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#8d675c]">
                  Bill to
                </p>
              </div>

              <h2 className="mt-4 font-serif text-[19px] text-[#321526]">
                {customerName}
              </h2>

              <div className="mt-2.5 space-y-1 text-[8px] leading-4 text-[#705d58]">
                {customerEmail && <p className="break-all">{customerEmail}</p>}
                {customerPhone && <p>{customerPhone}</p>}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#d8c1ae] bg-[#f1e4da] p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7b4a43] text-[8px] font-bold text-[#f8e9dc]">
                  02
                </span>
                <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#8d675c]">
                  Ship to
                </p>
              </div>

              <h2 className="mt-4 font-serif text-[18px] text-[#321526]">
                Delivery address
              </h2>

              <p className="mt-2.5 text-[8px] leading-4 text-[#705d58]">
                {deliveryAddress}
              </p>
            </div>
          </section>

          {/* ORDER */}
          <section className="relative mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[7px] font-bold uppercase tracking-[0.34em] text-[#a06a5d]">
                    NOORÉ / COLLECTION
                  </p>
                  <span className="h-px w-7 bg-[#c99b5b]" />
                </div>
                <h2 className="mt-1.5 font-serif text-[25px] leading-tight text-[#321526]">
                  Your NOORÉ selection
                </h2>
              </div>

              <div className="rounded-full border border-[#52351c] bg-[#a5571c] px-3.5 py-2 text-right">
                <p className="text-[6px] uppercase tracking-[0.22em] text-[#967d75]">
                  Order date
                </p>
                <p className="mt-0.5 text-[8px] font-semibold text-[#513b3d]">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[17px] border border-[#cdb3a3] bg-[#4d3118]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4a2038] text-[#60482f]">
                    <th className="w-[7%] px-3 py-3 text-left text-[6px] font-bold uppercase tracking-[0.18em]">
                      #
                    </th>
                    <th className="px-2 py-3 text-left text-[6px] font-bold uppercase tracking-[0.18em]">
                      Product
                    </th>
                    <th className="px-2 py-3 text-left text-[6px] font-bold uppercase tracking-[0.18em]">
                      Variant
                    </th>
                    <th className="w-[12%] px-2 py-3 text-right text-[6px] font-bold uppercase tracking-[0.18em]">
                      Qty
                    </th>
                    <th className="w-[20%] px-3 py-3 text-right text-[6px] font-bold uppercase tracking-[0.18em] text-[#e1bc7e]">
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
                          ? "bg-[#9a6d45]"
                          : "bg-[#b87e55]"
                      }
                    >
                      <td className="px-3 py-4 text-[8px] font-semibold text-[#725b59]">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="px-2 py-4">
                        <p className="text-[9px] font-semibold text-[#321526]">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 text-[6px] uppercase tracking-[0.1em] text-[#947d76]">
                          SKU {item.product.sku}
                        </p>
                      </td>

                      <td className="px-2 py-4">
                        {item.variant ? (
                          <span className="inline-flex rounded-full border border-[#d6c0b1] bg-[#e8d8cc] px-2.5 py-1 text-[7px] font-medium text-[#644a4d]">
                            {item.variant.color} / {item.variant.size}
                          </span>
                        ) : (
                          <span className="text-[7px] text-[#806d67]">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-4 text-right text-[8px] font-semibold text-[#503b3e]">
                        {item.quantity}
                      </td>

                      <td className="px-3 py-4 text-right text-[9px] font-bold text-[#321526]">
                        {money(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SUMMARY */}
          {!packing && (
            <section className="mt-5 grid gap-5 sm:grid-cols-[1fr_275px]">
              <div className="rounded-[18px] bg-[#4a2038] p-5 text-[#f8ede2]">
                <p className="text-[6px] font-bold uppercase tracking-[0.28em] text-[#d6ae72]">
                  Payment & fulfilment
                </p>
                <h3 className="mt-1.5 font-serif text-[19px]">
                  Thank you for choosing NOORÉ
                </h3>

                <p className="mt-2.5 max-w-[330px] text-[7px] leading-4 text-[#eadbd1]/65">
                  We believe fashion should feel personal. Your order is
                  prepared with care and is ready for its journey to you.
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#d6ae72]/15 px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.12em] text-[#e6c88e]">
                    Premium edit
                  </span>
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.12em] text-white/65">
                    Pakistan-wide delivery
                  </span>
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.12em] text-white/65">
                    Made with care
                  </span>
                </div>
              </div>

              <div className="rounded-[18px] border border-[#d2b9aa] bg-[#f1e4da] p-5">
                <div className="space-y-2 text-[8px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#8a716b]">Subtotal</span>
                    <span className="font-medium">{money(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-[#8a716b]">Discount</span>
                    <span className="font-medium text-[#8d4d5d]">
                      {order.discount > 0
                        ? `- ${money(order.discount)}`
                        : money(0)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-[#8a716b]">Shipping</span>
                    <span className="font-semibold text-[#527056]">
                      {order.shipping === 0 ? "FREE" : money(order.shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-[#8a716b]">Tax</span>
                    <span className="font-medium">
                      {order.tax === 0 ? "INCLUDED" : money(order.tax)}
                    </span>
                  </div>

                  <div className="my-3 h-px bg-[#cfb8aa]" />

                  <div className="rounded-[14px] bg-[#321526] p-3.5 text-[#f9eee4]">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[6px] font-bold uppercase tracking-[0.25em] text-[#d6ae72]">
                          Total payable
                        </p>
                        <p className="mt-0.5 text-[6px] text-white/40">
                          Inclusive of listed charges
                        </p>
                      </div>
                      <p className="text-[18px] font-semibold">
                        {money(order.total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* QR + FOOTER */}
          {!packing && (
            <section className="mt-5 flex items-center justify-between gap-5 border-t border-[#d5bfb0] pt-5">
              <div className="max-w-[430px]">
                <p className="font-serif text-[20px] italic text-[#4a2038]">
                  Thank you
                </p>
                <p className="mt-1 text-[7px] uppercase tracking-[0.22em] text-[#947d76]">
                  For shopping with NOORÉ
                </p>
                <p className="mt-2 text-[7px] leading-4 text-[#806d67]">
                  This document was generated electronically by NOORÉ.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-[11px] border border-[#c9aa87] bg-[#f8f0e7] p-1.5">
                  <img
                    src="/noore-website-qr.png"
                    alt="Visit NOORE"
                    className="h-[68px] w-[68px]"
                  />
                </div>
                <div>
                  <p className="text-[6px] font-bold uppercase tracking-[0.2em] text-[#a06a5d]">
                    Scan to visit
                  </p>
                  <p className="mt-1 font-serif text-[13px] text-[#4a2038]">
                    NOORÉ
                  </p>
                  <p className="mt-1 text-[6px] text-[#8b7770]">
                    noore-slf5.vercel.app
                  </p>
                </div>
              </div>
            </section>
          )}

          {packing && (
            <section className="mt-5">
              <p className="text-[6px] font-bold uppercase tracking-[0.28em] text-[#a06a5d]">
                Fulfilment checklist
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {[
                  ["01", "Packed", "Confirm all ordered items"],
                  ["02", "Quality checked", "Verify garment and variant"],
                  ["03", "Ready to ship", "Attach courier label"],
                ].map(([number, title, note]) => (
                  <div
                    key={number}
                    className="rounded-[15px] border border-[#71462a] bg-[#653d1e] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a2038] text-[7px] font-bold text-white">
                        {number}
                      </span>
                      <span className="text-[8px] font-semibold text-[#4a2038]">
                        {title}
                      </span>
                    </div>
                    <p className="mt-2.5 text-[6px] leading-3.5 text-[#806d67]">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-5 border-t border-[#512f18] pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-serif text-[17px] font-semibold tracking-[0.18em] text-[#321526]">
                  NOORÉ
                </p>
                <p className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.2em] text-[#a06a5d]">
                  Premium Pakistani fashion
                </p>
              </div>

              <div className="text-right text-[6px] leading-3.5 text-[#947d76]">
                <p>Thank you for shopping with NOORÉ.</p>
                <p>Made with care · NOORÉ</p>
              </div>
            </div>
          </footer>
        </div>
      </article>

      {/* AUTO PRINT */}
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
