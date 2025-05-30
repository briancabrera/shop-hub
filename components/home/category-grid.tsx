"use client"

import Link from "next/link"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import { Grid3X3, ArrowRight, Package } from "lucide-react"

export function CategoryGrid() {
  const { data: categories = [], isLoading, error } = useCategories()

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
                <Grid3X3 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Shop by Category
              </h2>
            </div>
            <p className="text-xl text-gray-600">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-300 aspect-[4/3] rounded-xl"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-red-600 mb-4">Failed to load categories</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </section>
    )
  }

  // Show first 8 categories
  const displayCategories = categories.slice(0, 8)

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
              <Grid3X3 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse through our carefully curated categories to find exactly what you need
          </p>
        </div>

        {displayCategories.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {displayCategories.map((category, index) => (
                <Link
                  key={category.value}
                  href={`/products?category=${category.value}`}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="aspect-[4/3] relative">
                    <img
                      src={`/placeholder.svg?height=200&width=300&query=${category.label} category products`}
                      alt={category.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Category Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg font-bold mb-1">{category.label}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm opacity-90 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {category.count} products
                        </span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Popular Badge for first few categories */}
                    {index < 3 && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        Popular
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 text-lg"
              >
                <Link href="/products" className="flex items-center gap-2">
                  View All Categories
                  <Grid3X3 className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">No categories available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  )
}
