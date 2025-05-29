"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CartItem } from "@/types/api"
import { useToast } from "@/hooks/use-toast"
import { supabaseClient } from "@/lib/db-client"

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        // Check if user is authenticated first
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session) {
          // Return empty cart if not authenticated
          return { items: [], total: 0 }
        }

        return apiClient.cart.get()
      } catch (error) {
        console.warn("Cart fetch error:", error)
        // Return empty cart on error
        return { items: [], total: 0 }
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && (error.message.includes("sign in") || error.message.includes("401"))) {
        return false
      }
      return failureCount < 2
    },
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (item: CartItem) => {
      // Check if user is authenticated first
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session) {
        throw new Error("Please sign in to add items to cart")
      }

      return apiClient.cart.add(item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
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

export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (itemId?: string) => {
      // Check if user is authenticated first
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session) {
        throw new Error("Please sign in to modify cart")
      }

      return apiClient.cart.remove(itemId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
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

export function useClearCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      // Check if user is authenticated first
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session) {
        throw new Error("Please sign in to clear cart")
      }

      return apiClient.cart.clear()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
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
