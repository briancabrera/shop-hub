"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, Tag, Zap, Star, ShoppingCart, Heart, Share2, Users, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import type { Deal } from "@/types/deals"
import { calculateDealPrice, formatTimeRemaining, getDiscountBadgeColor, isValidDeal } from "@/lib/deals/utils"

interface DealDetailsProps {
  deal: Deal & {
    product: any
  }
}

export function DealDetails({ deal }: DealDetailsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { toast } = useToast()
  const { addToCartMutation } = useCart()

  const isValid = isValidDeal(deal)
  const originalPrice = deal.product?.price || 0
  const discountedPrice = calculateDealPrice(originalPrice, deal)
  const savings = originalPrice - discountedPrice
  const timeRemaining = formatTimeRemaining(deal.end_date)
  const badgeColor = getDiscountBadgeColor(deal.discount_type, deal.discount_value)

  // Calculate progress for limited deals
  const usageProgress = deal.max_uses ? (deal.current_uses / deal.max_uses) * 100 : 0

  const handleAddToCart = () => {
    if (!isValid || deal.product.stock === 0) return

    addToCartMutation.mutate({
      product_id: deal.product.id,
      quantity,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: deal.description,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied!",
          description: "Deal link copied to clipboard",
        })
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Deal link copied to clipboard",
      })
    }
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted ? "Deal removed from your wishlist" : "You'll be notified of similar deals",
    })
  }

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
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={deal.product?.image_url || "/placeholder.svg?height=600&width=600&query=product"}
              alt={deal.product?.name || "Product"}
              fill
              className="object-cover"
              priority
            />

            {/* Deal Badges */}
            <div className="absolute top-4 left-4 space-y-2">
              <Badge className={`${badgeColor} text-white font-bold text-lg px-3 py-1`}>
                <Tag className="w-4 h-4 mr-2" />
                {deal.discount_type === "percentage" ? `${deal.discount_value}% OFF` : `$${deal.discount_value} OFF`}
              </Badge>

              {isValid && (
                <Badge variant="destructive" className="animate-pulse">
                  <Zap className="w-4 h-4 mr-1" />
                  LIMITED TIME
                </Badge>
              )}
            </div>

            {!isValid && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="secondary" className="text-xl font-bold px-6 py-2">
                  DEAL EXPIRED
                </Badge>
              </div>
            )}
          </div>

          {/* Product Rating */}
          {deal.product?.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(deal.product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {deal.product.rating} ({Math.floor(Math.random() * 500) + 100} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Deal Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{deal.title}</h1>
            <p className="text-lg text-muted-foreground">{deal.product?.name}</p>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">${discountedPrice.toFixed(2)}</span>
              <span className="text-2xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">
                You save ${savings.toFixed(2)} ({Math.round((savings / originalPrice) * 100)}%)
              </span>
            </div>
          </div>

          {/* Time Remaining */}
          {isValid && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Deal ends in: {timeRemaining}</span>
                </div>
                {deal.max_uses && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{deal.max_uses - deal.current_uses} remaining</span>
                      <span>
                        {deal.current_uses}/{deal.max_uses} claimed
                      </span>
                    </div>
                    <Progress value={usageProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {deal.description && (
            <div>
              <h3 className="font-semibold mb-2">About this deal</h3>
              <p className="text-muted-foreground leading-relaxed">{deal.description}</p>
            </div>
          )}

          {/* Product Details */}
          {deal.product?.description && (
            <div>
              <h3 className="font-semibold mb-2">Product Details</h3>
              <p className="text-muted-foreground leading-relaxed">{deal.product.description}</p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(deal.product?.stock || 99, quantity + 1))}
                  disabled={quantity >= (deal.product?.stock || 99)}
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">{deal.product?.stock} in stock</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isValid || deal.product?.stock === 0 || addToCartMutation.isPending}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addToCartMutation.isPending
                  ? "Adding..."
                  : deal.product?.stock === 0
                    ? "Out of Stock"
                    : `Add to Cart - $${(discountedPrice * quantity).toFixed(2)}`}
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
          </div>

          {/* Deal Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Deal Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">People claimed this deal</span>
                <span className="font-semibold">{deal.current_uses}</span>
              </div>
              {deal.max_uses && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deals remaining</span>
                  <span className="font-semibold">{deal.max_uses - deal.current_uses}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="secondary">{deal.product?.category}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
