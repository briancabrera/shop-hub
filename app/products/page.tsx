"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "@/components/products/product-card"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSort } from "@/components/products/product-sort"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { useProducts } from "@/hooks/use-products"
import type { ProductFilters as ProductFiltersType } from "@/types/api"
import { SimpleSearchBar } from "@/components/search/simple-search-bar"

const ITEMS_PER_PAGE = 12

export default function ProductsPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ProductFiltersType>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  })
  const [isFiltersLoading, setIsFiltersLoading] = useState(false)

  // Use a ref to track if we've already initialized from URL
  const initializedFromUrl = useRef(false)
  const isUpdatingUrl = useRef(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  const { data: productsResponse, isLoading, error } = useProducts(filters)

  // Function to count active filters (excluding pagination)
  const countActiveFilters = useCallback((filterObj: ProductFiltersType) => {
    let count = 0

    // Count categories
    if (filterObj.categories && filterObj.categories.length > 0) {
      count += filterObj.categories.length
    } else if (filterObj.category) {
      count += 1
    }

    // Count price range (only if different from default)
    if (filterObj.minPrice && filterObj.minPrice > 0) {
      count += 1
    }
    if (filterObj.maxPrice && filterObj.maxPrice < 2500) {
      count += 1
    }

    // Count rating
    if (filterObj.minRating && filterObj.minRating > 0) {
      count += 1
    }

    return count
  }, [])

  // Initialize filters from URL parameters
  useEffect(() => {
    if (initializedFromUrl.current) return

    const initialFilters: ProductFiltersType = {
      page: 1,
      limit: ITEMS_PER_PAGE,
    }

    const categories = searchParams.get("categories")
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const minRating = searchParams.get("minRating")
    const sort = searchParams.get("sort")
    const page = searchParams.get("page")
    const searchQuery = searchParams.get("q")

    if (categories) {
      initialFilters.categories = categories.split(",").filter(Boolean)
    } else if (category) {
      initialFilters.category = category
    }

    if (minPrice) initialFilters.minPrice = Number(minPrice)
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice)
    if (minRating) initialFilters.minRating = Number(minRating)
    if (sort) initialFilters.sort = sort
    if (page) initialFilters.page = Math.max(1, Number(page))
    if (searchQuery) initialFilters.search = searchQuery

    console.log("Setting initial filters from URL:", initialFilters)
    setFilters(initialFilters)

    initializedFromUrl.current = true
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: ProductFiltersType) => {
      // Set flag to prevent URL-triggered updates
      isUpdatingUrl.current = true

      const params = new URLSearchParams()

      if (newFilters.categories && newFilters.categories.length > 0) {
        params.set("categories", newFilters.categories.join(","))
      } else if (newFilters.category) {
        params.set("category", newFilters.category)
      }

      if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice.toString())
      if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice.toString())
      if (newFilters.minRating) params.set("minRating", newFilters.minRating.toString())
      if (newFilters.sort) params.set("sort", newFilters.sort)
      if (newFilters.page && newFilters.page > 1) params.set("page", newFilters.page.toString())
      if (newFilters.search) params.set("q", newFilters.search)

      const queryString = params.toString()
      const newURL = queryString ? `/products?${queryString}` : "/products"

      console.log("Updating URL to:", newURL)

      // Use replace to avoid adding to history for every filter change
      router.replace(newURL, { scroll: false })

      // Reset flag after a short delay to allow for URL update
      setTimeout(() => {
        isUpdatingUrl.current = false
      }, 100)
    },
    [router],
  )

  // Handle filter changes from the filter component
  const handleFilterChange = useCallback(
    (newFilters: ProductFiltersType) => {
      console.log("Filters changed:", newFilters)

      // Skip if we're currently updating from URL
      if (isUpdatingUrl.current) {
        console.log("Skipping filter update due to URL change")
        return
      }

      setIsFiltersLoading(true)

      // Reset to page 1 when filters change
      const filtersWithPagination = {
        ...newFilters,
        page: 1,
        limit: ITEMS_PER_PAGE,
      }

      setFilters(filtersWithPagination)
      updateURL(filtersWithPagination)

      // Clear loading state after a short delay
      setTimeout(() => {
        setIsFiltersLoading(false)
      }, 300)
    },
    [updateURL],
  )

  // Handle search changes from the simple search bar
  const handleSearchChange = useCallback(
    (searchQuery: string) => {
      console.log("Search changed from SimpleSearchBar:", searchQuery)

      // Skip if we're currently updating from URL
      if (isUpdatingUrl.current) {
        console.log("Skipping search update due to URL change")
        return
      }

      setIsFiltersLoading(true)

      // Create new filters with updated search term
      const newFilters = {
        ...filters,
        search: searchQuery.trim() || undefined,
        page: 1, // Reset to page 1 when search changes
      }

      // Remove search property if empty
      if (!searchQuery.trim()) {
        delete newFilters.search
      }

      setFilters(newFilters)
      updateURL(newFilters)

      // Clear loading state after a short delay
      setTimeout(() => {
        setIsFiltersLoading(false)
      }, 300)
    },
    [filters, updateURL],
  )

  // Handle sort change
  const handleSortChange = useCallback(
    (sortValue: string) => {
      console.log("Sort changed:", sortValue)
      setIsFiltersLoading(true)

      // Update filters with new sort value, reset to page 1
      const newFilters = { ...filters, sort: sortValue, page: 1 }
      setFilters(newFilters)
      updateURL(newFilters)

      // Clear loading state after a short delay
      setTimeout(() => {
        setIsFiltersLoading(false)
      }, 300)
    },
    [updateURL, filters],
  )

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      console.log("Page changed:", page)
      setIsFiltersLoading(true)

      const newFilters = { ...filters, page }
      setFilters(newFilters)
      updateURL(newFilters)

      // Scroll to top of products section
      window.scrollTo({ top: 0, behavior: "smooth" })

      // Clear loading state after a short delay
      setTimeout(() => {
        setIsFiltersLoading(false)
      }, 300)
    },
    [updateURL, filters],
  )

  const handleClearFilters = useCallback(() => {
    console.log("Clearing filters")
    const clearedFilters = { page: 1, limit: ITEMS_PER_PAGE }
    setFilters(clearedFilters)
    router.replace("/products", { scroll: false })
  }, [router])

  // Show skeleton only on initial load, not when filters change
  const showInitialSkeleton = isLoading && !initializedFromUrl.current
  const showProductsSkeleton = isLoading || isFiltersLoading

  if (showInitialSkeleton) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-300 aspect-square rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
          <p className="text-red-600 mb-4">Failed to load products: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const products = productsResponse?.data || []
  const pagination = productsResponse?.pagination
  const activeFiltersCount = countActiveFilters(filters)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {filters.search ? `Search Results for "${filters.search}"` : "All Products"}
          </h1>
          <p className="text-gray-600 mt-2">
            {pagination ? (
              <>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </>
            ) : (
              `${products.length} products found`
            )}
            {activeFiltersCount > 0 && (
              <span className="text-blue-600 ml-2">
                ({activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} applied)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ProductSort value={filters.sort} onChange={handleSortChange} />
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
            <Filter className="w-4 h-4 mr-2" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {/* Simple SearchBar - always visible */}
      <div className="mb-6">
        <SimpleSearchBar
          className="max-w-2xl"
          initialQuery={filters.search || ""}
          onSearchChange={handleSearchChange}
          placeholder={filters.search ? "Refine your search..." : "Search products..."}
        />
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}>
          <ProductFilters onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {showProductsSkeleton ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              <Button onClick={handleClearFilters} variant="outline" className="mt-4">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
