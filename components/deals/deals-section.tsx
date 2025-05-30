"use client"

import { useState } from "react"
import Link from "next/link"
import { Flame, Package, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DealCard } from "./deal-card"
import { BundleCard } from "./bundle-card"
import { useActiveDeals } from "@/hooks/use-deals"
import { useActiveBundles } from "@/hooks/use-bundles"
import { useAddToCart } from "@/hooks/use-cart"
import type { DealFilters, BundleFilters } from "@/types/deals"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

export function DealsSection() {
  const [dealFilters, setDealFilters] = useState<DealFilters>({ active_only: true })
  const [bundleFilters, setBundleFilters] = useState<BundleFilters>({ active_only: true })
  const [sortBy, setSortBy] = useState<string>("discount")

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

  const sortedDeals = deals
    ?.sort((a, b) => {
      switch (sortBy) {
        case "discount":
          return b.discount_value - a.discount_value
        case "price":
          return (a.product?.price || 0) - (b.product?.price || 0)
        case "ending":
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    .slice(0, 6) // Limit to 6 deals

  const sortedBundles = bundles
    ?.sort((a, b) => {
      switch (sortBy) {
        case "discount":
          return b.discount_value - a.discount_value
        case "price":
          return (a.original_price || 0) - (b.original_price || 0)
        case "ending":
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    .slice(0, 4) // Limit to 4 bundles

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <h2 className="text-3xl font-bold text-gray-900">Hot Deals & Bundles</h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Limited time offers and exclusive bundles. Save big on your favorite products!
            </p>
          </div>
          <Link
            href="/deals"
            className="flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700 transition-colors"
          >
            View all deals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deals" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Flash Deals
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Bundles
            </TabsTrigger>
          </TabsList>

          {/* Deals Tab */}
          <TabsContent value="deals">
            {dealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            ) : !sortedDeals?.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Flame className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deals</h3>
                  <p className="text-gray-600">Check back soon for new flash deals!</p>
                </CardContent>
              </Card>
            ) : (
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {sortedDeals.map((deal) => (
                    <CarouselItem key={deal.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <DealCard deal={deal} onAddToCart={handleAddToCart} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-6">
                  <CarouselPrevious className="relative static mr-2 translate-y-0" />
                  <CarouselNext className="relative static ml-2 translate-y-0" />
                </div>
              </Carousel>
            )}
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles">
            {bundlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
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
            ) : !sortedBundles?.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bundles</h3>
                  <p className="text-gray-600">Check back soon for new bundle deals!</p>
                </CardContent>
              </Card>
            ) : (
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {sortedBundles.map((bundle) => (
                    <CarouselItem key={bundle.id} className="md:basis-1/2">
                      <div className="p-1">
                        <BundleCard bundle={bundle} onAddToCart={handleAddBundleToCart} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-6">
                  <CarouselPrevious className="relative static mr-2 translate-y-0" />
                  <CarouselNext className="relative static ml-2 translate-y-0" />
                </div>
              </Carousel>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
