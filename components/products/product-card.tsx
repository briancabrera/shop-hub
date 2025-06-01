"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart, Clock, Zap, Tag } from "lucide-react"
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

  const handleAddProduct = async (e: React.MouseEvent) => {
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

    // Add regular product to cart
    const cartItem = {
      item_type: "product",
      product_id: product.id,
      quantity: 1,
    }

    console.log("🔵 Adding PRODUCT to cart:", JSON.stringify(cartItem, null, 2))
    addToCartMutation.mutate(cartItem)
  }

  const handleAddDeal = async (e: React.MouseEvent) => {
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

    if (!product.best_deal) {
      toast({
        title: "Deal not available",
        description: "This deal is no longer available",
        variant: "destructive",
      })
      return
    }

    // Add deal to cart
    const cartItem = {
      item_type: "deal",
      deal_id: product.best_deal.id,
      quantity: 1,
    }

    console.log("🔴 Adding DEAL to cart:", JSON.stringify(cartItem, null, 2))
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
    <Card className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden h-[550px] flex flex-col">
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

      <div className="flex flex-col h-full">
        <Link href={`/products/${product.id}`} className="block flex-grow">
          <CardContent className="p-4 h-full flex flex-col">
            {/* Product Image - Fixed height */}
            <div className="relative h-40 mb-3 overflow-hidden rounded-lg bg-gray-100">
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

            {/* Product Info - Fixed structure */}
            <div className="flex-grow flex flex-col">
              {/* Title - Fixed height with ellipsis */}
              <h3 className="font-semibold text-lg h-14 line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                {product.name}
              </h3>

              {/* Description - Fixed height with ellipsis */}
              {product.description && (
                <p className="text-sm text-gray-600 h-10 line-clamp-2 mb-1">{product.description}</p>
              )}

              {/* Deal Title - Fixed height with ellipsis */}
              {hasActiveDeal && bestDeal && (
                <div className="flex items-center gap-1 h-6 mb-1 overflow-hidden">
                  <Tag className="w-3 h-3 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-600 truncate">{bestDeal.title}</p>
                </div>
              )}

              {/* Rating - Fixed height */}
              {product.rating && (
                <div className="flex items-center gap-1 h-5 mb-1">
                  <div className="flex" role="img" aria-label={`${product.rating} out of 5 stars`}>
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">({product.rating.toFixed(1)})</span>
                </div>
              )}

              {/* Category - Fixed height */}
              <div className="h-6 mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              </div>

              {/* Spacer to push content to bottom */}
              <div className="flex-grow"></div>
            </div>
          </CardContent>
        </Link>

        {/* Price Section - Fixed at bottom */}
        <div className="px-4 mb-2">
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

        <CardFooter className="p-4 pt-0 flex flex-col gap-1.5">
          {/* Deal Button */}
          {hasActiveDeal && (
            <Button
              onClick={handleAddDeal}
              disabled={product.stock === 0 || addToCartMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 h-10"
              aria-label={`Add ${product.name} deal to cart`}
            >
              <Tag className="w-4 h-4 mr-2" aria-hidden="true" />
              {addToCartMutation.isPending
                ? "Adding Deal..."
                : product.stock === 0
                  ? "Out of Stock"
                  : `Add Deal - ${formatPrice(discountedPrice || originalPrice)}`}
            </Button>
          )}

          {/* Regular Product Button */}
          <Button
            onClick={handleAddProduct}
            disabled={product.stock === 0 || addToCartMutation.isPending}
            variant={hasActiveDeal ? "outline" : "default"}
            className="w-full h-10"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
            {addToCartMutation.isPending
              ? "Adding..."
              : product.stock === 0
                ? "Out of Stock"
                : `Add Product - ${formatPrice(originalPrice)}`}
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}
