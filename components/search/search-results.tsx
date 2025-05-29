"use client"

import Image from "next/image"
import { Search, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SearchResult } from "@/types/api"

interface SearchResultsProps {
  results: SearchResult[]
  suggestions?: string[]
  query: string
  selectedIndex: number
  onResultClick: (productId: string) => void
  onViewAllResults: () => void
  isLoading: boolean
}

export function SearchResults({
  results,
  suggestions = [],
  query,
  selectedIndex,
  onResultClick,
  onViewAllResults,
  isLoading,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
        <div className="p-4 text-center">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (query.length < 2) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
        <div className="p-4 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Start typing to search products...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0 && suggestions.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
        <div className="p-4 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No products found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or check spelling</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1 max-h-96 overflow-y-auto">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-3">
          <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Suggestions
          </div>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                onClick={() => onViewAllResults()}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Separator if both suggestions and results exist */}
      {suggestions.length > 0 && results.length > 0 && <Separator />}

      {/* Product Results */}
      {results.length > 0 && (
        <div className="p-3">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
            <span>Products</span>
            <span>{results.length} found</span>
          </div>
          <div className="space-y-1">
            {results.map((product, index) => (
              <button
                key={product.id}
                className={`w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors ${
                  selectedIndex === index ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => onResultClick(product.id)}
              >
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={product.image_url || "/placeholder.svg?height=48&width=48&query=product"}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {product.highlight?.name ? (
                      <span dangerouslySetInnerHTML={{ __html: product.highlight.name }} />
                    ) : (
                      product.name
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {product.category && <span className="capitalize">{product.category.replace(/-/g, " ")} • </span>}
                    <span className="font-medium text-gray-900">${product.price.toFixed(2)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* View All Results Button */}
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-center text-sm" onClick={onViewAllResults}>
            View all results for "{query}"
          </Button>
        </div>
      )}
    </div>
  )
}
