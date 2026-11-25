"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type RecoveryState = "checking" | "ready" | "invalid" | "success"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [state, setState] = useState<RecoveryState>("checking")
  const [accessToken, setAccessToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const readRecovery = () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const token = hash.get("access_token") || ""
      const type = hash.get("type")
      if (token && type === "recovery") {
        setAccessToken(token)
        setState("ready")
        window.history.replaceState(null, "", window.location.pathname + window.location.search)
      } else if (window.location.hash || window.location.search.includes("error=")) {
        setState("invalid")
      } else {
        setState("invalid")
      }
    }
    readRecovery()
    window.addEventListener("hashchange", readRecovery)
    return () => window.removeEventListener("hashchange", readRecovery)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.")
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey || !accessToken) {
      setError("This password reset link is invalid or has expired. Request a new one.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
        cache: "no-store",
      })
      if (!response.ok) {
        setError("This reset link has expired or is no longer valid. Request a new link.")
        return
      }
      setState("success")
      window.setTimeout(() => router.replace("/login"), 2500)
    } catch {
      setError("We could not update your password. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-cream px-4 py-16">
      <section className="mx-auto max-w-md rounded-xl border border-cream bg-white p-8 shadow-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-[.24em] text-secondary">NOORÉ Account Security</p>
        <h1 className="mt-3 text-center font-editorial text-3xl font-semibold">Create a new password</h1>
        {state === "checking" && <p className="mt-6 text-center text-sm text-secondary">Checking your secure reset link…</p>}
        {state === "invalid" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-red-700">This password reset link is invalid or has expired.</p>
            <Link href="/forgot-password" className="mt-5 inline-block font-medium underline">Request another reset link</Link>
          </div>
        )}
        {state === "success" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-green-700">Your password has been updated successfully.</p>
            <p className="mt-2 text-xs text-secondary">Taking you to sign in…</p>
            <Link href="/login" className="mt-5 inline-block font-medium underline">Sign in now</Link>
          </div>
        )}
        {state === "ready" && (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-medium">New password
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-cream px-3 py-3 outline-none focus:border-charcoal" />
            </label>
            <label className="block text-sm font-medium">Confirm new password
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-md border border-cream px-3 py-3 outline-none focus:border-charcoal" />
            </label>
            {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={saving} type="submit" className="w-full rounded-md bg-charcoal px-5 py-3 font-medium text-white disabled:opacity-50">{saving ? "Updating password…" : "Update password"}</button>
          </form>
        )}
        <p className="mt-7 text-center text-sm"><Link href="/login" className="text-secondary underline">Back to sign in</Link></p>
      </section>
    </main>
  )
}
