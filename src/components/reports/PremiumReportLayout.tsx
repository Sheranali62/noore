"use client";

import React from "react";

type PremiumReportLayoutProps = {
  children: React.ReactNode;
  title?: string;
  documentNumber?: string;
  date?: string;
};

export default function PremiumReportLayout({
  children,
  title = "INVOICE",
  documentNumber,
  date,
}: PremiumReportLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-[900px] overflow-hidden bg-white shadow-xl print:max-w-none print:shadow-none">
        
        {/* HEADER */}
        <header className="border-b border-neutral-200 px-10 py-8">
          <div className="flex items-start justify-between gap-8">
            
            {/* Brand */}
            <div>
              <img
                src="/logo.png"
                alt="NOORE"
                className="mb-4 h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <div className="text-3xl font-semibold tracking-[0.35em] text-neutral-950">
                NOORE
              </div>

              <p className="mt-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
                Fashion • Lifestyle • Elegance
              </p>
            </div>

            {/* Document information */}
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                {title}
              </p>

              {documentNumber && (
                <p className="mt-2 text-sm font-semibold text-neutral-900">
                  #{documentNumber}
                </p>
              )}

              {date && (
                <p className="mt-1 text-xs text-neutral-500">
                  {date}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="px-10 py-8">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-neutral-200 px-10 py-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Thank you for choosing NOORE.
              </p>

              <p className="mt-2 max-w-md text-xs leading-5 text-neutral-500">
                Your style matters to us. We hope you enjoy your NOORE
                experience as much as we enjoyed creating it for you.
              </p>

              <p className="mt-4 text-xs text-neutral-400">
                www.noore.pk
              </p>
            </div>

            {/* QR */}
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                Visit NOORE
              </p>

              <img
                src="/noore-website-qr.png"
                alt="Visit NOORE website"
                className="mt-3 h-24 w-24 object-contain sm:ml-auto"
              />

              <p className="mt-2 text-[10px] text-neutral-400">
                Scan to visit our website
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}