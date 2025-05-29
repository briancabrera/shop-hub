"use client"

import { useState } from "react"
import { Flame, Package, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DealCard } from "./deal-card"
import { BundleCard } from "./bundle-card"
import { useActiveDeals } from "@/hooks/use-deals"
import { useActiveBundles } from "@/hooks/use-bundles"
import { useAddToCart } from "@/hooks/use-cart"
import type { DealFilters, BundleFilters } from "@/types/deals"

export function DealsSection() {
  const [dealFilters, setDealFilters] = useState<DealFilters>({ active_only: true })
  const [bundleFilters, setBundleFilters] = useState<BundleFilters>({ active_only: true })
  const [sortBy, setSortBy] = useState<string>("newest")

  const { data: deals, isLoading: dealsLoading, error: dealsError } = useActiveDeals()
  const { data: bundles, isLoading: bundlesLoading, error: bundlesError } = useActiveBundles()
  const addToCartMutation = useAddToCart()

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({
      product_id: productId,
      quantity: 1,
    })
  }

  const handleAddBundleToCart = (bundleId: string) => {
    // In a real implementation, you would handle bundle cart logic
    console.log("Adding bundle to cart:", bundleId)
  }

  const sortedDeals = deals?.sort((a, b) => {
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

  const sortedBundles = bundles?.sort((a, b) => {
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

  return (
    <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-8 h-8 text-red-500" />
            <h2 className="text-3xl font-bold text-gray-900">Hot Deals & Bundles</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Limited time offers and exclusive bundles. Save big on your favorite products!
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="discount">Highest Discount</SelectItem>
                <SelectItem value="price">Lowest Price</SelectItem>
                <SelectItem value="ending">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="text-red-600">
              <Flame className="w-3 h-3 mr-1" />
              {(deals?.length || 0) + (bundles?.length || 0)} active offers
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Flash Deals ({deals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Bundles ({bundles?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Deals Tab */}
          <TabsContent value="deals">
            {dealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onAddToCart={handleAddToCart} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles">
            {bundlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} onAddToCart={handleAddBundleToCart} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
