"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { CheckoutInput } from "@/types/api"

interface CheckoutResponse {
  order_id: string
  total_amount: number
  status: string
  message: string
}

export function useCheckout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: CheckoutInput): Promise<CheckoutResponse> => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Checkout failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Order placed successfully!")
      router.push(`/order-confirmation?order_id=${data.order_id}`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process checkout")
    },
  })
}
