"use client"

import { useState, useEffect } from "react"
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

type StripePaymentProps = {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

function CheckoutForm({ amount, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Create payment intent
    fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || "Failed to initialize payment")
        }
      })
      .catch(() => setError("Failed to initialize payment"))
  }, [amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError("")

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      onError(submitError.message || "Payment failed")
    } else {
      onSuccess("payment_success")
    }

    setLoading(false)
  }

  if (!clientSecret) {
    return <div className="text-center py-4">Loading payment...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-charcoal text-white py-3 rounded font-medium hover:bg-charcoal/80 transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay PKR " + amount.toLocaleString()}
      </button>
    </form>
  )
}

export function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}