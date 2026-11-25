"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function NewsletterUnsubscribePage() {
  const [token, setToken] = useState("")
  const [state, setState] = useState<"checking" | "ready" | "done" | "error">("checking")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") || ""
    setToken(value)
    setState(value ? "ready" : "error")
    if (!value) setMessage("This unsubscribe link is invalid.")
  }, [])

  async function unsubscribe() {
    setState("checking")
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to update your preferences.")
      setMessage(data.message || "Your preferences have been updated.")
      setState("done")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update your preferences.")
      setState("error")
    }
  }

  return <main className="min-h-[65vh] bg-[#F7F6F2] px-4 py-20"><section className="mx-auto max-w-lg rounded-2xl border border-[#D8D8CB] bg-white p-8 text-center"><p className="text-xs uppercase tracking-[.25em] text-[#777967]">NOORÉ email preferences</p><h1 className="mt-3 font-editorial text-3xl">Manage your subscription</h1>{message && <p className="mt-5 text-sm text-[#535F4C]">{message}</p>}{state === "ready" && <button onClick={unsubscribe} className="mt-7 rounded-xl bg-[#535F4C] px-6 py-3 text-sm font-semibold text-white">Unsubscribe from emails</button>}{state === "checking" && <p className="mt-5 text-sm text-[#777967]">Updating…</p>}<Link href="/" className="mt-7 inline-block text-sm underline">Return to NOORÉ</Link></section></main>
}
