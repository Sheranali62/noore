"use client"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-cream px-6 text-center">
      <div className="max-w-md">
        <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-secondary">Something went wrong</p>
        <h1 className="mt-3 font-editorial text-4xl">We&apos;re sorry.</h1>
        <p className="mt-4 text-sm leading-6 text-secondary">Please try again. Your cart and account data are kept safe while we recover the page.</p>
        <button onClick={() => reset()} className="mt-7 bg-charcoal px-6 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white">Try again</button>
      </div>
    </div>
  )
}
