"use client"

import { useState } from "react"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || "Something went wrong")
      }
    } catch {
      setError("Something went wrong")
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-cream p-8 text-center">
          <h2 className="font-editorial text-2xl font-semibold">Check Your Email</h2>
          <p className="text-secondary mt-2">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link href="/login" className="inline-block mt-6 text-charcoal font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg border border-cream p-8">
        <div className="text-center mb-8">
          <h1 className="font-editorial text-3xl font-semibold">Reset Password</h1>
          <p className="text-secondary text-sm mt-2">
            Enter your email to receive a reset link
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-charcoal text-white py-3 rounded-md font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-secondary hover:text-charcoal transition">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}