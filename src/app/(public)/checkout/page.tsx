"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/components/cart/cart-context"
import { useSession } from "next-auth/react"

type Address = {
  id: string
  name: string
  phone: string
  address: string
  city: string
  province: string
  postal: string
  default: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, count, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState("")
  const [shippingSettings, setShippingSettings] = useState({ freeShippingThreshold: 5000, standardShipping: 250, expressShipping: 500 })

  const [formData, setFormData] = useState({
    // Customer Info
    name: "",
    email: "",
    phone: "",
    
    // Shipping Address
    address: "",
    city: "",
    province: "",
    postal: "",
    
    // Delivery Method
    deliveryMethod: "standard",
    
    // Payment Method
    paymentMethod: "cod",
  })

  const [addresses, setAddresses] = useState<Address[]>([])
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState("")

  const provinces = [
    "Punjab", "Sindh", "KPK", "Balochistan", 
    "Islamabad", "Gilgit-Baltistan", "Azad Kashmir"
  ]

  const cities = [
    "Lahore", "Karachi", "Islamabad", "Rawalpindi", 
    "Faisalabad", "Multan", "Gujranwala", "Peshawar", 
    "Quetta", "Sialkot", "Hyderabad"
  ]

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then(res => res.json()).then(data => {
      if (data.settings) setShippingSettings({ freeShippingThreshold: Number(data.settings.freeShippingThreshold), standardShipping: Number(data.settings.standardShipping), expressShipping: Number(data.settings.expressShipping) })
    }).catch(() => {})
  }, [])

  // Calculate shipping
  const shippingCost = formData.deliveryMethod === "express" ? shippingSettings.expressShipping : total >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShipping
  const discount = appliedCoupon?.discount ?? 0
  const grandTotal = Math.max(0, total - discount + shippingCost)

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) {
      setCouponMessage("Enter a coupon code")
      return
    }
    setCouponLoading(true)
    setCouponMessage("")
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map(item => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, price: item.price })),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setAppliedCoupon(null)
        setCouponMessage(data.error || "Invalid coupon")
        return
      }
      setCouponCode(data.code)
      setAppliedCoupon({ code: data.code, discount: Number(data.discount) })
      setCouponMessage(data.message || "Coupon applied")
    } catch {
      setAppliedCoupon(null)
      setCouponMessage("Unable to validate coupon. Please try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponMessage("")
  }

  // Load user addresses if logged in
  useEffect(() => {
    if (session?.user) {
      fetch("/api/addresses")
        .then(res => res.json())
        .then(data => {
          if (data.addresses) {
            setAddresses(data.addresses)
            const defaultAddr = data.addresses.find((a: Address) => a.default)
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
              setUseSavedAddress(true)
            }
          }
        })
        .catch(() => {})
    }
  }, [session])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.push("/cart")
    }
  }, [items, router, orderPlaced])

  const handleAddressSelect = (addressId: string) => {
    const addr = addresses.find(a => a.id === addressId)
    if (addr) {
      setSelectedAddressId(addressId)
      setFormData({
        ...formData,
        name: addr.name,
        phone: addr.phone,
        address: addr.address,
        city: addr.city,
        province: addr.province,
        postal: addr.postal,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        address: {
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal: formData.postal,
        },
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: total,
        shipping: shippingCost,
        total: grandTotal,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const data = await response.json()
        setOrderNumber(data.orderNumber)
        localStorage.setItem("last_order_number", data.orderNumber)
        setOrderPlaced(true)
        clearCart()
        setStep(4)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to place order")
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  // Order Confirmation Page
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg border border-cream p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="font-editorial text-3xl font-semibold">Order Placed Successfully!</h1>
            <p className="text-secondary mt-2">Thank you for your order</p>
            <div className="bg-cream p-4 rounded-lg mt-6 inline-block">
              <p className="text-sm text-secondary">Order Number</p>
              <p className="font-mono text-xl font-bold">#{orderNumber}</p>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-secondary">Your order has been received and is being prepared.</p>
              <p className="text-sm text-secondary">You can track your order status in your account.</p>
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <Link href="/" className="bg-charcoal text-white px-6 py-3 rounded font-medium hover:bg-charcoal/80 transition">
                Continue Shopping
              </Link>
              <Link href="/account/orders" className="border border-charcoal text-charcoal px-6 py-3 rounded font-medium hover:bg-charcoal hover:text-white transition">
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if step validation passes
  const canProceed = () => {
    if (step === 1) {
      return formData.name && formData.email && formData.phone
    }
    if (step === 2) {
      return formData.address && formData.city && formData.province && formData.postal
    }
    if (step === 3) {
      return formData.deliveryMethod && formData.paymentMethod
    }
    return true
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart" className="text-secondary hover:text-charcoal transition">
            ← Back to Cart
          </Link>
          <h1 className="font-editorial text-3xl font-semibold">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Form */}
          <div className="flex-1">
            {/* Steps Progress */}
            <div className="flex items-center gap-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s === step ? "bg-charcoal text-white" :
                    s < step ? "bg-green-500 text-white" :
                    "bg-cream text-secondary border border-cream"
                  }`}>
                    {s < step ? "✓" : s}
                  </div>
                  <span className={`text-sm ${s === step ? "font-medium" : "text-secondary"}`}>
                    {s === 1 ? "Info" : s === 2 ? "Address" : "Payment"}
                  </span>
                  {s < 3 && <span className="text-secondary">→</span>}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-cream p-6">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Customer Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Customer Information</h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                        placeholder="Your Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                        placeholder="+92 300 1234567"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="w-full bg-charcoal text-white py-3 rounded font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
                    >
                      Continue to Address
                    </button>
                  </div>
                )}

                {/* Step 2: Shipping Address */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Shipping Address</h2>

                    {session && addresses.length > 0 && (
                      <div className="bg-cream p-4 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSavedAddress}
                            onChange={(e) => setUseSavedAddress(e.target.checked)}
                          />
                          <span className="text-sm font-medium">Use saved address</span>
                        </label>

                        {useSavedAddress && (
                          <select
                            value={selectedAddressId}
                            onChange={(e) => handleAddressSelect(e.target.value)}
                            className="w-full mt-2 px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                          >
                            {addresses.map((addr) => (
                              <option key={addr.id} value={addr.id}>
                                {addr.name} - {addr.address}, {addr.city}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">Address *</label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                        placeholder="Street, House/Office No."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <select
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Province *</label>
                      <select
                        required
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                      >
                        <option value="">Select Province</option>
                        {provinces.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.postal}
                        onChange={(e) => setFormData({ ...formData, postal: e.target.value })}
                        className="w-full px-4 py-2 border border-cream rounded focus:outline-none focus:border-charcoal"
                        placeholder="54000"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-cream py-3 rounded font-medium hover:bg-cream transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className="flex-1 bg-charcoal text-white py-3 rounded font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Payment Method</h2>

                    {/* Delivery Method */}
                    <div>
                      <h3 className="font-medium mb-2">Delivery Method</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border border-cream rounded-lg cursor-pointer hover:bg-cream/50 transition">
                          <input
                            type="radio"
                            name="delivery"
                            value="standard"
                            checked={formData.deliveryMethod === "standard"}
                            onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                          />
                          <div>
                            <p className="font-medium">Standard Delivery</p>
                            <p className="text-sm text-secondary">2-3 business days</p>
                          </div>
                          <span className="ml-auto font-medium">PKR {shippingSettings.standardShipping.toLocaleString()}</span>
                        </label>
                        
                        <label className="flex items-center gap-3 p-3 border border-cream rounded-lg cursor-pointer hover:bg-cream/50 transition">
                          <input
                            type="radio"
                            name="delivery"
                            value="express"
                            checked={formData.deliveryMethod === "express"}
                            onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                          />
                          <div>
                            <p className="font-medium">Express Delivery</p>
                            <p className="text-sm text-secondary">1-2 business days</p>
                          </div>
                          <span className="ml-auto font-medium">PKR {shippingSettings.expressShipping.toLocaleString()}</span>
                        </label>
                      </div>
                    </div>

                    {/* Payment Method - Cash on Delivery only */}
                    <div>
                      <h3 className="font-medium mb-2">Payment Method</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-4 border-2 border-charcoal rounded-lg cursor-pointer bg-cream/30">
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={formData.paymentMethod === "cod"}
                            onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                          />
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-secondary">Pay when you receive your order</p>
                          </div>
                        </label>
                        <p className="text-xs text-secondary mt-2">
                          Online card and digital payment options will be added later.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 border border-cream py-3 rounded font-medium hover:bg-cream transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !canProceed()}
                        className="flex-1 bg-charcoal text-white py-3 rounded font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
                      >
                        {loading ? "Placing Order..." : `Place Order • PKR ${grandTotal.toLocaleString()}`}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg border border-cream p-6 sticky top-20">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-secondary">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">PKR {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-cream mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Subtotal ({count} items)</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Shipping</span>
                  <span>{shippingCost === 0 ? "FREE" : "PKR " + shippingCost.toLocaleString()}</span>
                </div>
                {formData.deliveryMethod === "standard" && total < shippingSettings.freeShippingThreshold && (
                  <p className="text-xs text-amber-600">
                    Add PKR {(shippingSettings.freeShippingThreshold - total).toLocaleString()} more for FREE shipping
                  </p>
                )}
                <div className="border-t border-cream mt-4 pt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon || couponLoading}
                      placeholder="Coupon code"
                      className="min-w-0 flex-1 px-3 py-2 border border-cream rounded focus:outline-none focus:border-charcoal uppercase"
                    />
                    {appliedCoupon ? (
                      <button type="button" onClick={removeCoupon} className="px-3 py-2 border border-cream rounded text-sm hover:bg-cream transition">Remove</button>
                    ) : (
                      <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-3 py-2 bg-charcoal text-white rounded text-sm disabled:opacity-50">{couponLoading ? "..." : "Apply"}</button>
                    )}
                  </div>
                  {couponMessage && <p className={`text-xs mt-2 ${appliedCoupon ? "text-green-700" : "text-red-600"}`}>{couponMessage}</p>}
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>- PKR {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-cream pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>PKR {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}