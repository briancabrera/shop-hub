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

        if (!session?.user) {
          console.log("useCart: No session, returning empty cart")
          return { items: [], total: 0 }
        }

        console.log("useCart: Fetching cart for user:", session.user.email)
        return await apiClient.cart.get()
      } catch (error) {
        console.warn("useCart: Error fetching cart, returning empty cart:", error)
        return { items: [], total: 0 }
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (item: CartItem) => {
      // Check authentication before adding to cart
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session?.user) {
        throw new Error("Please log in to add items to your cart")
      }

      console.log("useAddToCart: Adding item to cart:", item)
      return await apiClient.cart.add(item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      })
    },
    onError: (error: Error) => {
      console.error("useAddToCart: Error adding to cart:", error)
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
      return await apiClient.cart.clear()
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
