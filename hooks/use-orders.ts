"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => apiClient.orders.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (sessionId: string) => apiClient.orders.create(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Order confirmed",
        description: "Your order has been placed successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
