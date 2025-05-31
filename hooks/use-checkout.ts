"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

export function useCheckout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (checkoutData: any) => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Checkout failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Redirect to order confirmation page
      router.push(`/order-confirmation?order_id=${data.data.order_id}`)
    },
    onError: (error) => {
      console.error("Checkout error:", error)
      alert(error.message || "Checkout failed. Please try again.")
    },
  })
}
