"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import AdminNav from "@/components/admin/admin-nav"

type MobileAdminNavProps = {
  email: string
}

export default function MobileAdminNav({
  email,
}: MobileAdminNavProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      )
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      {/* Premium mobile admin header */}
      <div className="flex min-h-[64px] items-center justify-between gap-3">
        <Link
          href="/admin"
          className="shrink-0 font-editorial text-2xl text-white"
        >
          NOORÉ
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden max-w-[180px] truncate text-xs text-white/50 sm:block">
            {email}
          </span>

          {/* 3-dot button */}
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={
              open
                ? "Close admin navigation"
                : "Open admin navigation"
            }
            aria-expanded={open}
            aria-haspopup="menu"
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center",
              "rounded-xl border transition-all duration-200",
              "active:scale-95",
              "focus:outline-none focus-visible:ring-2",
              "focus-visible:ring-white/50",
              open
                ? "border-[#d6ae72] bg-[#d6ae72] text-[#211218]"
                : "border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]",
            ].join(" ")}
          >
            {open ? (
              <svg
                width="19"
                height="19"
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
            ) : (
              <span className="flex flex-col items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Inline dropdown only */}
      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[#d6ae72]/20 bg-[#171116] p-3 shadow-2xl"
        >
          <div className="mb-3 border-b border-white/10 px-2 pb-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Admin studio
            </div>

            <div className="mt-1 truncate text-sm text-white/80">
              {email}
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            <AdminNav mobile />
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="rounded-xl border border-white/10 bg-[#241820] px-3 py-3 text-xs text-white/55">
              Production workspace
              <br />
              <span className="text-white/85">
                COD commerce
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}