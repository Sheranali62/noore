"use client"

import { useState } from "react"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "NOORÉ",
    announcementText: "FREE SHIPPING ON ORDERS ABOVE PKR 5,000",
    freeShippingThreshold: "5000",
    standardShipping: "250",
    expressShipping: "500",
    currency: "PKR",
  })

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Site Settings */}
        <div className="bg-white rounded-lg border border-cream p-6">
          <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-white rounded-lg border border-cream p-6">
          <h2 className="text-xl font-semibold mb-4">Announcement Bar</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Announcement Text</label>
            <input
              type="text"
              value={settings.announcementText}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
            />
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white rounded-lg border border-cream p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Free Shipping Threshold</label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Standard Shipping (PKR)</label>
              <input
                type="number"
                value={settings.standardShipping}
                onChange={(e) => setSettings({ ...settings, standardShipping: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Express Shipping (PKR)</label>
              <input
                type="number"
                value={settings.expressShipping}
                onChange={(e) => setSettings({ ...settings, expressShipping: e.target.value })}
                className="w-full px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="bg-charcoal text-white px-6 py-2 rounded hover:bg-charcoal/80 transition">
            Save Settings
          </button>
          <button className="border border-cream px-6 py-2 rounded hover:bg-cream transition">
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}