"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { supabaseClient } from "@/lib/supabase/client"
import type { CartItemInput } from "@/types"

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session?.user) {
          return {
            items: [],
            total: 0,
            original_total: 0,
            total_savings: 0,
            product_items: [],
            deal_items: [],
            bundle_items: [],
          }
        }

        return await apiClient.cart.get()
      } catch (error) {
        console.error("Error fetching cart:", error)
        return {
          items: [],
          total: 0,
          original_total: 0,
          total_savings: 0,
          product_items: [],
          deal_items: [],
          bundle_items: [],
        }
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (item: CartItemInput) => {
      console.log("useAddToCart: Adding item to cart:", item)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session?.user) {
        throw new Error("Please sign in to add items to your cart")
      }

      try {
        const result = await apiClient.cart.add(item)
        console.log("useAddToCart: Success response:", result)
        return result
      } catch (error) {
        console.error("useAddToCart: Error adding to cart:", error)
        throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })

      let message = "Item has been added to your cart"
      if (variables.item_type === "deal") {
        message = "Deal has been added to your cart"
      } else if (variables.item_type === "bundle") {
        message = "Bundle has been added to your cart"
      }

      toast({
        title: "Added to cart",
        description: message,
      })
    },
    onError: (error: Error) => {
      console.error("useAddToCart onError:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      })
    },
  })
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (itemId: string) => {
      return await apiClient.cart.remove(itemId)
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
        description: error.message || "Failed to remove item from cart",
        variant: "destructive",
      })
    },
  })
}
