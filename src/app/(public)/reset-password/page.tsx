"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy"

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const token = hash.get("access_token") || ""
    const type = hash.get("type")
    if (token && type === "recovery") setAccessToken(token)
    else setError("This reset link is invalid or has expired. Please request a new one.")
    setReady(true)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (!accessToken) return setError("Please request a new password reset link.")
    if (!isStrongPassword(password)) return setError(PASSWORD_POLICY_MESSAGE)
    if (password !== confirmPassword) return setError("The passwords do not match.")

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
        cache: "no-store",
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || "This reset link has expired. Please request another.")
      }

      window.history.replaceState({}, document.title, window.location.pathname)
      setAccessToken("")
      setPassword("")
      setConfirmPassword("")
      setMessage(
        result.sessionsRevoked
          ? "Your password has been updated and existing NOORÉ sessions have been revoked. You can now sign in."
          : "Your password has been updated. Please sign out of other devices and sign in again; automatic session revocation could not be confirmed."
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-cream px-4 py-16">
      <section className="mx-auto max-w-md rounded-lg border border-cream bg-white p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ Account</p>
        <h1 className="mt-3 text-center font-editorial text-3xl font-semibold">Create a new password</h1>
        <p className="mt-2 text-center text-sm text-secondary">Choose a strong password for your account.</p>
        {!ready ? <p className="mt-8 text-center text-sm text-secondary">Checking your reset link…</p> : message ? (
          <div className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-800">{message}<Link href="/login" className="mt-4 block font-semibold underline">Continue to sign in</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded border border-cream px-3 py-3 outline-none focus:border-charcoal" /></label>
            <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded border border-cream px-3 py-3 outline-none focus:border-charcoal" /></label>
            <p className="text-xs text-secondary">{PASSWORD_POLICY_MESSAGE}</p>
            <button type="submit" disabled={loading || !accessToken} className="w-full rounded-md bg-charcoal px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Updating…" : "Update password"}</button>
          </form>
        )}
        <Link href="/login" className="mt-6 block text-center text-sm text-secondary underline">Back to login</Link>
      </section>
    </main>
  )
}
