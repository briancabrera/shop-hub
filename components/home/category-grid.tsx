"use client"

import Link from "next/link"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"

export function CategoryGrid() {
  const { data: categories = [], isLoading, error } = useCategories()

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-300 aspect-[4/3] rounded-lg"></div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
        <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
      </div>

      {displayCategories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {displayCategories.map((category) => (
            <Link
              key={category.value}
              href={`/products?category=${category.value}`}
              className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/3] hover:shadow-lg transition-shadow"
            >
              <img
                src={`/placeholder.svg?height=200&width=300&query=${category.label} category`}
                alt={category.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-xl font-semibold">{category.label}</h3>
                  <p className="text-sm opacity-90">{category.count} products</p>
                </div>
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
