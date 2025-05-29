"use client"

import { useBundles } from "@/hooks/use-bundles"
import { BundleCard } from "@/components/bundles/bundle-card"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import Link from "next/link"

export function FeaturedBundles() {
  const {
    data: bundlesResponse,
    isLoading,
    error,
  } = useBundles({
    featured: true,
    active: true,
    limit: 2,
  })

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Special Deals & Bundles</h2>
            <p className="text-lg text-gray-600">Exclusive offers with incredible savings</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md h-96"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || !bundlesResponse?.data) {
    return null // Don't show section if there's an error or no bundles
  }

  // Filter to ensure we only have active bundles
  const featuredBundles = bundlesResponse.data.filter((bundle) => bundle.status === "active")

  if (featuredBundles.length === 0) {
    return null // Don't show section if no featured bundles
  }

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full mb-4">
            Limited Time Offers
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Special Deals & Bundles</h2>
          <p className="text-lg text-gray-600 mb-6">Exclusive bundles with incredible savings - up to 40% off!</p>
          <div className="flex justify-center">
            <Button asChild variant="outline" className="group">
              <Link href="/bundles">
                <Package className="mr-2 h-5 w-5 group-hover:text-blue-600 transition-colors" />
                View All Bundles
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {featuredBundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  )
}
