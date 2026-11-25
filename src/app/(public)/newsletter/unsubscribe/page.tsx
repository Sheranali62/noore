"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function NewsletterUnsubscribePage() {
  const [message, setMessage] = useState("Processing your request…")
  const [error, setError] = useState(false)
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || ""
    fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to unsubscribe.")
      setMessage(data.message)
    }).catch(err => {
      setError(true)
      setMessage(err instanceof Error ? err.message : "Unable to unsubscribe.")
    })
  }, [])
  return <main className="min-h-[65vh] bg-cream px-4 py-20"><section className="mx-auto max-w-lg rounded-xl border border-cream bg-white p-9 text-center"><p className="text-xs uppercase tracking-[.28em] text-secondary">NOORÉ</p><h1 className="mt-4 font-editorial text-3xl">Email preferences</h1><p role="status" className={`mt-4 text-sm ${error ? "text-red-700" : "text-secondary"}`}>{message}</p><Link href="/" className="mt-7 inline-block rounded-md bg-charcoal px-6 py-3 text-sm font-semibold text-white">Return to NOORÉ</Link></section></main>
}
