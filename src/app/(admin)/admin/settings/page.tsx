"use client"

import { useEffect, useState } from "react"

const defaults = {
  siteName: "NOORÉ",
  announcementText: "FREE SHIPPING ON ORDERS ABOVE PKR 5,000",
  freeShippingThreshold: "5000",
  standardShipping: "250",
  expressShipping: "500",
  currency: "PKR",
}

type Settings = typeof defaults

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to load settings")
        setSettings({ ...defaults, ...data.settings })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: keyof Settings, value: string) => setSettings(current => ({ ...current, [key]: value }))

  const save = async () => {
    setSaving(true); setMessage(""); setError("")
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to save settings")
      setSettings({ ...defaults, ...data.settings })
      setMessage("Settings saved successfully.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally { setSaving(false) }
  }

  const reset = () => { setSettings(defaults); setMessage(""); setError("") }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold mb-2">Settings</h1>
      <p className="text-secondary mb-8">Manage store-wide information and delivery pricing.</p>
      {loading ? <div className="bg-white rounded-lg border border-cream p-6">Loading settings...</div> : (
        <div className="space-y-6">
          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site Name" value={settings.siteName} onChange={v => update("siteName", v)} />
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select value={settings.currency} onChange={e => update("currency", e.target.value)} className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal">
                  <option value="PKR">PKR</option><option value="USD">USD</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-xl font-semibold mb-4">Announcement Bar</h2>
            <Field label="Announcement Text" value={settings.announcementText} onChange={v => update("announcementText", v)} />
          </section>

          <section className="bg-white rounded-lg border border-cream p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Free Shipping Threshold" type="number" value={settings.freeShippingThreshold} onChange={v => update("freeShippingThreshold", v)} />
              <Field label="Standard Shipping (PKR)" type="number" value={settings.standardShipping} onChange={v => update("standardShipping", v)} />
              <Field label="Express Shipping (PKR)" type="number" value={settings.expressShipping} onChange={v => update("expressShipping", v)} />
            </div>
          </section>

          {error && <div className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          {message && <div className="rounded-md bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>}
          <div className="flex gap-4">
            <button onClick={save} disabled={saving} className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 disabled:opacity-50">{saving ? "Saving..." : "Save Settings"}</button>
            <button onClick={reset} disabled={saving} className="border border-cream px-6 py-2 rounded hover:bg-cream disabled:opacity-50">Reset Form</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} min={type === "number" ? 0 : undefined} className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal" />
  </div>
}
