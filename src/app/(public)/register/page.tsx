"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to login with success message
        router.push("/login?registered=true")
      } else {
        setError(data.error || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#D8D8CB] p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-editorial text-3xl font-semibold">Create Account</h1>
          <p className="text-secondary text-sm mt-2">Join the NOORÉ community</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-[#D8D8CB] rounded focus:outline-none focus:border-[#535F4C]"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-[#D8D8CB] rounded focus:outline-none focus:border-[#535F4C]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-[#D8D8CB] rounded focus:outline-none focus:border-[#535F4C]"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-[#D8D8CB] rounded focus:outline-none focus:border-[#535F4C]"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#535F4C] text-[#F7F6F2] py-3 rounded font-medium hover:bg-[#465340] transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-secondary">Already have an account?</span>{" "}
          <Link href="/login" className="text-[#535F4C] font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}