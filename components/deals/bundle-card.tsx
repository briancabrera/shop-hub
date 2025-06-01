"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Package, Tag, Users } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Bundle } from "@/types/deals"
import { formatTimeRemaining, getDiscountBadgeColor, isValidBundle } from "@/lib/deals/utils"

interface BundleCardProps {
  bundle: Bundle
  onAddToCart?: (bundleId: string) => void
}

export function BundleCard({ bundle, onAddToCart }: BundleCardProps) {
  const isValid = isValidBundle(bundle)
  const timeRemaining = formatTimeRemaining(bundle.end_date)
  const badgeColor = getDiscountBadgeColor(bundle.discount_type, bundle.discount_value)
  const savings = (bundle.original_price || 0) - (bundle.discounted_price || 0)

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg h-[580px] flex flex-col ${!isValid ? "opacity-60" : ""}`}
    >
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className={`${badgeColor} text-white font-bold`}>
          <Tag className="w-3 h-3 mr-1" />
          {bundle.discount_type === "percentage" ? `${bundle.discount_value}% OFF` : `$${bundle.discount_value} OFF`}
        </Badge>
      </div>

      {/* Bundle Indicator */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant="secondary">
          <Package className="w-3 h-3 mr-1" />
          BUNDLE
        </Badge>
      </div>

      <div className="flex flex-col h-full">
        <CardHeader className="p-0">
          {/* Image - Fixed height */}
          <div className="relative h-40 overflow-hidden">
            <Image
              src={bundle.image_url || "/placeholder.svg?height=240&width=320&query=bundle"}
              alt={bundle.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {!isValid && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-lg font-bold">
                  EXPIRED
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <Link href={`/bundles/${bundle.id}`} className="block flex-grow">
          <CardContent className="p-4 h-full flex flex-col">
            {/* Title - Fixed height with ellipsis */}
            <h3 className="font-bold text-xl h-14 line-clamp-2 mb-2">{bundle.title}</h3>

            {/* Description - Fixed height with ellipsis */}
            {bundle.description && (
              <p className="text-sm text-muted-foreground h-10 line-clamp-2 mb-3">{bundle.description}</p>
            )}

            {/* Bundle Items Preview - Fixed height */}
            {bundle.items && bundle.items.length > 0 && (
              <div className="h-16 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{bundle.items.length} items included</span>
                </div>
                <div className="flex -space-x-2">
                  {bundle.items.slice(0, 4).map((item, index) => (
                    <Avatar key={item.id} className="w-8 h-8 border-2 border-background">
                      <AvatarImage src={item.product?.image_url || "/placeholder.svg"} alt={item.product?.name} />
                      <AvatarFallback className="text-xs">{item.product?.name?.charAt(0) || "P"}</AvatarFallback>
                    </Avatar>
                  ))}
                  {bundle.items.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium">+{bundle.items.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Time Remaining - Fixed height */}
            {isValid && (
              <div className="flex items-center gap-1 text-sm text-orange-600 h-6 mb-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">{timeRemaining} left</span>
              </div>
            )}

            {/* Usage Limit - Fixed height */}
            {bundle.max_uses && (
              <div className="text-xs text-muted-foreground h-5 mb-2">
                {bundle.max_uses - bundle.current_uses} of {bundle.max_uses} remaining
              </div>
            )}

            {/* Spacer to push content to bottom */}
            <div className="flex-grow"></div>
          </CardContent>
        </Link>

        {/* Price Section - Fixed at bottom */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">${(bundle.discounted_price || 0).toFixed(2)}</span>
            <span className="text-lg text-muted-foreground line-through">
              ${(bundle.original_price || 0).toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-green-600 font-medium">Bundle saves ${savings.toFixed(2)}</div>
        </div>

        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline" className="flex-1 h-10" disabled={!isValid}>
              <Link href={`/bundles/${bundle.id}`}>View Bundle</Link>
            </Button>

            {onAddToCart && (
              <Button onClick={() => onAddToCart(bundle.id)} className="flex-1 h-10" disabled={!isValid}>
                Add Bundle to Cart
              </Button>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
