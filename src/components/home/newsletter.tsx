"use client"

import { useState } from "react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("🎉 Thank you for subscribing!")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(data.error || "Something went wrong")
      }
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred. Please try again.")
    }
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="font-editorial text-3xl font-semibold">Join Our World</h2>
      <p className="text-secondary mt-2 text-sm">
        Sign up for exclusive access to new collections, private offers and fashion updates.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 border border-cream rounded-md bg-white focus:border-charcoal outline-none text-sm"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-charcoal text-white px-6 py-3 rounded-md font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className={`text-sm mt-3 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      <p className="text-xs text-secondary mt-3">By subscribing, you agree to our Privacy Policy.</p>
    </section>
  )
}