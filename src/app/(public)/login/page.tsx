"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focused, setFocused] = useState<"email" | "password" | null>(null)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/account")
        router.refresh()
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="noore-login-screen fixed inset-0 z-[200] overflow-y-auto">
      <div className="noore-login-noise" aria-hidden="true" />
      <div className="noore-login-orb noore-login-orb-one" aria-hidden="true" />
      <div className="noore-login-orb noore-login-orb-two" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_480px] lg:gap-20">
          {/* Editorial side */}
          <div className="hidden lg:block">
            <div className="mb-8 flex items-center gap-3 text-[#d6ae72]">
              <span className="h-px w-12 bg-[#d6ae72]/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.42em]">NOORÉ PRIVATE ACCESS</span>
            </div>
            <h1 className="max-w-xl font-serif text-7xl leading-[0.9] tracking-[-0.045em] text-[#f8eee5] xl:text-8xl">
              Welcome
              <br />
              <span className="text-[#d6ae72]">back.</span>
            </h1>
            <p className="mt-8 max-w-md text-sm leading-7 text-white/48">
              Enter your private space to follow orders, save pieces and continue your NOORÉ wardrobe edit.
            </p>

            <div className="mt-14 flex items-end gap-6">
              <div className={`noore-lamp ${focused ? "is-active" : ""}`} aria-hidden="true">
                <div className="noore-lamp-glow" />
                <div className="noore-lamp-shade" />
                <div className="noore-lamp-stem" />
                <div className="noore-lamp-base" />
                <div className="noore-lamp-pull" />
              </div>
              <div className="pb-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#d6ae72]">Quiet luxury</p>
                <p className="mt-2 text-xs leading-5 text-white/35">A calm, considered entrance to your account.</p>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="relative">
            <div className="noore-login-card">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#d6ae72]">NOORÉ</p>
                  <h2 className="mt-2 font-serif text-4xl tracking-[-0.03em] text-[#f8eee5]">Sign in</h2>
                  <p className="mt-2 text-xs text-white/42">Welcome back to your wardrobe.</p>
                </div>
                <div className="noore-login-mark" aria-hidden="true">
                  <span>N</span>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/38">
                    Email address
                  </label>
                  <div className={`noore-login-field ${focused === "email" ? "is-focused" : ""}`}>
                    <span className="noore-field-icon" aria-hidden="true">@</span>
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/38">
                    Password
                  </label>
                  <div className={`noore-login-field ${focused === "password" ? "is-focused" : ""}`}>
                    <span className="noore-field-icon" aria-hidden="true">••</span>
                    <input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={formData.password}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-[10px] font-semibold text-[#d6ae72] transition hover:text-[#f1d39c]">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} className="noore-login-button">
                  <span>{loading ? "Signing in…" : "Sign in"}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </form>

              <div className="my-7 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[8px] uppercase tracking-[0.2em] text-white/22">or</span>
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <p className="text-center text-xs text-white/38">
                New to NOORÉ?{" "}
                <Link href="/register" className="font-semibold text-[#f5dfba] transition hover:text-white">
                  Create an account
                </Link>
              </p>

              <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-5 text-[8px] uppercase tracking-[0.18em] text-white/22">
                <span>Secure access</span>
                <span>Pakistan · NOORÉ</span>
              </div>
            </div>

            <div className="noore-login-card-glow" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
