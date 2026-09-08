"use client"

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-black px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
    >
      Print / Save PDF
    </button>
  )
}