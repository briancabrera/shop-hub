"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useDebounce } from "@/hooks/use-debounce"

// Modificar el hook para usar el initialQuery
export function useSearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300) // 300ms debounce

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      apiClient.search.products({
        query: debouncedQuery,
        limit: 8,
      }),
    enabled: debouncedQuery.length >= 2, // Only search if query is at least 2 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery)
    if (newQuery.length >= 2) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setQuery("")
    setIsOpen(false)
  }, [])

  const closeResults = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openResults = useCallback(() => {
    if (query.length >= 2) {
      setIsOpen(true)
    }
  }, [query])

  // Close results when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  return {
    query,
    searchResults: searchResults || { results: [], total: 0, query: "", suggestions: [] },
    isLoading: isLoading && debouncedQuery.length >= 2,
    error,
    isOpen,
    handleSearch,
    clearSearch,
    closeResults,
    openResults,
  }
}
