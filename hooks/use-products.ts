"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ProductFilters, ProductCreateInput } from "@/types/api"
import { useToast } from "@/hooks/use-toast"

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      console.log("Fetching products with filters:", filters) // Debug log
      const result = await apiClient.products.getAll(filters)
      console.log("Products fetched:", result?.data?.length || 0, "of", result?.pagination?.total || 0) // Debug log
      return result
    },
    staleTime: 2 * 60 * 1000, // Reduce to 2 minutes for better filter responsiveness
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error instanceof Error && error.message.includes("4")) {
        return false
      }
      return failureCount < 2
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Enable refetch on mount
    refetchOnReconnect: false,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => apiClient.products.getById(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("4")) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for individual products
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: ProductCreateInput) => apiClient.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast({
        title: "Success",
        description: "Product created successfully",
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
