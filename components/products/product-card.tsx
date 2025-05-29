"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAddToCart } from "@/hooks/use-cart"
import { useUser } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)
  const { data: user } = useUser()
  const addToCartMutation = useAddToCart()
  const router = useRouter()
  const { toast } = useToast()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking the button

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

    addToCartMutation.mutate({
      product_id: product.id,
      quantity: 1,
    })
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

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
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
              <Badge variant="destructive" className="absolute top-2 left-2" aria-label="Out of stock">
                Out of Stock
              </Badge>
            )}

            {/* Low Stock Badge */}
            {product.stock > 0 && product.stock <= 5 && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-orange-100 text-orange-800"
                aria-label={`Only ${product.stock} left in stock`}
              >
                Only {product.stock} left
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>

            {product.description && <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>}

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

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addToCartMutation.isPending}
          className="w-full"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
          {addToCartMutation.isPending ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
