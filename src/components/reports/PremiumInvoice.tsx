"use client";

import React from "react";
import PremiumReportLayout from "./PremiumReportLayout";

type InvoiceItem = {
  id?: string;
  name: string;
  sku?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  image?: string;
};

type PremiumInvoiceProps = {
  invoiceNumber?: string;
  date?: string;

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;

  items?: InvoiceItem[];

  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total?: number;

  paymentMethod?: string;
  paymentStatus?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);

export default function PremiumInvoice({
  invoiceNumber = "NOORE-000001",
  date = new Date().toLocaleDateString("en-PK"),

  customerName = "Customer",
  customerEmail,
  customerPhone,
  customerAddress,

  items = [],

  subtotal = 0,
  discount = 0,
  shipping = 0,
  tax = 0,

  total,

  paymentMethod,
  paymentStatus,
}: PremiumInvoiceProps) {
  const calculatedTotal =
    total ??
    Math.max(0, subtotal - discount + shipping + tax);

  return (
    <PremiumReportLayout
      title="INVOICE"
      documentNumber={invoiceNumber}
      date={date}
    >

      {/* =========================================================
          CUSTOMER INFORMATION
      ========================================================= */}

      <section className="mb-10 grid gap-10 border-b border-neutral-200 pb-8 md:grid-cols-2">

        {/* Customer */}
        <div>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
            Billed To
          </p>

          <p className="text-lg font-semibold tracking-tight text-neutral-950">
            {customerName}
          </p>

          <div className="mt-3 space-y-1 text-sm text-neutral-500">
            {customerEmail && <p>{customerEmail}</p>}

            {customerPhone && <p>{customerPhone}</p>}

            {customerAddress && (
              <p className="mt-3 max-w-sm leading-6">
                {customerAddress}
              </p>
            )}
          </div>
        </div>

        {/* Order information */}
        <div className="md:text-right">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
            Order Information
          </p>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-neutral-400">
                Invoice
              </span>{" "}
              <span className="font-medium text-neutral-900">
                #{invoiceNumber}
              </span>
            </div>

            <div>
              <span className="text-neutral-400">
                Date
              </span>{" "}
              <span className="font-medium text-neutral-900">
                {date}
              </span>
            </div>

            {paymentMethod && (
              <div>
                <span className="text-neutral-400">
                  Payment
                </span>{" "}
                <span className="font-medium text-neutral-900">
                  {paymentMethod}
                </span>
              </div>
            )}

            {paymentStatus && (
              <div>
                <span className="text-neutral-400">
                  Status
                </span>{" "}
                <span className="font-medium text-neutral-900">
                  {paymentStatus}
                </span>
              </div>
            )}
          </div>
        </div>

      </section>


      {/* =========================================================
          PRODUCTS
      ========================================================= */}

      <section>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
              Order Details
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">
              Your selection
            </h2>
          </div>

          <p className="text-xs text-neutral-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>


        <div className="overflow-hidden border border-neutral-200">

          <table className="w-full border-collapse">

            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">

                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  Product
                </th>

                <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  Qty
                </th>

                <th className="hidden px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500 sm:table-cell">
                  Price
                </th>

                <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  Total
                </th>

              </tr>
            </thead>


            <tbody>

              {items.length === 0 ? (

                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-neutral-400"
                  >
                    No items found
                  </td>
                </tr>

              ) : (

                items.map((item, index) => (

                  <tr
                    key={`${item.id || item.sku || item.name}-${index}`}
                    className="border-b border-neutral-100 last:border-0"
                  >

                    {/* Product */}
                    <td className="px-4 py-5">

                      <div className="flex items-center gap-4">

                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-14 rounded-sm object-cover"
                          />
                        )}

                        <div>

                          <p className="font-medium text-neutral-900">
                            {item.name}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">

                            {item.sku && (
                              <span>
                                SKU: {item.sku}
                              </span>
                            )}

                            {item.size && (
                              <span>
                                Size: {item.size}
                              </span>
                            )}

                            {item.color && (
                              <span>
                                Color: {item.color}
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                    </td>


                    {/* Quantity */}
                    <td className="px-4 py-5 text-center text-sm text-neutral-600">
                      {item.quantity}
                    </td>


                    {/* Price */}
                    <td className="hidden px-4 py-5 text-right text-sm text-neutral-600 sm:table-cell">
                      {money(item.price)}
                    </td>


                    {/* Total */}
                    <td className="px-4 py-5 text-right text-sm font-medium text-neutral-900">
                      {money(item.price * item.quantity)}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* =========================================================
          TOTALS
      ========================================================= */}

      <section className="mt-10 flex justify-end">

        <div className="w-full max-w-sm">

          <div className="space-y-3">

            <div className="flex justify-between text-sm text-neutral-500">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>


            {discount > 0 && (
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Discount</span>
                <span>
                  - {money(discount)}
                </span>
              </div>
            )}


            {shipping > 0 && (
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Shipping</span>
                <span>
                  {money(shipping)}
                </span>
              </div>
            )}


            {tax > 0 && (
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Tax</span>
                <span>
                  {money(tax)}
                </span>
              </div>
            )}

          </div>


          {/* Grand total */}
          <div className="mt-5 border-t-2 border-neutral-950 pt-5">

            <div className="flex items-end justify-between gap-6">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Total
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Thank you for your order
                </p>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-neutral-950">
                {money(calculatedTotal)}
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          BRAND EXPERIENCE
      ========================================================= */}

      <section className="mt-12 overflow-hidden border border-neutral-200 bg-neutral-50">

        <div className="px-6 py-8 text-center">

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
            The NOORE experience
          </p>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-950">
            Thank you for being part of NOORE.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500">
            We believe great fashion is about more than what you wear.
            It is about how you feel when you wear it.
          </p>

        </div>

      </section>


      {/* =========================================================
          PRINT BUTTON
      ========================================================= */}

      <div className="mt-8 flex justify-end print:hidden">

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-neutral-950 px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:bg-neutral-800"
        >
          Print / Save PDF
        </button>

      </div>

    </PremiumReportLayout>
  );
}