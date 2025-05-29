"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { supabaseClient } from "@/lib/supabase/client"
import type { Cart, CartItemInput } from "@/types"

const EMPTY_CART: Cart = { items: [], total: 0 }

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async (): Promise<Cart> => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session?.user) {
          return EMPTY_CART
        }

        return await apiClient.cart.get()
      } catch {
        return EMPTY_CART
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (item: CartItemInput) => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session?.user) {
        throw new Error("Please sign in to add items to your cart")
      }

      await apiClient.cart.add(item)
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
    mutationFn: async (itemId: string) => {
      await apiClient.cart.remove(itemId)
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
