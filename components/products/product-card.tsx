"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAddToCart } from "@/hooks/use-cart"
import { useUser } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { ProductWithDeal } from "@/types"

interface ProductCardProps {
  product: ProductWithDeal
}

export function ProductCard({ product }: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)
  const { data: user } = useUser()
  const addToCartMutation = useAddToCart()
  const router = useRouter()
  const { toast } = useToast()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      })
      return
    }

    // Debug: Log product data
    console.log("🔍 ProductCard Debug - Full product:", JSON.stringify(product, null, 2))
    console.log("🔍 ProductCard Debug - Has active deal:", product.has_active_deal)
    console.log("🔍 ProductCard Debug - Best deal:", product.best_deal)

    // Prepare cart item with deal information if available
    const cartItem = {
      product_id: product.id,
      quantity: 1,
      deal_id: product.has_active_deal && product.best_deal ? product.best_deal.id : null,
      bundle_id: null,
    }

    console.log("🚀 ProductCard: Adding to cart with data:", JSON.stringify(cartItem, null, 2))

    // Show loading toast
    toast({
      title: "Adding to cart...",
      description: product.has_active_deal ? `Adding ${product.name} with deal` : `Adding ${product.name}`,
    })

    addToCartMutation.mutate(cartItem)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
        aria-hidden="true"
      />
    ))
  }

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h left`
    }

    return `${hours}h ${minutes}m left`
  }

  const bestDeal = product.best_deal
  const hasActiveDeal = product.has_active_deal
  const discountedPrice = product.discounted_price
  const originalPrice = product.price

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      {/* Deal Flash Badge */}
      {hasActiveDeal && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            {bestDeal?.discount_type === "percentage"
              ? `${bestDeal.discount_value}% OFF`
              : `$${bestDeal?.discount_value} OFF`}
          </Badge>
        </div>
      )}

      <Link href={`/products/${product.id}`} className="block">
        <CardContent className="p-4">
          {/* Product Image */}
          <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
            {isImageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
            <Image
              src={product.image_url || "/placeholder.svg?height=300&width=300"}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-200 group-hover:scale-105 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Stock Badge */}
            {product.stock === 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2" aria-label="Out of stock">
                Out of Stock
              </Badge>
            )}

            {/* Low Stock Badge */}
            {product.stock > 0 && product.stock <= 5 && !hasActiveDeal && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-orange-100 text-orange-800"
                aria-label={`Only ${product.stock} left in stock`}
              >
                Only {product.stock} left
              </Badge>
            )}

            {/* Deal Timer */}
            {hasActiveDeal && bestDeal && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {calculateTimeRemaining(bestDeal.end_date)}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>

            {product.description && <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>}

            {/* Deal Title */}
            {hasActiveDeal && bestDeal && <p className="text-sm font-medium text-red-600">{bestDeal.title}</p>}

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1">
                <div className="flex" role="img" aria-label={`${product.rating} out of 5 stars`}>
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm text-gray-600 ml-1">({product.rating.toFixed(1)})</span>
              </div>
            )}

            {/* Category */}
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>

            {/* Price Section */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {hasActiveDeal && discountedPrice ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">{formatPrice(discountedPrice)}</span>
                      <span className="text-lg text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      Save {formatPrice(originalPrice - discountedPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(originalPrice)}</span>
                )}
              </div>
            </div>

            {/* Deal Progress */}
            {hasActiveDeal && bestDeal?.max_uses && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Deal Progress</span>
                  <span>
                    {bestDeal.current_uses}/{bestDeal.max_uses} used
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((bestDeal.current_uses / bestDeal.max_uses) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Link>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addToCartMutation.isPending}
          className={`w-full ${hasActiveDeal ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" : ""}`}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
          {addToCartMutation.isPending
            ? "Adding..."
            : product.stock === 0
              ? "Out of Stock"
              : hasActiveDeal
                ? `Add Deal to Cart - ${formatPrice(discountedPrice || originalPrice)}`
                : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
