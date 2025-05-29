"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface Category {
  value: string
  label: string
  count: number
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.categories.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error instanceof Error && error.message.includes("4")) {
        return false
      }
      return failureCount < 2
    },
  })
}
