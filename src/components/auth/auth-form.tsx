"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type AuthFormProps = {
  type: "login" | "register"
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (type === "register") {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }

      // Register
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || "Registration failed")
          setLoading(false)
          return
        }

        // Auto-login after registration
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          setError(result.error)
        } else {
          router.push("/account")
          router.refresh()
        }
      } catch (error) {
        setError("Something went wrong")
      }
    } else {
      // Login
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
      } catch (error) {
        setError("Something went wrong")
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg border border-cream p-8">
      <div className="text-center mb-8">
        <h1 className="font-editorial text-3xl font-semibold">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-secondary text-sm mt-2">
          {type === "login" 
            ? "Sign in to your NOORÉ account" 
            : "Join the NOORÉ family"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "register" && (
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              placeholder="Your Name"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
            placeholder={type === "login" ? "Enter your password" : "Min 6 characters"}
          />
        </div>

        {type === "register" && (
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              placeholder="Confirm your password"
            />
          </div>
        )}

        {type === "login" && (
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-secondary hover:text-charcoal transition">
              Forgot Password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-charcoal text-white py-3 rounded-md font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
        >
          {loading 
            ? "Loading..." 
            : type === "login" 
              ? "Sign In" 
              : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-secondary">
          {type === "login" ? "Don't have an account?" : "Already have an account?"}
        </span>
        <Link
          href={type === "login" ? "/register" : "/login"}
          className="ml-2 text-charcoal font-medium hover:underline"
        >
          {type === "login" ? "Sign Up" : "Sign In"}
        </Link>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cream"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-secondary">Or continue with</span>
        </div>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/account" })}
        className="w-full border border-cream py-3 rounded-md font-medium hover:bg-cream transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </button>
    </div>
  )
}