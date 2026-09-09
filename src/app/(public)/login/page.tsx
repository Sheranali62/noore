"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PULL_THRESHOLD = 58
const MAX_PULL = 92

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focused, setFocused] = useState<"email" | "password" | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const openLogin = () => {
    setUnlocked(true)
    setPullDistance(Math.max(pullDistance, PULL_THRESHOLD))
    setPulling(false)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (unlocked) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.startY = String(event.clientY)
    setPulling(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pulling || unlocked) return
    const startY = Number(event.currentTarget.dataset.startY || event.clientY)
    const distance = Math.max(0, Math.min(MAX_PULL, event.clientY - startY))
    setPullDistance(distance)
  }

  const finishPull = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pulling) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    event.currentTarget.dataset.startY = ""
    setPulling(false)
    if (pullDistance >= PULL_THRESHOLD) {
      openLogin()
    } else {
      setPullDistance(0)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (unlocked) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openLogin()
    }
  }

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
    <div className={`noore-login-screen fixed inset-0 z-[200] overflow-y-auto ${unlocked ? "is-unlocked" : "is-locked"}`}>
      <div className="noore-login-noise" aria-hidden="true" />
      <div className="noore-login-orb noore-login-orb-one" aria-hidden="true" />
      <div className="noore-login-orb noore-login-orb-two" aria-hidden="true" />

      <div className="noore-login-inner relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="noore-login-grid grid w-full items-center gap-10 lg:grid-cols-[1fr_480px] lg:gap-20">
          {/* Lamp / unlock scene */}
          <div className="noore-login-entrance">
            <div className="mb-8 flex items-center gap-3 text-[#d6ae72]">
              <span className="h-px w-12 bg-[#d6ae72]/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.42em]">NOORÉ PRIVATE ACCESS</span>
            </div>

            <h1 className="noore-login-heading max-w-xl font-serif text-6xl leading-[0.9] tracking-[-0.045em] text-[#f8eee5] sm:text-7xl xl:text-8xl">
              Welcome
              <br />
              <span className="text-[#d6ae72]">back.</span>
            </h1>

            <p className="noore-login-intro mt-7 max-w-md text-sm leading-7 text-white/48">
              Pull the cord below to turn on the light and enter your private NOORÉ wardrobe.
            </p>

            <div className="noore-lamp-scene mt-10 sm:mt-14">
              <div className={`noore-lamp ${pulling ? "is-pulling" : ""} ${unlocked ? "is-active" : ""}`} aria-hidden="true">
                <div className="noore-lamp-glow" />
                <div className="noore-lamp-shade" />
                <div className="noore-lamp-stem" />
                <div className="noore-lamp-base" />
                <div className="noore-lamp-pull-line" style={{ height: `${47 + pullDistance}px` }} />
              </div>

              <div className="noore-pull-control-wrap">
                <div
                  className={`noore-pull-control ${pulling ? "is-pulling" : ""} ${unlocked ? "is-done" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Pull the lamp cord to open sign in"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishPull}
                  onPointerCancel={finishPull}
                  onKeyDown={handleKeyDown}
                  style={{ transform: `translateY(${pullDistance}px)` }}
                >
                  <span className="noore-pull-line" />
                  <span className="noore-pull-knob">
                    <span />
                  </span>
                </div>
                <p className="noore-pull-label">
                  {unlocked ? "Light on · welcome in" : pulling ? "Keep pulling…" : "Pull to enter"}
                </p>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className={`noore-login-card-shell ${unlocked ? "is-visible" : ""}`} aria-hidden={!unlocked}>
            <div className="noore-login-card">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#d6ae72]">NOORÉ</p>
                  <h2 className="mt-2 font-serif text-4xl tracking-[-0.03em] text-[#f8eee5]">Sign in</h2>
                  <p className="mt-2 text-xs text-white/42">Welcome back to your wardrobe.</p>
                </div>
                <div className="noore-login-mark" aria-hidden="true"><span>N</span></div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/38">Email address</label>
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
                      tabIndex={unlocked ? 0 : -1}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/38">Password</label>
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
                      tabIndex={unlocked ? 0 : -1}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" tabIndex={unlocked ? 0 : -1} className="text-[10px] font-semibold text-[#d6ae72] transition hover:text-[#f1d39c]">Forgot password?</Link>
                </div>

                <button type="submit" disabled={loading} tabIndex={unlocked ? 0 : -1} className="noore-login-button">
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
                New to NOORÉ? <Link href="/register" tabIndex={unlocked ? 0 : -1} className="font-semibold text-[#f5dfba] transition hover:text-white">Create an account</Link>
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
