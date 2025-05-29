"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAddToCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import type { Bundle } from "@/types"

interface BundleCardProps {
  bundle: Bundle
  variant?: "default" | "featured"
}

export function BundleCard({ bundle, variant = "default" }: BundleCardProps) {
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
        description: "Please sign in to add bundles to your cart",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    addToCartMutation.mutate({
      bundle_id: bundle.id,
      quantity: 1,
      is_bundle: true,
    })
  }

  // Calculate savings amount
  const savings = bundle.original_price - bundle.bundle_price
  const savingsPercentage = Math.round((savings / bundle.original_price) * 100)

  // Check if the bundle has a valid date range and if it's active
  const now = new Date()
  const startDate = bundle.start_date ? new Date(bundle.start_date) : null
  const endDate = bundle.end_date ? new Date(bundle.end_date) : null

  const isActive = bundle.status === "active" && (!startDate || startDate <= now) && (!endDate || endDate >= now)

  if (variant === "featured") {
    return (
      <Card className={`overflow-hidden shadow-lg border-2 ${isActive ? "border-blue-500" : "border-gray-200"}`}>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square md:aspect-auto">
            {isImageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
            <Image
              src={bundle.image_url || "/placeholder.svg?height=400&width=400&query=special+offer"}
              alt={bundle.name}
              fill
              className={`object-cover ${isImageLoading ? "opacity-0" : "opacity-100"}`}
              onLoad={() => setIsImageLoading(false)}
              sizes="(max-width: 768px) 100vw, 50vw"
            />

            {bundle.featured && (
              <Badge variant="default" className="absolute top-2 left-2 bg-blue-600 text-white">
                Featured Deal
              </Badge>
            )}

            {!isActive && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {endDate && endDate < now ? "Expired" : "Coming Soon"}
                </Badge>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">{bundle.name}</h3>
              <p className="text-gray-600 mb-4">{bundle.description}</p>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">${bundle.bundle_price.toFixed(2)}</span>
                  <span className="text-lg text-gray-500 line-through">${bundle.original_price.toFixed(2)}</span>
                </div>
                <p className="text-green-600 font-semibold">
                  Save ${savings.toFixed(2)} ({savingsPercentage}% off)
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <p className="font-medium flex items-center gap-2">
                  <Package size={16} />
                  <span>Includes {bundle.products.length} items</span>
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 pl-2 space-y-1">
                  {bundle.products.slice(0, 3).map((item) => (
                    <li key={item.id} className="truncate">
                      {item.quantity > 1 ? `${item.quantity}x ` : ""}
                      {item.product?.name}
                    </li>
                  ))}
                  {bundle.products.length > 3 && (
                    <li className="text-blue-600">+ {bundle.products.length - 3} more items</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddToCart} disabled={!isActive || addToCartMutation.isPending} className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>

              <Button variant="outline" asChild>
                <Link href={`/bundles/${bundle.slug}`}>
                  Details <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <Link href={`/bundles/${bundle.slug}`} className="block">
        <CardContent className="p-4">
          {/* Bundle Image */}
          <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
            {isImageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
            <Image
              src={bundle.image_url || "/placeholder.svg?height=300&width=300&query=bundle+deal"}
              alt={bundle.name}
              fill
              className={`object-cover transition-transform duration-200 group-hover:scale-105 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {bundle.featured && (
              <Badge variant="default" className="absolute top-2 left-2 bg-blue-600 text-white">
                Featured
              </Badge>
            )}

            <Badge variant="secondary" className="absolute top-2 right-2 bg-red-100 text-red-800">
              Save {savingsPercentage}%
            </Badge>

            {!isActive && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg">
                  {endDate && endDate < now ? "Expired" : "Coming Soon"}
                </Badge>
              </div>
            )}
          </div>

          {/* Bundle Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {bundle.name}
            </h3>

            <p className="text-sm text-gray-600 line-clamp-2">{bundle.description}</p>

            <div className="flex items-center text-sm text-gray-600">
              <Package size={16} className="mr-1" />
              <span>{bundle.products.length} items included</span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-blue-600">${bundle.bundle_price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500 line-through">${bundle.original_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={!isActive || addToCartMutation.isPending}
          className="w-full"
          aria-label={`Add ${bundle.name} bundle to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
          {addToCartMutation.isPending ? "Adding..." : "Add Bundle to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
