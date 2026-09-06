"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import AdminNav from "@/components/admin/admin-nav"

type MobileAdminNavProps = {
  email: string
}

export default function MobileAdminNav({ email }: MobileAdminNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ""
      return
    }

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-cream bg-background/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Link
            href="/admin"
            className="shrink-0 font-editorial text-2xl text-foreground"
          >
            NOORÉ
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden max-w-[150px] truncate text-xs text-secondary sm:block">
              {email}
            </span>

            {/* 3-dot menu button */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open admin menu"
              aria-expanded={open}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground text-background shadow-sm transition hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            >
              <span className="flex flex-col items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-background" />
                <span className="h-1.5 w-1.5 rounded-full bg-background" />
                <span className="h-1.5 w-1.5 rounded-full bg-background" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 cursor-default bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Drawer */}
      <aside
        aria-label="Mobile admin navigation"
        aria-hidden={!open}
        className={[
          "fixed inset-y-0 right-0 z-[60] flex w-[min(86vw,360px)]",
          "flex-col bg-charcoal text-white shadow-2xl",
          "transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="font-editorial text-2xl">NOORÉ</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Admin studio
            </div>
          </div>

          {/* Clearly visible close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white text-slate-950 shadow-sm transition hover:bg-white/90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Account */}
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Signed in as
          </div>
          <div className="mt-1 truncate text-sm text-white/85">
            {email}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <AdminNav mobile />
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
            Production workspace
            <br />
            <span className="text-white/85">COD commerce</span>
          </div>
        </div>
      </aside>
    </>
  )
}