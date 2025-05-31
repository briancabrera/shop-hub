"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAdvancedSearch } from "@/hooks/use-advanced-search"
import { SearchResults } from "./search-results"

interface SearchBarProps {
  placeholder?: string
  className?: string
  onResultClick?: () => void
  initialQuery?: string
  onSearchChange?: (query: string) => void
}

export function SearchBar(props: SearchBarProps) {
  const { placeholder = "Search products...", className = "", onResultClick, initialQuery = "", onSearchChange } = props

  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { query, searchResults, isLoading, isOpen, handleSearch, clearSearch, closeResults, openResults } =
    useAdvancedSearch(initialQuery)

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(query)
    }
  }, [query, onSearchChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || searchResults.results.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev < searchResults.results.length - 1 ? prev + 1 : prev))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < searchResults.results.length) {
            const selectedProduct = searchResults.results[selectedIndex]
            router.push(`/products/${selectedProduct.id}`)
            closeResults()
            if (onResultClick) onResultClick()
          } else if (query.trim()) {
            router.push(`/products?q=${encodeURIComponent(query.trim())}`)
            closeResults()
            if (onResultClick) onResultClick()
          }
          break
        case "Escape":
          closeResults()
          if (inputRef.current) inputRef.current.blur()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, searchResults.results, selectedIndex, query, router, closeResults, onResultClick])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        closeResults()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [closeResults])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchResults.results])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`)
      closeResults()
      if (onResultClick) onResultClick()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleSearch(value)
  }

  const handleClear = () => {
    clearSearch()
    if (inputRef.current) inputRef.current.focus()
  }

  const handleResultClick = (productId: string) => {
    router.push(`/products/${productId}`)
    closeResults()
    if (onResultClick) onResultClick()
  }

  const handleViewAllResults = () => {
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`)
      closeResults()
      if (onResultClick) onResultClick()
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={openResults}
            className="pl-10 pr-10 w-full"
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {query && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </form>

      {isOpen && (
        <SearchResults
          results={searchResults.results}
          suggestions={searchResults.suggestions}
          query={query}
          selectedIndex={selectedIndex}
          onResultClick={handleResultClick}
          onViewAllResults={handleViewAllResults}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
