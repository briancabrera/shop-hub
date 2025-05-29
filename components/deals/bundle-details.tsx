"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, Tag, Package, Star, ShoppingCart, Heart, Share2, Users, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import type { Bundle } from "@/types/deals"
import { formatTimeRemaining, getDiscountBadgeColor, isValidBundle } from "@/lib/deals/utils"

interface BundleDetailsProps {
  bundle: Bundle & {
    items: Array<{
      id: string
      quantity: number
      product: any
    }>
    original_price: number
    discounted_price: number
  }
}

export function BundleDetails({ bundle }: BundleDetailsProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { toast } = useToast()
  const { addToCartMutation = { isPending: false, mutate: () => {} } } = useCart()

  const isValid = isValidBundle(bundle)
  const savings = bundle.original_price - bundle.discounted_price
  const timeRemaining = formatTimeRemaining(bundle.end_date)
  const badgeColor = getDiscountBadgeColor(bundle.discount_type, bundle.discount_value)

  // Calculate progress for limited bundles
  const usageProgress = bundle.max_uses ? (bundle.current_uses / bundle.max_uses) * 100 : 0

  const handleAddBundle = () => {
    if (!isValid) return

    // Add all bundle items to cart
    bundle.items?.forEach((item) => {
      if (item.product && item.product.stock > 0) {
        addToCartMutation?.mutate({
          product_id: item.product.id,
          quantity: item.quantity,
        })
      }
    })

    toast({
      title: "Bundle added to cart!",
      description: `${bundle.items?.length} items added to your cart`,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bundle.title,
          text: bundle.description,
          url: window.location.href,
        })
      } catch (error) {
        navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied!",
          description: "Bundle link copied to clipboard",
        })
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Bundle link copied to clipboard",
      })
    }
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted ? "Bundle removed from your wishlist" : "You'll be notified of similar bundles",
    })
  }

  const averageRating =
    bundle.items?.reduce((acc, item) => acc + (item.product?.rating || 0), 0) / (bundle.items?.length || 1)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/deals" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Deals
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bundle Image */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={bundle.image_url || "/placeholder.svg?height=480&width=640&query=bundle"}
              alt={bundle.title}
              fill
              className="object-cover"
              priority
            />

            {/* Bundle Badges */}
            <div className="absolute top-4 left-4 space-y-2">
              <Badge className={`${badgeColor} text-white font-bold text-lg px-3 py-1`}>
                <Tag className="w-4 h-4 mr-2" />
                {bundle.discount_type === "percentage"
                  ? `${bundle.discount_value}% OFF`
                  : `$${bundle.discount_value} OFF`}
              </Badge>

              <Badge variant="secondary" className="bg-blue-600 text-white">
                <Package className="w-4 h-4 mr-1" />
                {bundle.items?.length} ITEMS
              </Badge>
            </div>

            {!isValid && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="secondary" className="text-xl font-bold px-6 py-2">
                  BUNDLE EXPIRED
                </Badge>
              </div>
            )}
          </div>

          {/* Bundle Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{averageRating.toFixed(1)} average rating</span>
          </div>
        </div>

        {/* Bundle Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{bundle.title}</h1>
            <p className="text-lg text-muted-foreground">
              Complete bundle with {bundle.items?.length} carefully selected items
            </p>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">${bundle.discounted_price.toFixed(2)}</span>
              <span className="text-2xl text-muted-foreground line-through">${bundle.original_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">
                Bundle saves ${savings.toFixed(2)} ({Math.round((savings / bundle.original_price) * 100)}%)
              </span>
            </div>
          </div>

          {/* Time Remaining */}
          {isValid && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Bundle ends in: {timeRemaining}</span>
                </div>
                {bundle.max_uses && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{bundle.max_uses - bundle.current_uses} remaining</span>
                      <span>
                        {bundle.current_uses}/{bundle.max_uses} claimed
                      </span>
                    </div>
                    <Progress value={usageProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {bundle.description && (
            <div>
              <h3 className="font-semibold mb-2">About this bundle</h3>
              <p className="text-muted-foreground leading-relaxed">{bundle.description}</p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddBundle}
              disabled={!isValid || addToCartMutation?.isPending}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {addToCartMutation?.isPending
                ? "Adding Bundle..."
                : `Add Bundle - $${bundle.discounted_price.toFixed(2)}`}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlist}
              className={isWishlisted ? "text-red-600 border-red-600" : ""}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
            </Button>

            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Bundle Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Bundle Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">People bought this bundle</span>
                <span className="font-semibold">{bundle.current_uses}</span>
              </div>
              {bundle.max_uses && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bundles remaining</span>
                  <span className="font-semibold">{bundle.max_uses - bundle.current_uses}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total items</span>
                <span className="font-semibold">{bundle.items?.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bundle Items */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">What's included in this bundle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundle.items?.map((item, index) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={item.product?.image_url || "/placeholder.svg?height=300&width=300&query=product"}
                  alt={item.product?.name || "Product"}
                  fill
                  className="object-cover"
                />
                {item.quantity > 1 && <Badge className="absolute top-2 right-2 bg-blue-600">{item.quantity}x</Badge>}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{item.product?.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${item.product?.price?.toFixed(2)}</span>
                  <Badge variant="secondary">{item.product?.category}</Badge>
                </div>
                {item.product?.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-muted-foreground">{item.product.rating}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bundle Value Breakdown */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Bundle Value Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bundle.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{item.quantity}x</span>
                    <span>{item.product?.name}</span>
                  </div>
                  <span className="font-medium">${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Individual Total:</span>
                <span className="line-through text-muted-foreground">${bundle.original_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Bundle Discount:</span>
                <span className="text-green-600 font-bold">-${savings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-primary">
                <span>Bundle Price:</span>
                <span>${bundle.discounted_price.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
