"use client"

import { useState } from "react"
import { Flame, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DealCard } from "./deal-card"
import { BundleCard } from "./bundle-card"
import { useActiveDeals } from "@/hooks/use-deals"
import { useActiveBundles } from "@/hooks/use-bundles"
import { useAddToCart } from "@/hooks/use-cart"
import Link from "next/link"

export function DealsSection() {
  const [currentDealIndex, setCurrentDealIndex] = useState(0)
  const [currentBundleIndex, setCurrentBundleIndex] = useState(0)

  const { data: deals, isLoading: dealsLoading, error: dealsError } = useActiveDeals()
  const { data: bundles, isLoading: bundlesLoading, error: bundlesError } = useActiveBundles()
  const addToCartMutation = useAddToCart()

  const handleAddToCart = (dealId: string) => {
    console.log("🔥 Adding DEAL from deals section:", dealId)
    addToCartMutation.mutate({
      item_type: "deal",
      deal_id: dealId,
      quantity: 1,
    })
  }

  const handleAddBundleToCart = (bundleId: string) => {
    console.log("🎁 Adding BUNDLE from deals section:", bundleId)
    addToCartMutation.mutate({
      item_type: "bundle",
      bundle_id: bundleId,
      quantity: 1,
    })
  }

  // Show only first 6 deals and bundles
  const displayDeals = deals?.slice(0, 6) || []
  const displayBundles = bundles?.slice(0, 6) || []

  const itemsPerPage = 3
  const maxDealIndex = Math.max(0, displayDeals.length - itemsPerPage)
  const maxBundleIndex = Math.max(0, displayBundles.length - itemsPerPage)

  const nextDeals = () => {
    setCurrentDealIndex((prev) => Math.min(prev + itemsPerPage, maxDealIndex))
  }

  const prevDeals = () => {
    setCurrentDealIndex((prev) => Math.max(prev - itemsPerPage, 0))
  }

  const nextBundles = () => {
    setCurrentBundleIndex((prev) => Math.min(prev + itemsPerPage, maxBundleIndex))
  }

  const prevBundles = () => {
    setCurrentBundleIndex((prev) => Math.max(prev - itemsPerPage, 0))
  }

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Hot Deals & Bundles
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Limited time offers and exclusive bundles. Don't miss out on these amazing savings!
          </p>
          <Badge variant="secondary" className="mt-4 text-red-600 bg-red-100">
            <Flame className="w-4 h-4 mr-2" />
            {displayDeals.length + displayBundles.length} active offers
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deals" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 h-12">
            <TabsTrigger value="deals" className="flex items-center gap-2 text-base">
              <Flame className="w-5 h-5" />
              Flash Deals
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5" />
              Bundles
            </TabsTrigger>
          </TabsList>

          {/* Deals Tab */}
          <TabsContent value="deals">
            {dealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : dealsError ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-red-600">Failed to load deals. Please try again.</p>
                </CardContent>
              </Card>
            ) : !displayDeals.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Flame className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deals</h3>
                  <p className="text-gray-600">Check back soon for new flash deals!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                {/* Carousel Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevDeals}
                      disabled={currentDealIndex === 0}
                      className="p-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextDeals}
                      disabled={currentDealIndex >= maxDealIndex}
                      className="p-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Link href="/deals">
                    <Button variant="ghost" className="text-red-600 hover:text-red-700">
                      View All Deals →
                    </Button>
                  </Link>
                </div>

                {/* Deals Carousel */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out gap-6"
                    style={{ transform: `translateX(-${currentDealIndex * (100 / itemsPerPage)}%)` }}
                  >
                    {displayDeals.map((deal) => (
                      <div key={deal.id} className="flex-none w-full md:w-1/2 lg:w-1/3">
                        <DealCard deal={deal} onAddToCart={handleAddToCart} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles">
            {bundlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bundlesError ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-red-600">Failed to load bundles. Please try again.</p>
                </CardContent>
              </Card>
            ) : !displayBundles.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bundles</h3>
                  <p className="text-gray-600">Check back soon for new bundle deals!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                {/* Carousel Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevBundles}
                      disabled={currentBundleIndex === 0}
                      className="p-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextBundles}
                      disabled={currentBundleIndex >= maxBundleIndex}
                      className="p-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Link href="/deals">
                    <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                      View All Bundles →
                    </Button>
                  </Link>
                </div>

                {/* Bundles Carousel */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out gap-6"
                    style={{ transform: `translateX(-${currentBundleIndex * (100 / itemsPerPage)}%)` }}
                  >
                    {displayBundles.map((bundle) => (
                      <div key={bundle.id} className="flex-none w-full md:w-1/2 lg:w-1/3">
                        <BundleCard bundle={bundle} onAddToCart={handleAddBundleToCart} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
