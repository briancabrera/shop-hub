"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Tag, Zap } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Deal } from "@/types/deals"
import { calculateDealPrice, formatTimeRemaining, getDiscountBadgeColor, isValidDeal } from "@/lib/deals/utils"

interface DealCardProps {
  deal: Deal
  onAddToCart?: (productId: string) => void
}

export function DealCard({ deal, onAddToCart }: DealCardProps) {
  const isValid = isValidDeal(deal)
  const originalPrice = deal.product?.price || 0
  const discountedPrice = calculateDealPrice(originalPrice, deal)
  const savings = originalPrice - discountedPrice
  const timeRemaining = formatTimeRemaining(deal.end_date)
  const badgeColor = getDiscountBadgeColor(deal.discount_type, deal.discount_value)

  if (!deal.product) return null

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg h-[550px] flex flex-col ${!isValid ? "opacity-60" : ""}`}
    >
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className={`${badgeColor} text-white font-bold`}>
          <Tag className="w-3 h-3 mr-1" />
          {deal.discount_type === "percentage" ? `${deal.discount_value}% OFF` : `$${deal.discount_value} OFF`}
        </Badge>
      </div>

      {/* Flash Sale Indicator */}
      {isValid && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            DEAL
          </Badge>
        </div>
      )}

      <div className="flex flex-col h-full">
        <Link href={`/products/${deal.product.id}`} className="block flex-grow">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Image - Fixed height */}
            <div className="relative h-40 overflow-hidden">
              <Image
                src={deal.product.image_url || "/placeholder.svg?height=300&width=300&query=product"}
                alt={deal.product.name}
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

            <div className="p-4 flex-grow flex flex-col">
              {/* Title - Fixed height with ellipsis */}
              <h3 className="font-semibold text-lg h-14 line-clamp-2 mb-2">{deal.title}</h3>

              {/* Description - Fixed height with ellipsis */}
              {deal.description && (
                <p className="text-sm text-muted-foreground h-10 line-clamp-2 mb-2">{deal.description}</p>
              )}

              {/* Time Remaining - Fixed height */}
              {isValid && (
                <div className="flex items-center gap-1 text-sm text-orange-600 h-6 mb-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">{timeRemaining} left</span>
                </div>
              )}

              {/* Usage Limit - Fixed height */}
              {deal.max_uses && (
                <div className="text-xs text-muted-foreground h-5 mb-2">
                  {deal.max_uses - deal.current_uses} of {deal.max_uses} remaining
                </div>
              )}

              {/* Spacer to push content to bottom */}
              <div className="flex-grow"></div>
            </div>
          </CardContent>
        </Link>

        {/* Price Section - Fixed at bottom */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">${discountedPrice.toFixed(2)}</span>
            <span className="text-lg text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
          </div>
          <div className="text-sm text-green-600 font-medium">You save ${savings.toFixed(2)}</div>
        </div>

        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline" className="flex-1 h-10" disabled={!isValid}>
              <Link href={`/products/${deal.product.id}`}>View Details</Link>
            </Button>

            {onAddToCart && (
              <Button
                onClick={() => onAddToCart(deal.id)}
                className="flex-1 h-10"
                disabled={!isValid || deal.product.stock === 0}
              >
                {deal.product.stock === 0 ? "Out of Stock" : "Add Deal to Cart"}
              </Button>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
