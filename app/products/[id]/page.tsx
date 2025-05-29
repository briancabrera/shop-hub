"use client"

import React from "react"

import { useState } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, Zap, TrendingUp, Users, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useProduct } from "@/hooks/use-products"
import { useAddToCart } from "@/hooks/use-cart"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import type { ProductWithDeal } from "@/types"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [quantity, setQuantity] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  const {
    data: product,
    isLoading,
    error,
  } = useProduct(params.id) as {
    data: ProductWithDeal | undefined
    isLoading: boolean
    error: any
  }
  const addToCartMutation = useAddToCart()
  const { toast } = useToast()
  const { data: user } = useUser()
  const router = useRouter()

  // Calculate time remaining for deal
  React.useEffect(() => {
    if (!product?.best_deal?.end_date) return

    const updateTimer = () => {
      const now = new Date()
      const endDate = new Date(product.best_deal.end_date)
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Expired")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [product?.best_deal?.end_date])

  const handleAddToCart = () => {
    if (!product) return

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    addToCartMutation.mutate({
      product_id: product.id,
      quantity: quantity,
    })
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = `Check out this ${product?.has_active_deal ? "amazing deal on" : ""} ${product?.name}`

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
        toast({ title: "Link copied to clipboard!" })
      }
    } else {
      navigator.clipboard.writeText(url)
      toast({ title: "Link copied to clipboard!" })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600">Product not found</p>
        </div>
      </div>
    )
  }

  const originalPrice = product.price
  const discountedPrice = product.discounted_price
  const hasActiveDeal = product.has_active_deal
  const bestDeal = product.best_deal
  const savings = product.savings || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Deal Alert Banner */}
      {hasActiveDeal && bestDeal && (
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-red-800">{bestDeal.title}</h3>
                  <p className="text-red-600">{bestDeal.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-red-600">
                    <Timer className="w-4 h-4" />
                    <span className="font-mono font-bold">{timeRemaining}</span>
                  </div>
                  <p className="text-sm text-red-500">Time remaining</p>
                </div>
                {bestDeal.max_uses && (
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Users className="w-4 h-4" />
                      <span className="font-bold">{bestDeal.max_uses - bestDeal.current_uses} left</span>
                    </div>
                    <p className="text-sm text-orange-500">Available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Deal Progress */}
            {bestDeal.max_uses && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Deal Progress</span>
                  <span>
                    {bestDeal.current_uses}/{bestDeal.max_uses} claimed
                  </span>
                </div>
                <Progress value={(bestDeal.current_uses / bestDeal.max_uses) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
            <Image
              src={product.image_url || "/placeholder.svg?height=500&width=500&query=product"}
              alt={product.name}
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />

            {/* Deal Badge on Image */}
            {hasActiveDeal && bestDeal && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-lg px-3 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  {bestDeal.discount_type === "percentage"
                    ? `${bestDeal.discount_value}% OFF`
                    : `$${bestDeal.discount_value} OFF`}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">{product.rating || 0} rating</span>
            </div>

            {/* Price Section */}
            <div className="mb-6">
              {hasActiveDeal && discountedPrice ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-green-600">{formatPrice(discountedPrice)}</span>
                    <span className="text-2xl text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Save {formatPrice(savings)}
                    </Badge>
                    <span className="text-sm text-green-600 font-medium">
                      ({Math.round((savings / originalPrice) * 100)}% off)
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">{formatPrice(originalPrice)}</span>
              )}
            </div>

            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-500">{product.stock} in stock</span>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  className={`flex-1 ${
                    hasActiveDeal
                      ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      : ""
                  }`}
                  size="lg"
                  disabled={product.stock === 0 || addToCartMutation.isPending}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addToCartMutation.isPending
                    ? "Adding..."
                    : hasActiveDeal
                      ? `Add to Cart - ${formatPrice(discountedPrice || originalPrice)}`
                      : "Add to Cart"}
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {hasActiveDeal && <TabsTrigger value="deal">Deal Details</TabsTrigger>}
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose max-w-none">
              <p className="text-gray-700">{product.description}</p>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Category:</span>
                <span className="text-gray-600">{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Stock:</span>
                <span className="text-gray-600">{product.stock} units</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{product.rating}</div>
                <div className="flex justify-center items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mt-2">Based on customer reviews</p>
              </div>

              <div className="text-center text-gray-500">
                <p>Customer reviews will be displayed here.</p>
              </div>
            </div>
          </TabsContent>

          {hasActiveDeal && bestDeal && (
            <TabsContent value="deal" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{bestDeal.title}</h3>
                      <p className="text-gray-600">{bestDeal.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {bestDeal.discount_type === "percentage"
                            ? `${bestDeal.discount_value}%`
                            : formatPrice(bestDeal.discount_value)}
                        </div>
                        <p className="text-sm text-gray-600">Discount</p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{timeRemaining}</div>
                        <p className="text-sm text-gray-600">Time Left</p>
                      </div>

                      {bestDeal.max_uses && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {bestDeal.max_uses - bestDeal.current_uses}
                          </div>
                          <p className="text-sm text-gray-600">Remaining</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Deal started: {new Date(bestDeal.start_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Deal ends: {new Date(bestDeal.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
