"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState } from "react"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [email, setEmail] = useState(session?.user?.email || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(""); setError("")
    const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) })
    const data = await response.json()
    if (!response.ok) setError(data.error || "Could not save changes")
    else { await update({ name: data.user.name, email: data.user.email }); setMessage("Your profile has been updated.") }
    setSaving(false)
  }

  return <div className="min-h-screen bg-[#24211c] py-10"><div className="max-w-3xl mx-auto px-4">
    <Link href="/account" className="text-sm text-[#b9b0a2] hover:text-[#f5f0e7]">← Back to account</Link>
    <div className="mt-6 bg-[#171615] border border-[#3a3328] rounded-2xl p-6 md:p-10">
      <p className="text-xs uppercase tracking-[0.22em] text-[#b9b0a2]">Account settings</p><h1 className="font-editorial text-4xl mt-2">Profile</h1>
      <p className="text-[#b9b0a2] mt-2">Keep your contact details up to date for a smoother checkout.</p>
      <form onSubmit={save} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">Full name<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full border border-[#3a3328] rounded-lg px-4 py-3 outline-none focus:border-[#c6a15b]" required /></label>
        <label className="block text-sm font-medium">Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full border border-[#3a3328] rounded-lg px-4 py-3 outline-none focus:border-[#c6a15b]" required /></label>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{message}</div>}
        <button disabled={saving} className="bg-[#c6a15b] text-[#171615] rounded-lg px-6 py-3 font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  </div></div>
}
