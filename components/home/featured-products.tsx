"use client"

import Link from "next/link"
import { ProductCard } from "@/components/products/product-card"
import { useProducts } from "@/hooks/use-products"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FeaturedProducts() {
  const { data: productsResponse, isLoading, error } = useProducts({ limit: 3 }) // Reduced to 3 products

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <p className="text-lg text-gray-600">Discover our most popular items</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-red-600 mb-4">Failed to load products</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </section>
    )
  }

  // Safely handle products array from paginated response
  const featuredProducts = productsResponse?.data ? productsResponse.data.slice(0, 3) : []

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div className="mb-6 md:mb-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
          <p className="text-lg text-gray-600">Discover our most popular items</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700 transition-colors"
        >
          View all products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {featuredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No featured products available at the moment.</p>
        </div>
      )}
    </section>
  )
}
