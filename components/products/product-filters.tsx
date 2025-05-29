"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProductFilters as ProductFiltersType } from "@/types/api"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useCategories } from "@/hooks/use-categories"
import { useQuery } from "@tanstack/react-query"

interface ProductFiltersProps {
  onFilterChange: (filters: ProductFiltersType) => void
  initialFilters?: ProductFiltersType
}

export function ProductFilters({ onFilterChange, initialFilters = {} }: ProductFiltersProps) {
  const isInitialMount = useRef(true)
  const priceTimeoutRef = useRef<NodeJS.Timeout>()
  const lastInitialFiltersRef = useRef<ProductFiltersType>({})

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories || (initialFilters.category ? [initialFilters.category] : []),
  )

  const [priceRange, setPriceRange] = useState([initialFilters.minPrice || 0, initialFilters.maxPrice || 2500])

  const [minRating, setMinRating] = useState(initialFilters.minRating || 0)

  // Replace the existing useQuery and categories logic with:

  // Replace the existing useQuery for products with:
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()

  // Remove the old categories extraction logic and replace with:
  // categories is now directly from the API

  // Calculate max price from products - UPDATED for new response structure
  const { data: productsResponse } = useQuery({
    queryKey: ["products", { limit: 100 }],
    queryFn: () => apiClient.products.getAll({ limit: 100 }),
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  const maxPrice = productsResponse?.data
    ? Math.ceil(Math.max(...productsResponse.data.map((p) => p.price), 0) / 100) * 100 // Round up to nearest 100
    : 2500

  // Function to build and send filters - SIMPLIFIED
  const sendFilters = useCallback(
    (categories: string[], price: number[], rating: number) => {
      const filters: ProductFiltersType = {}

      if (categories.length > 0) {
        filters.categories = categories
      }

      if (price[0] > 0) {
        filters.minPrice = price[0]
      }

      if (price[1] < maxPrice) {
        filters.maxPrice = price[1]
      }

      if (rating > 0) {
        filters.minRating = rating
      }

      // Preserve sort if it exists in initialFilters
      if (initialFilters.sort) {
        filters.sort = initialFilters.sort
      }

      console.log("Sending filters:", filters)
      onFilterChange(filters)
    },
    [maxPrice, onFilterChange, initialFilters.sort],
  )

  // Handle category change
  const handleCategoryChange = useCallback(
    (category: string, checked: boolean) => {
      console.log("Category change:", category, checked)

      setSelectedCategories((prev) => {
        const newCategories = checked ? [...prev, category] : prev.filter((c) => c !== category)
        console.log("New categories:", newCategories)

        // Send filters after state update
        setTimeout(() => sendFilters(newCategories, priceRange, minRating), 0)

        return newCategories
      })
    },
    [sendFilters, priceRange, minRating],
  )

  // Remove category - COMPLETELY REWRITTEN
  const handleRemoveCategory = useCallback(
    (categoryToRemove: string) => {
      console.log("=== REMOVE CATEGORY CLICKED ===")
      console.log("Category to remove:", categoryToRemove)
      console.log("Current categories:", selectedCategories)

      const newCategories = selectedCategories.filter((c) => c !== categoryToRemove)
      console.log("Categories after filter:", newCategories)

      setSelectedCategories(newCategories)

      // Send filters immediately
      sendFilters(newCategories, priceRange, minRating)
    },
    [selectedCategories, sendFilters, priceRange, minRating],
  )

  // Handle price range change with debouncing
  const handlePriceChange = useCallback(
    (newPriceRange: number[]) => {
      setPriceRange(newPriceRange)

      // Clear existing timeout
      if (priceTimeoutRef.current) {
        clearTimeout(priceTimeoutRef.current)
      }

      // Set new timeout for 500ms
      priceTimeoutRef.current = setTimeout(() => {
        sendFilters(selectedCategories, newPriceRange, minRating)
      }, 500)
    },
    [sendFilters, selectedCategories, minRating],
  )

  // Handle rating change
  const handleRatingChange = useCallback(
    (rating: number, checked: boolean) => {
      const newRating = checked ? rating : 0
      setMinRating(newRating)

      setTimeout(() => sendFilters(selectedCategories, priceRange, newRating), 0)
    },
    [sendFilters, selectedCategories, priceRange],
  )

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedCategories([])
    setPriceRange([0, maxPrice])
    setMinRating(0)

    // Preservar el término de búsqueda si existe
    const search = initialFilters.search ? { search: initialFilters.search } : {}
    onFilterChange(search)
  }, [maxPrice, onFilterChange, initialFilters.search])

  // Update price range when maxPrice changes
  useEffect(() => {
    if (maxPrice !== 2500 && priceRange[1] === 2500) {
      setPriceRange((prev) => [prev[0], maxPrice])
    }
  }, [maxPrice, priceRange])

  // Update state when initial filters change
  useEffect(() => {
    // Skip if initialFilters hasn't changed
    const currentInitialFilters = JSON.stringify(initialFilters)
    const lastInitialFilters = JSON.stringify(lastInitialFiltersRef.current)

    if (currentInitialFilters === lastInitialFilters) {
      return
    }

    // Update ref with new initialFilters
    lastInitialFiltersRef.current = initialFilters

    console.log("Initial filters changed:", initialFilters)

    const newCategories = initialFilters.categories || (initialFilters.category ? [initialFilters.category] : [])

    // Only update if categories have changed
    if (JSON.stringify(newCategories.sort()) !== JSON.stringify(selectedCategories.sort())) {
      console.log("Updating selected categories to:", newCategories)
      setSelectedCategories(newCategories)
    }

    // Update price range if needed
    const newMinPrice = initialFilters.minPrice || 0
    const newMaxPrice = initialFilters.maxPrice || maxPrice

    if (priceRange[0] !== newMinPrice || priceRange[1] !== newMaxPrice) {
      setPriceRange([newMinPrice, newMaxPrice])
    }

    // Update rating if needed
    const newRating = initialFilters.minRating || 0
    if (minRating !== newRating) {
      setMinRating(newRating)
    }
  }, [initialFilters, maxPrice, selectedCategories, priceRange, minRating])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (priceTimeoutRef.current) {
        clearTimeout(priceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected Categories */}
          {selectedCategories.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => {
                  const categoryLabel = categories.find((c) => c.value === category)?.label || category
                  return (
                    <div
                      key={category}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-md border"
                    >
                      <span>{categoryLabel}</span>
                      <button
                        onClick={() => {
                          console.log("Button clicked for category:", category)
                          handleRemoveCategory(category)
                        }}
                        className="ml-1 hover:bg-gray-200 rounded-full p-1 transition-colors flex items-center justify-center"
                        aria-label={`Remove ${categoryLabel} filter`}
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Category Checkboxes */}
          {categoriesLoading ? (
            <div className="text-sm text-gray-500">Loading categories...</div>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox
                  id={category.value}
                  checked={selectedCategories.includes(category.value)}
                  onCheckedChange={(checked) => handleCategoryChange(category.value, checked as boolean)}
                />
                <Label htmlFor={category.value} className="capitalize cursor-pointer flex-1">
                  {category.label}
                </Label>
                <span className="text-xs text-gray-500">({category.count})</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No categories available</div>
          )}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle>Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider value={priceRange} onValueChange={handlePriceChange} max={maxPrice} step={10} className="w-full" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader>
          <CardTitle>Minimum Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={minRating === rating}
                  onCheckedChange={(checked) => handleRatingChange(rating, checked as boolean)}
                />
                <Label htmlFor={`rating-${rating}`} className="cursor-pointer">
                  {rating}+ Stars
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clear Filters Button */}
      {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice || minRating > 0) && (
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" className="w-full" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
