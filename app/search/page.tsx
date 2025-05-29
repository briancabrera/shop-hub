"use client"

import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/products/product-card"
import { SearchBar } from "@/components/search/search-bar"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/hooks/use-products"
import { Search } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const {
    data: productsResponse,
    isLoading,
    error,
  } = useProducts({
    search: query,
    limit: 24,
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Results</h1>
          <SearchBar className="max-w-2xl" />
        </div>
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-300 aspect-square rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Results</h1>
          <p className="text-red-600 mb-4">Failed to load search results: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const products = productsResponse?.data || []
  const pagination = productsResponse?.pagination

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {query ? `Search Results for "${query}"` : "Search Products"}
        </h1>
        <SearchBar className="max-w-2xl" />
        {query && pagination && (
          <p className="text-gray-600 mt-4">
            Found {pagination.total} {pagination.total === 1 ? "product" : "products"}
          </p>
        )}
      </div>

      {/* Results */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            We couldn't find any products matching "{query}". Try different keywords or check your spelling.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-500">Enter a product name, category, or keyword to find what you're looking for.</p>
        </div>
      )}
    </div>
  )
}
