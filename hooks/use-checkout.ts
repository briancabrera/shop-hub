"use client"

import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CheckoutInput } from "@/types/api"
import { useToast } from "@/hooks/use-toast"

export function useCheckout() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CheckoutInput) => apiClient.checkout.create(data),
    onSuccess: (data: { checkout_url: string }) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkout_url
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
