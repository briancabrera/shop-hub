"use client"

import Link from "next/link"
import { ProductCard } from "@/components/products/product-card"
import { useProducts } from "@/hooks/use-products"
import { Button } from "@/components/ui/button"
import { Star, TrendingUp } from "lucide-react"

export function FeaturedProducts() {
  const { data: productsResponse, isLoading, error } = useProducts({ limit: 3 })

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Featured Products
              </h2>
            </div>
            <p className="text-xl text-gray-600">Discover our most popular and trending items</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 aspect-square rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-red-600 mb-4">Failed to load products</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </section>
    )
  }

  // Show only first 3 products
  const featuredProducts = productsResponse?.data ? productsResponse.data.slice(0, 3) : []

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Star className="w-8 h-8 text-white fill-current" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Featured Products
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our most popular and trending items, carefully selected for quality and value
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Trending this week</span>
          </div>
        </div>

        {featuredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="group">
                  <div className="relative">
                    {index === 0 && (
                      <div className="absolute -top-3 -right-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                        #1 Bestseller
                      </div>
                    )}
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                <Link href="/products" className="flex items-center gap-2">
                  Explore All Products
                  <TrendingUp className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">No featured products available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  )
}
