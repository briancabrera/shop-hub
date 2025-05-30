"use client"

import Link from "next/link"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CategoryGrid() {
  const { data: categories = [], isLoading, error } = useCategories()

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-300 aspect-square rounded-lg"></div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-red-600 mb-4">Failed to load categories</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </section>
    )
  }

  // Take only the first 6 categories for the grid
  const displayCategories = categories.slice(0, 6)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div className="mb-6 md:mb-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700 transition-colors"
        >
          View all categories
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {displayCategories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {displayCategories.map((category) => (
            <Link
              key={category.value}
              href={`/products?category=${category.value}`}
              className="group relative overflow-hidden rounded-lg bg-white shadow-md aspect-square hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <img
                src={`/placeholder.svg?height=200&width=200&query=${category.label} category product`}
                alt={category.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="text-lg font-semibold group-hover:text-orange-200 transition-colors">
                  {category.label}
                </h3>
                <p className="text-sm opacity-90 flex items-center gap-1 group-hover:text-orange-200">
                  <span>{category.count} products</span>
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No categories available at the moment.</p>
        </div>
      )}
    </section>
  )
}
